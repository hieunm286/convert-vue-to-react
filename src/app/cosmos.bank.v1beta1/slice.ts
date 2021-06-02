// @ts-nocheck 
import { txClient, queryClient, MissingWalletError } from './module'
import { Params } from './module/types/cosmos/bank/v1beta1/bank'
import { SendEnabled } from './module/types/cosmos/bank/v1beta1/bank'
import { Input } from './module/types/cosmos/bank/v1beta1/bank'
import { Output } from './module/types/cosmos/bank/v1beta1/bank'
import { Supply } from './module/types/cosmos/bank/v1beta1/bank'
import { DenomUnit } from './module/types/cosmos/bank/v1beta1/bank'
import { Metadata } from './module/types/cosmos/bank/v1beta1/bank'
import { Balance } from './module/types/cosmos/bank/v1beta1/genesis'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import SpError from '../../redux/errors/SpError'
import { envGetters } from '../../redux/modules/common/env/envSlice';
import { walletGetters } from '../../redux/modules/common/wallet/walletSlice'

export {
	Params,
	SendEnabled,
	Input,
	Output,
	Supply,
	DenomUnit,
	Metadata,
	Balance
}

async function initTxClient(signerWallet, addr) {
    return await txClient(signerWallet, {
      addr: addr,
    });
  }

  async function initQueryClient(addr) {
    return await queryClient({
      addr: addr,
    });
  }

  function mergeResults(value, next_values) {
	for (let prop of Object.keys(next_values)) {
		if (Array.isArray(next_values[prop])) {
			value[prop] = [...value[prop], ...next_values[prop]]
		} else {
			value[prop] = next_values[prop]
		}
	}
	return value
}
function getStructure(template) {
	let structure = { fields: [] }
	for (const [key, value] of Object.entries(template)) {
		let field = {}
		field.name = key
		field.type = typeof value
		structure.fields.push(field)
	}
	return structure
}
const getDefaultState = () => {
	return {
		Balance: {},
		AllBalances: {},
		TotalSupply: {},
		SupplyOf: {},
		Params: {},
		DenomMetadata: {},
		DenomsMetadata: {},
		_Structure: {
			Params: getStructure(Params.fromPartial({})),
			SendEnabled: getStructure(SendEnabled.fromPartial({})),
			Input: getStructure(Input.fromPartial({})),
			Output: getStructure(Output.fromPartial({})),
			Supply: getStructure(Supply.fromPartial({})),
			DenomUnit: getStructure(DenomUnit.fromPartial({})),
			Metadata: getStructure(Metadata.fromPartial({})),
			Balance: getStructure(Balance.fromPartial({}))
		},
		_Subscriptions: new Set()
	}
}
// initial state
const initialState = getDefaultState();

export const cosmosBankV1beta1Slice = createSlice({
    name: 'cosmos.bank.v1beta1',
    initialState,
    reducers: {
        RESET_STATE: (state) => {
            Object.assign(state, getDefaultState());
          },
          QUERY(state, action) {
            const { query, key, value } = action.payload;
            state[query][JSON.stringify(key)] = value;
          },
          SUBSCRIBE(state, subscription) {
            state._Subscriptions.add(subscription);
          },
          UNSUBSCRIBE(state, subscription) {
            state._Subscriptions.delete(subscription);
          },
    }
})

export const { RESET_STATE, QUERY, SUBSCRIBE, UNSUBSCRIBE } = cosmosBankV1beta1Slice.actions;

export const cosmosBankV1beta1Getters = {
    getBalance: (state, params = { params: {} }) => {
        if (!params.query) {
            params.query = null
        }
        return state.Balance[JSON.stringify(params)] ?? {}
    },
    getAllBalances: (state, params = { params: {} }) => {
        if (!params.query) {
            params.query = null
        }
        return state.AllBalances[JSON.stringify(params)] ?? {}
    },
    getTotalSupply: (state, params = { params: {} }) => {
        if (!params.query) {
            params.query = null
        }
        return state.TotalSupply[JSON.stringify(params)] ?? {}
    },
    getSupplyOf: (state, params = { params: {} }) => {
        if (!params.query) {
            params.query = null
        }
        return state.SupplyOf[JSON.stringify(params)] ?? {}
    },
    getParams: (state, params = { params: {} }) => {
        if (!params.query) {
            params.query = null
        }
        return state.Params[JSON.stringify(params)] ?? {}
    },
    getDenomMetadata: (state, params = { params: {} }) => {
        if (!params.query) {
            params.query = null
        }
        return state.DenomMetadata[JSON.stringify(params)] ?? {}
    },
    getDenomsMetadata: (state, params = { params: {} }) => {
        if (!params.query) {
            params.query = null
        }
        return state.DenomsMetadata[JSON.stringify(params)] ?? {}
    },
    getTypeStructure: (state, type) => {
        return state._Structure[type].fields
    }
}

const init = () => (dispatch, getState) => {
    console.log('Vuex module: cosmos.bank.v1beta1 initialized!')
    if (envGetters.client) {
      envGetters.client(getState().env).on("new block", () => {
        dispatch(StoreUpdate());
      });
    }
  };

  const resetState = () => (dispatch) => {
    dispatch(RESET_STATE());
  };
  
  const unsubscribe = (subscription) => (dispatch) => {
    dispatch(UNSUBSCRIBE(subscription));
  };

  const StoreUpdate = createAsyncThunk('cosmos.bank.v1beta1/StoreUpdate', async (d, { dispatch, getState }) => {
    getState().cosmosBankV1beta1._Subscriptions.forEach(async (subscription) => {
      try {
        await dispatch(subscription.action(subscription.payload));
      } catch (e) {
        throw new SpError("Subscriptions: " + e.message);
      }
    });
  })

  const QueryBalance = createAsyncThunk('cosmos.bank.v1beta1/QueryBalance', async (
    {
        options: { subscribe, all } = { subscribe: false, all: false },
        params: { ...key },
        query = null
    }: any, { dispatch, getState }) => {
    try {
      const addr = envGetters.apiCosmos(getState().env);
        const queryClient = await initQueryClient(addr)
        let value = (await queryClient.queryBalance(key.address, key.denom))
            .data
            dispatch(QUERY({
                query: 'Balance',
                key: { params: { ...key }, query },
                value
            }))
        if (subscribe)
        dispatch(SUBSCRIBE({
            action: QueryBalance,
            payload: { options: { all }, params: { ...key }, query }
        }))
        return cosmosBankV1beta1Getters['getBalance'](getState().cosmosBankV1beta1, { params: { ...key }, query }) ?? {}
    } catch (e) {
        throw new SpError(
            'QueryClient:QueryBalance',
            'API Node Unavailable. Could not perform query: ' + e.message
        )
    }
})

const QueryAllBalances = createAsyncThunk('cosmos.bank.v1beta1/QueryAllBalances', async (
    {
        options: { subscribe, all } = { subscribe: false, all: false },
        params: { ...key },
        query = null
    }: any, { dispatch, getState }) => {
    try {
        const addr = envGetters.apiCosmos(getState().env);
        const queryClient = await initQueryClient(addr)
        let value = (await queryClient.queryAllBalances(key.address, query))
            .data
        while (all && value.pagination && value.pagination.nextKey != null) {
            let next_values = (
                await queryClient.queryAllBalances(key.address, {
                    ...query,
                    'pagination.key': value.pagination.nextKey
                })
            ).data
            value = mergeResults(value, next_values)
        }
        dispatch(QUERY({
            query: 'AllBalances',
            key: { params: { ...key }, query },
            value
        }))
        if (subscribe)
        dispatch(SUBSCRIBE({
            action: QueryAllBalances,
            payload: { options: { all }, params: { ...key }, query }
        }))
        return cosmosBankV1beta1Getters['getAllBalances'](getState().cosmosBankV1beta1, { params: { ...key }, query }) ?? {}
    } catch (e) {
        throw new SpError(
            'QueryClient:QueryAllBalances',
            'API Node Unavailable. Could not perform query: ' + e.message
        )
    }
})

const QueryTotalSupply = createAsyncThunk('cosmos.bank.v1beta1/QueryTotalSupply', async (
    {
        options: { subscribe, all } = { subscribe: false, all: false },
        params: { ...key },
        query = null
    }: any, { dispatch, getState }) => {
    try {
        const addr = envGetters.apiCosmos(getState().env);
        const queryClient = await initQueryClient(addr)
        let value = (await queryClient.queryTotalSupply()).data
        dispatch(QUERY({
            query: 'TotalSupply',
            key: { params: { ...key }, query },
            value
        }))
        if (subscribe)
        dispatch(SUBSCRIBE({
            action: QueryTotalSupply,
            payload: { options: { all }, params: { ...key }, query }
        }))
        return cosmosBankV1beta1Getters['getTotalSupply'](getState().cosmosBankV1beta1, { params: { ...key }, query }) ?? {}
    } catch (e) {
        throw new SpError(
            'QueryClient:QueryTotalSupply',
            'API Node Unavailable. Could not perform query: ' + e.message
        )
    }
})

const QuerySupplyOf = createAsyncThunk('cosmos.bank.v1beta1/QuerySupplyOf', async (
    {
        options: { subscribe, all } = { subscribe: false, all: false },
        params: { ...key },
        query = null
    }: any, { dispatch, getState }) => {
    try {
        const addr = envGetters.apiCosmos(getState().env);
        const queryClient = await initQueryClient(addr)
        let value = (await queryClient.querySupplyOf(key.denom)).data
        dispatch(QUERY({
            query: 'SupplyOf',
            key: { params: { ...key }, query },
            value
        }))
        if (subscribe)
        dispatch(SUBSCRIBE({
            action: QuerySupplyOf,
            payload: { options: { all }, params: { ...key }, query }
        }))
        return cosmosBankV1beta1Getters['getSupplyOf'](getState().cosmosBankV1beta1, { params: { ...key }, query }) ?? {}
    } catch (e) {
        throw new SpError(
            'QueryClient:QuerySupplyOf',
            'API Node Unavailable. Could not perform query: ' + e.message
        )
    }
})

const QueryParams = createAsyncThunk('cosmos.bank.v1beta1/QueryParams', async (
    {
        options: { subscribe, all } = { subscribe: false, all: false },
        params: { ...key },
        query = null
    }: any, { dispatch, getState }) => {
    try {
        const addr = envGetters.apiCosmos(getState().env);
        const queryClient = await initQueryClient(addr)
        let value = (await queryClient.queryParams()).data
        dispatch(QUERY({
            query: 'Params',
            key: { params: { ...key }, query },
            value
        }))
        if (subscribe)
        dispatch(SUBSCRIBE({
            action: QueryParams,
            payload: { options: { all }, params: { ...key }, query }
        }))
        return cosmosBankV1beta1Getters['getParams'](getState().cosmosBankV1beta1, { params: { ...key }, query }) ?? {}
    } catch (e) {
        throw new SpError(
            'QueryClient:QueryParams',
            'API Node Unavailable. Could not perform query: ' + e.message
        )
    }
})

const QueryDenomMetadata = createAsyncThunk('cosmos.bank.v1beta1/QueryDenomMetadata', async (
    {
        options: { subscribe, all } = { subscribe: false, all: false },
        params: { ...key },
        query = null
    }: any, { dispatch, getState }) => {
    try {
        const addr = envGetters.apiCosmos(getState().env);
        const queryClient = await initQueryClient(addr)
        let value = (await queryClient.queryDenomMetadata(key.denom)).data
        dispatch(QUERY( {
            query: 'DenomMetadata',
            key: { params: { ...key }, query },
            value
        }))
        if (subscribe)
        dispatch(SUBSCRIBE({
            action: QueryDenomMetadata,
            payload: { options: { all }, params: { ...key }, query }
        }))
        return cosmosBankV1beta1Getters['getDenomMetadata'](getState().cosmosBankV1beta1, { params: { ...key }, query }) ?? {}
    } catch (e) {
        throw new SpError(
            'QueryClient:QueryDenomMetadata',
            'API Node Unavailable. Could not perform query: ' + e.message
        )
    }
})

const QueryDenomsMetadata = createAsyncThunk('cosmos.bank.v1beta1/QueryDenomsMetadata', async (
    {
        options: { subscribe, all } = { subscribe: false, all: false },
        params: { ...key },
        query = null
    }: any, { dispatch, getState }) => {
    try {
        const addr = envGetters.apiCosmos(getState().env);
        const queryClient = await initQueryClient(addr)
        let value = (await queryClient.queryDenomsMetadata(query)).data
        while (all && value.pagination && value.pagination.nextKey != null) {
            let next_values = (
                await queryClient.queryDenomsMetadata({
                    ...query,
                    'pagination.key': value.pagination.nextKey
                })
            ).data
            value = mergeResults(value, next_values)
        }
        dispatch(QUERY({
            query: 'DenomsMetadata',
            key: { params: { ...key }, query },
            value
        }))
        if (subscribe)
        dispatch(SUBSCRIBE({
            action: QueryDenomsMetadata,
            payload: { options: { all }, params: { ...key }, query }
        }))
        return cosmosBankV1beta1Getters['getDenomsMetadata'](getState().cosmosBankV1beta1, { params: { ...key }, query }) ?? {}
    } catch (e) {
        throw new SpError(
            'QueryClient:QueryDenomsMetadata',
            'API Node Unavailable. Could not perform query: ' + e.message
        )
    }
})

const sendMsgSend = createAsyncThunk('cosmos.bank.v1beta1/sendMsgSend', async ({ value, fee = [], memo = '' }: any, { getState }) => {
    const store = getState()
    try {
        const signerWallet = walletGetters.signer(store.wallet)
		const addr = envGetters.apiTendermint(store.env)
		const txClient = await initTxClient(signerWallet, addr)
        console.log('2222')
        console.log(txClient)
        const msg = await txClient.msgSend(value)
        const result = await txClient.signAndBroadcast([msg], {
            fee: { amount: fee, gas: '200000' },
            memo
        })
        return result
    } catch (e) {
        if (e == MissingWalletError) {
            throw new SpError(
                'TxClient:MsgSend:Init',
                'Could not initialize signing client. Wallet is required.'
            )
        } else {
            throw new SpError(
                'TxClient:MsgSend:Send',
                'Could not broadcast Tx: ' + e.message
            )
        }
    }
})

const sendMsgMultiSend = createAsyncThunk('cosmos.bank.v1beta1/sendMsgMultiSend', async ({ value, fee = [], memo = '' }: any, { getState }) => {
    try {
        const signerWallet = walletGetters.signer(getState().wallet)
		const addr = envGetters.apiTendermint(getState().env)
		const txClient = await initTxClient(signerWallet, addr)
        const msg = await txClient.msgMultiSend(value)
        const result = await txClient.signAndBroadcast([msg], {
            fee: { amount: fee, gas: '200000' },
            memo
        })
        return result
    } catch (e) {
        if (e == MissingWalletError) {
            throw new SpError(
                'TxClient:MsgMultiSend:Init',
                'Could not initialize signing client. Wallet is required.'
            )
        } else {
            throw new SpError(
                'TxClient:MsgMultiSend:Send',
                'Could not broadcast Tx: ' + e.message
            )
        }
    }
})

const MsgSend = createAsyncThunk('cosmos.bank.v1beta1/MsgSend', async ({ value }: any, { getState }) => {
    try {
        const signerWallet = walletGetters.signer(getState().wallet)
		const addr = envGetters.apiTendermint(getState().env)
		const txClient = await initTxClient(signerWallet, addr)
        const msg = await txClient.msgSend(value)
        return msg
    } catch (e) {
        if (e == MissingWalletError) {
            throw new SpError(
                'TxClient:MsgSend:Init',
                'Could not initialize signing client. Wallet is required.'
            )
        } else {
            throw new SpError(
                'TxClient:MsgSend:Create',
                'Could not create message: ' + e.message
            )
        }
    }
})

const MsgMultiSend = createAsyncThunk('cosmos.bank.v1beta1/MsgMultiSend', async ({ value }: any, { getState }) => {
    try {
        const signerWallet = walletGetters.signer(getState().wallet)
		const addr = envGetters.apiTendermint(getState().env)
		const txClient = await initTxClient(signerWallet, addr)
        const msg = await txClient.msgMultiSend(value)
        return msg
    } catch (e) {
        if (e == MissingWalletError) {
            throw new SpError(
                'TxClient:MsgMultiSend:Init',
                'Could not initialize signing client. Wallet is required.'
            )
        } else {
            throw new SpError(
                'TxClient:MsgMultiSend:Create',
                'Could not create message: ' + e.message
            )
        }
    }
})

  export {
      init,
      resetState,
      unsubscribe,
      StoreUpdate,
      QueryBalance,
      QueryAllBalances,
      QueryTotalSupply,
      QuerySupplyOf,
      QueryParams,
      QueryDenomMetadata,
      QueryDenomsMetadata,
      sendMsgSend,
      sendMsgMultiSend,
      MsgSend,
      MsgMultiSend
  }

  export default cosmosBankV1beta1Slice.reducer;