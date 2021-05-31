import StarportSigningClient from './libs/starportSigningClient'
import { IbcClient, Link } from '@confio/relayer/build'
import { Registry, DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { stringToPath } from '@cosmjs/crypto'
import { sleep } from '@cosmjs/utils'
import { GasPrice } from '@cosmjs/launchpad'
import { defaultRegistryTypes } from '@cosmjs/stargate'
import { Tendermint34Client } from '@cosmjs/tendermint-rpc'
import { MsgTransfer } from '@confio/relayer/build/codec/ibc/applications/transfer/v1/tx'
import {
	MsgAcknowledgement,
	MsgChannelOpenAck,
	MsgChannelOpenConfirm,
	MsgChannelOpenInit,
	MsgChannelOpenTry,
	MsgRecvPacket,
	MsgTimeout,
} from '@confio/relayer/build/codec/ibc/core/channel/v1/tx'
import { MsgCreateClient, MsgUpdateClient } from '@confio/relayer/build/codec/ibc/core/client/v1/tx'
import {
	MsgConnectionOpenAck,
	MsgConnectionOpenConfirm,
	MsgConnectionOpenInit,
	MsgConnectionOpenTry,
} from '@confio/relayer/build/codec/ibc/core/connection/v1/tx'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { walletGetters } from '../wallet/walletSlice'
import { envGetters } from '../env/envSlice'
import * as WalletAction from '../wallet/walletSlice'
import SpError from '../../../errors/SpError'

function ibcRegistry() {
	return new Registry([
		...defaultRegistryTypes,
		['/ibc.core.client.v1.MsgCreateClient', MsgCreateClient],
		['/ibc.core.client.v1.MsgUpdateClient', MsgUpdateClient],
		['/ibc.core.connection.v1.MsgConnectionOpenInit', MsgConnectionOpenInit],
		['/ibc.core.connection.v1.MsgConnectionOpenTry', MsgConnectionOpenTry],
		['/ibc.core.connection.v1.MsgConnectionOpenAck', MsgConnectionOpenAck],
		['/ibc.core.connection.v1.MsgConnectionOpenConfirm', MsgConnectionOpenConfirm],
		['/ibc.core.channel.v1.MsgChannelOpenInit', MsgChannelOpenInit],
		['/ibc.core.channel.v1.MsgChannelOpenTry', MsgChannelOpenTry],
		['/ibc.core.channel.v1.MsgChannelOpenAck', MsgChannelOpenAck],
		['/ibc.core.channel.v1.MsgChannelOpenConfirm', MsgChannelOpenConfirm],
		['/ibc.core.channel.v1.MsgRecvPacket', MsgRecvPacket],
		['/ibc.core.channel.v1.MsgAcknowledgement', MsgAcknowledgement],
		['/ibc.core.channel.v1.MsgTimeout', MsgTimeout],
		['/ibc.applications.transfer.v1.MsgTransfer', MsgTransfer],
	])
}
const getDefaultState = () => {
	return {
		relayers: [],
		transientLog: {
			msg: '',
		},
		relayerLinks: {},
	}
}
// initial state
const initialState = getDefaultState()

export const relayersSlice = createSlice({
    name: 'relayer',
    initialState,
    reducers: {
        RESET_STATE: (state) => {
			Object.assign(state, getDefaultState())
		},
		SET_RELAYERS: (state, action) => {
			state.relayers = action.payload
		},
		CREATE_RELAYER: (state, action) => {
			state.relayers = [...state.relayers, action.payload]
		},
		LINK_RELAYER: (state, action) => {
            const { name, link, ...linkDetails } = action.payload;
			let relayerIndex = state.relayers.findIndex((x) => x.name == name)
			if (state.relayers[relayerIndex].status == 'connected') {
				state.relayers[relayerIndex] = {
					...state.relayers[relayerIndex],
					...linkDetails,
					status: 'connected',
				}
			} else {
				state.relayers[relayerIndex] = {
					...state.relayers[relayerIndex],
					...linkDetails,
					status: 'linked',
				}
			}
			state.relayerLinks[name] = link
		},
		CONNECT_RELAYER: (state, action) => {
            const { name, ...channelDetails } = action.payload;
			let relayerIndex = state.relayers.findIndex((x) => x.name == name)
			state.relayers[relayerIndex] = {
				...state.relayers[relayerIndex],
				...channelDetails,
				status: 'connected',
			}
		},
		RUN_RELAYER: (state, action) => {
			state.relayers.find((x) => x.name == action.payload).running = true
		},
		STOP_RELAYER: (state, action) => {
			state.relayers.find((x) => x.name == action.payload).running = false
		},
		SET_LOG_MSG: (state, action) => {
			state.transientLog.msg = action.payload
		},
		LAST_QUERIED_HEIGHTS: (state, action) => {
            const { name, heights } = action.payload
			state.relayers.find((x) => x.name == name).heights = heights
		},
    },
    // extraReducers: {
    //     [createRelayer.fulfilled]: (state, action) => {

    //     }
    // }
})

export const { RESET_STATE, SET_RELAYERS, CREATE_RELAYER, LINK_RELAYER, CONNECT_RELAYER, RUN_RELAYER, STOP_RELAYER, SET_LOG_MSG, LAST_QUERIED_HEIGHTS } = relayersSlice.actions

export const relayersGetters = {
    getRelayer: (state, name) => {
        return state.relayers.find((x) => x.name == name)
    },
    getRelayers: (state) => state.relayers,
    getRelayerLink: (state, name) => {
        return state.relayerLinks[name]
    },
    chainFromChannel: (state, channel) => {
        return state.relayers.find((x) => x.status == 'connected' && x.src?.channelId == channel)?.chainIdB ?? channel
    },
    chainToChannel: (state, channel) => {
        return state.relayers.find((x) => x.status == 'connected' && x.dest?.channelId == channel)?.chainIdB ?? channel
    },
    log: (state) => state.transientLog.msg,
}

const init = () => (dispatch, getState) => {
    dispatch(RESET_STATE());
    const relayers = walletGetters.relayers(getState().wallet);
    dispatch(SET_RELAYERS(relayers));
    relayers.forEach((relayer) => {
        if (relayer.status == 'linked' || relayer.status == 'connected') {
            dispatch(loadRelayer(relayer.name))
        }
    })
}

const createRelayer = createAsyncThunk('relayer/createRelayer', async ({ name, prefix, endpoint, gasPrice, chainId, channelId, external }, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    let relayer
			if (!external) {
				relayer = {
					name,
					prefix,
					endpoint,
					gasPrice,
					external: false,
					status: 'created',
					heights: {},
					running: false,
				}
			} else {
				relayer = {
					name,
					external: true,
					status: 'connected',
					chainIdB: chainId,
					src: {
						channelId: channelId,
					},
				}
			}
			if (!external) {
				const signerA = await DirectSecp256k1HdWallet.fromMnemonic(
					walletGetters.getMnemonic(getState()),
					stringToPath(walletGetters.getPath(getState())),
					envGetters.addrPrefix(getState()),
				)
				const signerB = await DirectSecp256k1HdWallet.fromMnemonic(
					walletGetters.getMnemonic(getState()),
					stringToPath(walletGetters.getPath(getState())),
					relayer.prefix,
				)
				const [accountB] = await signerB.getAccounts()
				const optionsA = {
					prefix: envGetters.addrPrefix(getState()),
					gasPrice: GasPrice.fromString(walletGetters.gasPrice(getState())),
					registry: ibcRegistry(),
				}
				const tmClientA = await Tendermint34Client.connect(envGetters.apiTendermint(getState()))
				const signingClientA = new StarportSigningClient(tmClientA, signerA, optionsA)
				relayer.chainIdA = await signingClientA.getChainId()
				const optionsB = {
					prefix: relayer.prefix,
					gasPrice: GasPrice.fromString(relayer.gasPrice),
					registry: ibcRegistry(),
				}
				const tmClientB = await Tendermint34Client.connect(relayer.endpoint)
				const signingClientB = new StarportSigningClient(tmClientB, signerB, optionsB)
				relayer.chainIdB = await signingClientB.getChainId()
				relayer.targetAddress = accountB.address
			}
			dispatch(CREATE_RELAYER(relayer))
			dispatch(WalletAction.updateRelayers(relayersGetters.getRelayers(getState())))
})

const loadRelayer = createAsyncThunk('relayer/loadRelayer', async (name, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const relayer = relayersGetters.getRelayer(getState(), name)
    if (relayer.status !== 'linked' && relayer.status !== 'connected') {
        throw new SpError('relayers:connectRelayer', 'Relayer already connected.')
    }
    try {
        const signerA = await DirectSecp256k1HdWallet.fromMnemonic(
            walletGetters.getMnemonic(getState()),
            stringToPath(walletGetters.getPath(getState())),
            envGetters.addrPrefix(getState()),
        )
        const signerB = await DirectSecp256k1HdWallet.fromMnemonic(
            walletGetters.getMnemonic(getState()),
            stringToPath(walletGetters.getPath(getState())),
            relayer.prefix,
        )
        const [accountA] = await signerA.getAccounts()
        const [accountB] = await signerB.getAccounts()
        const transientLog = {
            log: (msg) => {
                dispatch(SET_LOG_MSG(msg))
            },
            info: (msg) => {
                dispatch(SET_LOG_MSG(msg))
            },
            error: (msg) => {
                dispatch(SET_LOG_MSG(msg))
            },
            warn: (msg) => {
                dispatch(SET_LOG_MSG(msg))
            },
            verbose: (msg) => {
                dispatch(SET_LOG_MSG(msg))
            },
            debug: () => {
                //commit('SET_LOG_MSG',msg)
            },
        }
        const optionsA = {
            prefix: envGetters.addrPrefix(getState()),
            logger: transientLog,
            gasPrice: GasPrice.fromString(walletGetters.gasPrice(getState())),
            registry: ibcRegistry(),
        }
        const tmClientA = await Tendermint34Client.connect(envGetters.apiTendermint(getState()))
        const signingClientA = new StarportSigningClient(tmClientA, signerA, optionsA)
        const chainIdA = await signingClientA.getChainId()
        const optionsB = {
            prefix: relayer.prefix,
            logger: transientLog,
            gasPrice: GasPrice.fromString(relayer.gasPrice),
            registry: ibcRegistry(),
        }
        const tmClientB = await Tendermint34Client.connect(relayer.endpoint)
        const signingClientB = new StarportSigningClient(tmClientB, signerB, optionsB)
        const chainIdB = await signingClientB.getChainId()

        let clientA = new IbcClient(signingClientA, tmClientA, accountA.address, chainIdA, optionsA)
        let clientB = new IbcClient(signingClientB, tmClientB, accountB.address, chainIdB, optionsB)
        const link = await Link.createWithExistingConnections(
            clientA,
            clientB,
            relayer.endA.connectionID,
            relayer.endB.connectionID,
        )
        const linkData = {
            name,
            link,
            chainIdA,
            chainIdB,
            endA: {
                clientID: link.endA.clientID,
                connectionID: link.endA.connectionID,
            },
            endB: {
                clientID: link.endB.clientID,
                connectionID: link.endB.connectionID,
            },
        }
        dispatch(LINK_RELAYER(linkData))
        dispatch(WalletAction.updateRelayers(relayersGetters.getRelayers(getState())))
        if (relayer.status != 'connected') {
            await dispatch(connectRelayer(relayer.name))
        } else {
            if (relayer.running) {
                dispatch(runRelayer(relayer.name))
            }
        }
    } catch (e) {
        console.error(e)
    }
})

const linkRelayer = createAsyncThunk('relayer/linkRelayer', async ({ name }, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const relayer = relayersGetters.getRelayer(getState(), name);
    if (relayer.status !== 'created') {
        throw new SpError('relayers:connectRelayer', 'Relayer already connected.')
    }
    try {
        const signerA = await DirectSecp256k1HdWallet.fromMnemonic(
            walletGetters.getMnemonic(getState()),
            stringToPath(walletGetters.getPath(getState())),
            envGetters.addrPrefix(getState()),
        )
        const signerB = await DirectSecp256k1HdWallet.fromMnemonic(
            walletGetters.getMnemonic(getState()),
            stringToPath(walletGetters.getPath(getState())),
            relayer.prefix,
        )
        const [accountA] = await signerA.getAccounts()
        const [accountB] = await signerB.getAccounts()
        const transientLog = {
            log: (msg) => {
                dispatch(SET_LOG_MSG(msg))
            },
            info: (msg) => {
                dispatch(SET_LOG_MSG(msg))
            },
            error: (msg) => {
                dispatch(SET_LOG_MSG(msg))
            },
            warn: (msg) => {
                dispatch(SET_LOG_MSG(msg))
            },
            verbose: (msg) => {
                dispatch(SET_LOG_MSG(msg))
            },
            debug: () => {
                //commit('SET_LOG_MSG',msg)
            },
        }
        const optionsA = {
            prefix: envGetters.addrPrefix(getState()),
            logger: transientLog,
            gasPrice: GasPrice.fromString(walletGetters.gasPrice(getState())),
            registry: ibcRegistry(),
        }
        const tmClientA = await Tendermint34Client.connect(envGetters.apiTendermint(getState()))
        const signingClientA = new StarportSigningClient(tmClientA, signerA, optionsA)
        const chainIdA = await signingClientA.getChainId()
        const optionsB = {
            prefix: relayer.prefix,
            logger: transientLog,
            gasPrice: GasPrice.fromString(relayer.gasPrice),
            registry: ibcRegistry(),
        }
        const tmClientB = await Tendermint34Client.connect(relayer.endpoint)
        const signingClientB = new StarportSigningClient(tmClientB, signerB, optionsB)
        const chainIdB = await signingClientB.getChainId()

        let clientA = new IbcClient(signingClientA, tmClientA, accountA.address, chainIdA, optionsA)
        let clientB = new IbcClient(signingClientB, tmClientB, accountB.address, chainIdB, optionsB)
        const link = await Link.createWithNewConnections(clientA, clientB)
        const linkData = {
            name,
            link,
            chainIdA,
            chainIdB,
            endA: {
                clientID: link.endA.clientID,
                connectionID: link.endA.connectionID,
            },
            endB: {
                clientID: link.endB.clientID,
                connectionID: link.endB.connectionID,
            },
        }
        dispatch(LINK_RELAYER(linkData))
        dispatch(WalletAction.updateRelayers(relayersGetters.getRelayers(getState())))
        await dispatch(connectRelayer(name))
    } catch (e) {
        console.error(e)
    }
})

const connectRelayer = createAsyncThunk('relayer/connectRelayer', async (name, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const relayerLink = relayersGetters.getRelayer(getState(), name)
    const channels = await relayerLink.createChannel('A', 'transfer', 'transfer', 1, 'ics20-1')
    const channelData = {
        name,
        ...channels,
    }
    dispatch(CONNECT_RELAYER(channelData))
    dispatch(WalletAction.updateRelayers(relayersGetters.getRelayers(getState())))
    dispatch(runRelayer(name))
})

const runRelayer = createAsyncThunk('relayer/runRelayer', async (name, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const relayerLink = relayersGetters.getRelayer(getState(), name)
    dispatch(RUN_RELAYER(name))
    dispatch(WalletAction.updateRelayers(relayersGetters.getRelayers(getState())))
    dispatch(relayerLoop({
        name,
        link: relayerLink,
        options: { poll: 1, maxAgeDest: 86400, maxAgeSrc: 86400 },
    }))
})

const stopRelayer = (name) => (dispatch) => {
    dispatch(STOP_RELAYER(name))
}

const relayerLoop = createAsyncThunk('relayer/relayerLoop', async ({ name, link, options }, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    let relayer = relayersGetters.getRelayer(getState(), name)
    let nextRelay = relayer.heights ?? {}
    while (relayersGetters.getRelayer(getState(), name).running) {
        try {
            // TODO: make timeout windows more configurable
            nextRelay = await link.checkAndRelayPacketsAndAcks(nextRelay, 2, 6)
            dispatch(LAST_QUERIED_HEIGHTS({ name, heights: nextRelay }))
            dispatch(WalletAction.updateRelayers(relayersGetters.getRelayers(getState())))
            await link.updateClientIfStale('A', options.maxAgeDest)
            await link.updateClientIfStale('B', options.maxAgeSrc)
        } catch (e) {
            console.error(`Caught error: `, e)
        }
        await sleep(options.poll * 1000)
    }
})

export {
    init,
    createRelayer,
    loadRelayer,
    linkRelayer,
    connectRelayer,
    runRelayer,
    stopRelayer,
    relayerLoop
}

export default relayersSlice.reducer;
