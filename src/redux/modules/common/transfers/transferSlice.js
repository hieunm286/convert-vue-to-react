import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'
import SpError from '../../../errors/SpError'
import { envGetters } from '../env/envSlice'

const getDefaultState = () => {
	return {
		GetTxsEvent: {},
		_Subscriptions: new Set(),
	}
}
// initial state
const initialState = getDefaultState()

export const transferSlice = createSlice({
    name: 'transfers',
    initialState,
    reducers: {
        RESET_STATE: (state) => {
			Object.assign(state, getDefaultState())
		},
		QUERY: (state, action) => {
            const { query, key, value } = action.payload
			state[query][JSON.stringify(key)] = value
		},
		SUBSCRIBE: (state, action) => {
			state._Subscriptions.add(action.payload)
		},
		UNSUBSCRIBE(state, action) {
			state._Subscriptions.delete(action.payload)
		},
    }
})

export const { RESET_STATE, QUERY, SUBSCRIBE, UNSUBSCRIBE } = transferSlice.actions;

export const transferGetters = {
    getGetTxsEvent: (state, params = {}) => {
        return state.GetTxsEvent[JSON.stringify(params)] ?? {}
    }
}

const init = () => (dispatch, getState) => {
    console.log('nodule: common.transfers initialized!')
    if (envGetters.client(getState())) {
        envGetters.client(getState()).on('newblock', () => {
            dispatch(StoreUpdate())
        })
    }
}

const resetState = () => (dispatch) => {
    dispatch(RESET_STATE())
}

const unsubscribe = (subscription) => (dispatch) => {
    dispatch(UNSUBSCRIBE(subscription))
}

const StoreUpdate = () => (dispatch, getState) => {
    getState()._Subscriptions.forEach((subscription) => {
        dispatch(subscription.action(subscription.payload))
    })
}

const ServiceGetTxsEvent = createAsyncThunk('transfers/ServiceGetTxsEvent', async ({ subscribe = false, all = true, ...key }, thunkAPI) => {
    const { dispatch, getState } = thunkAPI
    try {
        let value = (
            await axios.get(envGetters.apiCosmos(getState()) + '/cosmos/tx/v1beta1/txs?events=' + key.event)
        ).data

        while (all && value.pagination && value.pagination.next_key != null) {
            let next_values = await axios.get(
                envGetters.apiCosmos(getState()) +
                    '/cosmos/tx/v1beta1/txs?events=' +
                    key.event +
                    '&pagination.key=' +
                    value.pagination.next_key,
            ).data

            for (let prop of Object.keys(next_values)) {
                if (Array.isArray(next_values[prop])) {
                    value[prop] = [...value[prop], ...next_values[prop]]
                } else {
                    value[prop] = next_values[prop]
                }
            }
            console.log(value)
        }

        dispatch(QUERY({ query: 'GetTxsEvent', key, value }))
        if (subscribe) dispatch(SUBSCRIBE({ action: ServiceGetTxsEvent, payload: key }))
    } catch (e) {
        console.error(
            new SpError('QueryClient:ServiceGetTxsEvent', 'API Node Unavailable. Could not perform query.'),
        )
    }
})

export {
    init,
    resetState,
    unsubscribe,
    StoreUpdate,
    ServiceGetTxsEvent
}

export default transferSlice.reducer;
