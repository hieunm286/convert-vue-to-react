import axios from 'axios'
import { sha256 } from '@cosmjs/crypto'
import { fromBase64, toHex } from '@cosmjs/encoding'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { envGetters } from '../env/envSlice'
import SpError from '../../../errors/SpError'

function formatTx({
	txHash = '',
	messages = [],
	memo = '',
	signer_infos = [],
	fee = {},
	gas_used = null,
	gas_wanted = null,
	height = null,
	code = 0,
	log = null,
}) {
	return {
		txHash,
		body: {
			messages,
			memo,
		},
		auth_info: {
			signer_infos,
			fee,
		},
		meta: {
			gas_used,
			gas_wanted,
			height,
			code,
			log,
		},
	}
}

async function getTx(apiCosmos, apiTendermint, encodedTx) {
	const txHash = sha256(fromBase64(encodedTx))
	try {
		const rpcRes = await axios.get(apiTendermint + '/tx?hash=0x' + toHex(txHash))
		const apiRes = await axios.get(apiCosmos + '/cosmos/tx/v1beta1/txs/' + toHex(txHash))
		return { rpcRes, apiRes, txHash: toHex(txHash).toUpperCase() }
	} catch (e) {
		throw 'Error fetching TX data'
	}
}
async function decodeTx(apiCosmos, apiTendermint, encodedTx) {
	const fullTx = await getTx(apiCosmos, apiTendermint, encodedTx)
	const { data } = fullTx.rpcRes
	const { height, tx_result } = data.result
	const { code, log, gas_used, gas_wanted } = tx_result
	const { body, auth_info } = fullTx.apiRes.data.tx
	const { messages, memo } = body

	return formatTx({
		txHash: fullTx.txHash,
		messages,
		memo,
		signer_infos: auth_info.signer_infos,
		fee: auth_info.fee,
		gas_used,
		gas_wanted,
		height,
		code,
		log,
	})
}

const initialState = {
    blocks: [],
    size: 20
}

export const blockSlice = createSlice({
    name: 'blocks',
    initialState,
    reducers: {
        ADD_BLOCK: (state, action) => {
			state.blocks.push(action.payload)
			if (state.blocks.length > state.size) {
				state.blocks.shift()
			}
		},
		RESET_STATE: (state) => {
			state.blocks = []
		},
		SET_SIZE: (state, action) => {
			state.size = action.payload
		}
    }
})

export const { ADD_BLOCK, RESET_STATE, SET_SIZE } = blockSlice.actions;

export const blockGetters = {
    getBlocks: (state, howmany) => {
        return [...state.blocks].sort((a, b) => b.height - a.height).slice(0, howmany)
    },
    getBlockByHeight: (state, height) => {
        return state.blocks.find((x) => x.height == height) || {}
    },
}

const init = () => (dispatch, getState) => {
    if (envGetters.client(getState())) {
        envGetters.client(getState()).on('newblock', (data) => {
            dispatch(addBlock(data))
        })
    }
}
const addBlock = createAsyncThunk('blocks/addBlock', async (blockData, thunkAPI) => {
	const { dispatch, getState } = thunkAPI;
    try {
        const blockDetails = await axios.get(
            envGetters.apiTendermint(getState) + '/block?height=' + blockData.data.value.block.header.height,
        )
        const txDecoded = blockData.data.value.block.data.txs.map(async (tx) => {
            const dec = await decodeTx(envGetters.apiCosmos(getState()), envGetters.apiTendermint(getState()), tx)
            return dec
        })
        const txs = await Promise.all(txDecoded)

        const block = {
            height: blockData.data.value.block.header.height,
            timestamp: blockData.data.value.block.header.time,
            hash: blockDetails.data.result.block_id.hash,
            details: blockData.data.value.block,
            txDecoded: txs,
        }

        dispatch(ADD_BLOCK(block))
    } catch (e) {
        throw new SpError('Blocks:AddBlock', 'Could not add block. RPC node unavailable')
    }
})

const resetState = () => (dispatch) => {
    dispatch(RESET_STATE())
}

export {
    init,
    addBlock,
    resetState
}

export default blockSlice.reducer;