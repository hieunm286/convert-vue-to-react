import { txClient, queryClient, MissingWalletError } from "./module";
// @ts-ignore
import { LastValidatorPower } from "./module/types/cosmos/staking/v1beta1/genesis";
import { HistoricalInfo } from "./module/types/cosmos/staking/v1beta1/staking";
import { CommissionRates } from "./module/types/cosmos/staking/v1beta1/staking";
import { Commission } from "./module/types/cosmos/staking/v1beta1/staking";
import { Description } from "./module/types/cosmos/staking/v1beta1/staking";
import { Validator } from "./module/types/cosmos/staking/v1beta1/staking";
import { ValAddresses } from "./module/types/cosmos/staking/v1beta1/staking";
import { DVPair } from "./module/types/cosmos/staking/v1beta1/staking";
import { DVPairs } from "./module/types/cosmos/staking/v1beta1/staking";
import { DVVTriplet } from "./module/types/cosmos/staking/v1beta1/staking";
import { DVVTriplets } from "./module/types/cosmos/staking/v1beta1/staking";
import { Delegation } from "./module/types/cosmos/staking/v1beta1/staking";
import { UnbondingDelegation } from "./module/types/cosmos/staking/v1beta1/staking";
import { UnbondingDelegationEntry } from "./module/types/cosmos/staking/v1beta1/staking";
import { RedelegationEntry } from "./module/types/cosmos/staking/v1beta1/staking";
import { Redelegation } from "./module/types/cosmos/staking/v1beta1/staking";
import { Params } from "./module/types/cosmos/staking/v1beta1/staking";
import { DelegationResponse } from "./module/types/cosmos/staking/v1beta1/staking";
import { RedelegationEntryResponse } from "./module/types/cosmos/staking/v1beta1/staking";
import { RedelegationResponse } from "./module/types/cosmos/staking/v1beta1/staking";
import { Pool } from "./module/types/cosmos/staking/v1beta1/staking";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import SpError from "../../redux/errors/SpError";
import { envGetters } from "../../redux/modules/common/env/envSlice";
import { walletGetters } from "../../redux/modules/common/wallet/walletSlice";

export {
  LastValidatorPower,
  HistoricalInfo,
  CommissionRates,
  Commission,
  Description,
  Validator,
  ValAddresses,
  DVPair,
  DVPairs,
  DVVTriplet,
  DVVTriplets,
  Delegation,
  UnbondingDelegation,
  UnbondingDelegationEntry,
  RedelegationEntry,
  Redelegation,
  Params,
  DelegationResponse,
  RedelegationEntryResponse,
  RedelegationResponse,
  Pool,
};
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
      value[prop] = [...value[prop], ...next_values[prop]];
    } else {
      value[prop] = next_values[prop];
    }
  }
  return value;
}
function getStructure(template) {
  let structure = { fields: [] };
  for (const [key, value] of Object.entries(template)) {
    let field = {};
    field.name = key;
    field.type = typeof value;
    structure.fields.push(field);
  }
  return structure;
}
const getDefaultState = () => {
  return {
    Validators: {},
    Validator: {},
    ValidatorDelegations: {},
    ValidatorUnbondingDelegations: {},
    Delegation: {},
    UnbondingDelegation: {},
    DelegatorDelegations: {},
    DelegatorUnbondingDelegations: {},
    Redelegations: {},
    DelegatorValidators: {},
    DelegatorValidator: {},
    HistoricalInfo: {},
    Pool: {},
    Params: {},
    _Structure: {
      LastValidatorPower: getStructure(LastValidatorPower.fromPartial({})),
      HistoricalInfo: getStructure(HistoricalInfo.fromPartial({})),
      CommissionRates: getStructure(CommissionRates.fromPartial({})),
      Commission: getStructure(Commission.fromPartial({})),
      Description: getStructure(Description.fromPartial({})),
      Validator: getStructure(Validator.fromPartial({})),
      ValAddresses: getStructure(ValAddresses.fromPartial({})),
      DVPair: getStructure(DVPair.fromPartial({})),
      DVPairs: getStructure(DVPairs.fromPartial({})),
      DVVTriplet: getStructure(DVVTriplet.fromPartial({})),
      DVVTriplets: getStructure(DVVTriplets.fromPartial({})),
      Delegation: getStructure(Delegation.fromPartial({})),
      UnbondingDelegation: getStructure(UnbondingDelegation.fromPartial({})),
      UnbondingDelegationEntry: getStructure(
        UnbondingDelegationEntry.fromPartial({})
      ),
      RedelegationEntry: getStructure(RedelegationEntry.fromPartial({})),
      Redelegation: getStructure(Redelegation.fromPartial({})),
      Params: getStructure(Params.fromPartial({})),
      DelegationResponse: getStructure(DelegationResponse.fromPartial({})),
      RedelegationEntryResponse: getStructure(
        RedelegationEntryResponse.fromPartial({})
      ),
      RedelegationResponse: getStructure(RedelegationResponse.fromPartial({})),
      Pool: getStructure(Pool.fromPartial({})),
    },
    _Subscriptions: new Set(),
  };
};
// initial state
const initialState = getDefaultState();

export const cosmosStakingV1beta1Slice = createSlice({
  name: "cosmos.staking.v1beta1",
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
  },
});

export const cosmosStakingV1beta1Getters = {
  getValidators: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.Validators[JSON.stringify(params)] ?? {};
  },
  getValidator: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.Validator[JSON.stringify(params)] ?? {};
  },
  getValidatorDelegations: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.ValidatorDelegations[JSON.stringify(params)] ?? {};
  },
  getValidatorUnbondingDelegations: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.ValidatorUnbondingDelegations[JSON.stringify(params)] ?? {};
  },
  getDelegation: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.Delegation[JSON.stringify(params)] ?? {};
  },
  getUnbondingDelegation: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.UnbondingDelegation[JSON.stringify(params)] ?? {};
  },
  getDelegatorDelegations: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.DelegatorDelegations[JSON.stringify(params)] ?? {};
  },
  getDelegatorUnbondingDelegations: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.DelegatorUnbondingDelegations[JSON.stringify(params)] ?? {};
  },
  getRedelegations: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.Redelegations[JSON.stringify(params)] ?? {};
  },
  getDelegatorValidators: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.DelegatorValidators[JSON.stringify(params)] ?? {};
  },
  getDelegatorValidator: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.DelegatorValidator[JSON.stringify(params)] ?? {};
  },
  getHistoricalInfo: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.HistoricalInfo[JSON.stringify(params)] ?? {};
  },
  getPool: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.Pool[JSON.stringify(params)] ?? {};
  },
  getParams: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.Params[JSON.stringify(params)] ?? {};
  },
  getTypeStructure: (state, type) => {
    return state._Structure[type].fields;
  },
};

export const { RESET_STATE, QUERY, SUBSCRIBE, UNSUBSCRIBE } = cosmosStakingV1beta1Slice.actions;

const init = (envGetters) => (dispatch, getState) => {
  console.log("module: ibc.applications.transfer.v1 initialized!");
  if (envGetters.client) {
    envGetters.client(getState()).on("new block", () => {
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

const StoreUpdate = createAsyncThunk('cosmos.staking.v1beta1/StoreUpdate', async (d, { dispatch, getState }) => {
  getState()._Subscriptions.forEach(async (subscription) => {
    try {
      await dispatch(subscription.action(subscription.payload));
    } catch (e) {
      throw new SpError("Subscriptions: " + e.message);
    }
  });
});

const QueryValidators = createAsyncThunk('cosmos.staking.v1beta1/QueryValidators', async ({
    options: { subscribe, all } = { subscribe: false, all: false },
    params: { ...key },
    query = null,
  }, { dispatch, getState }) => {
    try {
      const state = getState();
      const addr = envGetters.apiCosmos(state);
      const queryClient = await initQueryClient(addr);
      let value = (await queryClient.queryValidators(query)).data;
      while (all && value.pagination && value.pagination.nextKey != null) {
        let next_values = (
          await queryClient.queryValidators({
            ...query,
            "pagination.key": value.pagination.nextKey,
          })
        ).data;
        value = mergeResults(value, next_values);
      }
      dispatch(QUERY({
        query: "Validators",
        key: { params: { ...key }, query },
        value,
      }));
      if (subscribe)
        dispatch(SUBSCRIBE({
			action: "QueryValidators",
			payload: { options: { all }, params: { ...key }, query },
		  }));
      return (
        cosmosStakingV1beta1Getters["getValidators"]({
          params: { ...key },
          query,
        }) ?? {}
      );
    } catch (e) {
      throw new SpError(
        "QueryClient:QueryValidators",
        "API Node Unavailable. Could not perform query: " + e.message
      );
    }
  });

const QueryValidator = createAsyncThunk('cosmos.staking.v1beta1/QueryValidator', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
      const addr = envGetters.apiCosmos(state);
		const queryClient = await initQueryClient(addr)
		let value = (await queryClient.queryValidator(key.validator_addr)).data
		dispatch(QUERY({
			query: 'Validator',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryValidator,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return cosmosStakingV1beta1Getters['getValidator'](getState(), { params: { ...key }, query }) ?? {}
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryValidator',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryValidatorDelegations = createAsyncThunk('cosmos.staking.v1beta1/QueryValidatorDelegations', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
      const addr = envGetters.apiCosmos(state);
		const queryClient = await initQueryClient(addr)
		let value = (
			await queryClient.queryValidatorDelegations(key.validator_addr, query)
		).data
		while (all && value.pagination && value.pagination.nextKey != null) {
			let next_values = (
				await queryClient.queryValidatorDelegations(key.validator_addr, {
					...query,
					'pagination.key': value.pagination.nextKey
				})
			).data
			value = mergeResults(value, next_values)
		}
		dispatch(QUERY({
			query: 'ValidatorDelegations',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryValidatorDelegations,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return (
			cosmosStakingV1beta1Getters['getValidatorDelegations'](getState(), { params: { ...key }, query }) ??
			{}
		)
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryValidatorDelegations',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryValidatorUnbondingDelegations = createAsyncThunk('cosmos.staking.v1beta1/QueryValidatorUnbondingDelegations', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
      const addr = envGetters.apiCosmos(state);
		const queryClient = await initQueryClient(addr)
		let value = (
			await queryClient.queryValidatorUnbondingDelegations(
				key.validator_addr,
				query
			)
		).data
		while (all && value.pagination && value.pagination.nextKey != null) {
			let next_values = (
				await queryClient.queryValidatorUnbondingDelegations(
					key.validator_addr,
					{ ...query, 'pagination.key': value.pagination.nextKey }
				)
			).data
			value = mergeResults(value, next_values)
		}
		dispatch(QUERY({
			query: 'ValidatorUnbondingDelegations',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryValidatorUnbondingDelegations,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return (
			cosmosStakingV1beta1Getters['getValidatorUnbondingDelegations']({
				params: { ...key },
				query
			}) ?? {}
		)
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryValidatorUnbondingDelegations',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryDelegation = createAsyncThunk('cosmos.staking.v1beta1/QueryDelegation', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
      const addr = envGetters.apiCosmos(state);
		const queryClient = await initQueryClient(addr)
		let value = (
			await queryClient.queryDelegation(
				key.validator_addr,
				key.delegator_addr
			)
		).data
		dispatch(QUERY({
			query: 'Delegation',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryDelegation,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return cosmosStakingV1beta1Getters['getDelegation'](getState(), { params: { ...key }, query }) ?? {}
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryDelegation',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryUnbondingDelegation = createAsyncThunk('cosmos.staking.v1beta1/QueryUnbondingDelegation', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
      const addr = envGetters.apiCosmos(state);
		const queryClient = await initQueryClient(addr)
		let value = (
			await queryClient.queryUnbondingDelegation(
				key.validator_addr,
				key.delegator_addr
			)
		).data
		dispatch(QUERY({
			query: 'UnbondingDelegation',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryUnbondingDelegation,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return (
			cosmosStakingV1beta1Getters['getUnbondingDelegation'](getState(), { params: { ...key }, query }) ?? {}
		)
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryUnbondingDelegation',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryDelegatorDelegations = createAsyncThunk('cosmos.staking.v1beta1/QueryDelegatorDelegations', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
		const addr = envGetters.apiCosmos(state);
		  const queryClient = await initQueryClient(addr)
		let value = (
			await queryClient.queryDelegatorDelegations(key.delegator_addr, query)
		).data
		while (all && value.pagination && value.pagination.nextKey != null) {
			let next_values = (
				await queryClient.queryDelegatorDelegations(key.delegator_addr, {
					...query,
					'pagination.key': value.pagination.nextKey
				})
			).data
			value = mergeResults(value, next_values)
		}
		dispatch(QUERY({
			query: 'DelegatorDelegations',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryDelegatorDelegations,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return (
			cosmosStakingV1beta1Getters['getDelegatorDelegations'](getState(), { params: { ...key }, query }) ??
			{}
		)
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryDelegatorDelegations',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryDelegatorUnbondingDelegations = createAsyncThunk('cosmos.staking.v1beta1/QueryDelegatorUnbondingDelegations', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
		const addr = envGetters.apiCosmos(state);
		  const queryClient = await initQueryClient(addr)
		let value = (
			await queryClient.queryDelegatorUnbondingDelegations(
				key.delegator_addr,
				query
			)
		).data
		while (all && value.pagination && value.pagination.nextKey != null) {
			let next_values = (
				await queryClient.queryDelegatorUnbondingDelegations(
					key.delegator_addr,
					{ ...query, 'pagination.key': value.pagination.nextKey }
				)
			).data
			value = mergeResults(value, next_values)
		}
		dispatch(QUERY({
			query: 'DelegatorUnbondingDelegations',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryDelegatorUnbondingDelegations,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return (
			cosmosStakingV1beta1Getters['getDelegatorUnbondingDelegations']({
				params: { ...key },
				query
			}) ?? {}
		)
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryDelegatorUnbondingDelegations',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryRedelegations = createAsyncThunk('cosmos.staking.v1beta1/QueryRedelegations', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
		const addr = envGetters.apiCosmos(state);
		  const queryClient = await initQueryClient(addr)
		let value = (
			await queryClient.queryRedelegations(key.delegator_addr, query)
		).data
		while (all && value.pagination && value.pagination.nextKey != null) {
			let next_values = (
				await queryClient.queryRedelegations(key.delegator_addr, {
					...query,
					'pagination.key': value.pagination.nextKey
				})
			).data
			value = mergeResults(value, next_values)
		}
		dispatch(QUERY({
			query: 'Redelegations',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryRedelegations,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return cosmosStakingV1beta1Getters['getRedelegations'](getState(), { params: { ...key }, query }) ?? {}
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryRedelegations',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryDelegatorValidators = createAsyncThunk('cosmos.staking.v1beta1/QueryDelegatorValidators', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) =>  {
	try {
		const state = getState();
		const addr = envGetters.apiCosmos(state);
		  const queryClient = await initQueryClient(addr)
		let value = (
			await queryClient.queryDelegatorValidators(key.delegator_addr, query)
		).data
		while (all && value.pagination && value.pagination.nextKey != null) {
			let next_values = (
				await queryClient.queryDelegatorValidators(key.delegator_addr, {
					...query,
					'pagination.key': value.pagination.nextKey
				})
			).data
			value = mergeResults(value, next_values)
		}
		dispatch(QUERY({
			query: 'DelegatorValidators',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryDelegatorValidators,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return (
			cosmosStakingV1beta1Getters['getDelegatorValidators'](getState(), { params: { ...key }, query }) ?? {}
		)
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryDelegatorValidators',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryDelegatorValidator = createAsyncThunk('cosmos.staking.v1beta1/QueryDelegatorValidator', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
		const addr = envGetters.apiCosmos(state);
		  const queryClient = await initQueryClient(addr)	
		  let value = (
			await queryClient.queryDelegatorValidator(
				key.delegator_addr,
				key.validator_addr
			)
		).data
		dispatch(QUERY({
			query: 'DelegatorValidator',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryDelegatorValidator,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return (
			cosmosStakingV1beta1Getters['getDelegatorValidator'](getState(), { params: { ...key }, query }) ?? {}
		)
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryDelegatorValidator',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryHistoricalInfo = createAsyncThunk('cosmos.staking.v1beta1/QueryHistoricalInfo', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
		const addr = envGetters.apiCosmos(state);
		  const queryClient = await initQueryClient(addr)
		  let value = (await queryClient.queryHistoricalInfo(key.height)).data
		  dispatch(QUERY({
			query: 'HistoricalInfo',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryHistoricalInfo,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return cosmosStakingV1beta1Getters['getHistoricalInfo'](getState(), { params: { ...key }, query }) ?? {}
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryHistoricalInfo',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryPool = createAsyncThunk('cosmos.staking.v1beta1/QueryPool', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
		const addr = envGetters.apiCosmos(state);
		  const queryClient = await initQueryClient(addr)
		let value = (await queryClient.queryPool()).data
		dispatch(QUERY({
			query: 'Pool',
			key: { params: { ...key }, query },
			value
		}))
		if (subscribe)
		dispatch(SUBSCRIBE({
			action: QueryPool,
			payload: { options: { all }, params: { ...key }, query }
		}))
		return cosmosStakingV1beta1Getters['getPool'](getState(), { params: { ...key }, query }) ?? {}
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryPool',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const QueryParams = createAsyncThunk('cosmos.staking.v1beta1/QueryParams', async (
	{
		options: { subscribe, all } = { subscribe: false, all: false },
		params: { ...key },
		query = null
	}, { dispatch, getState }) => {
	try {
		const state = getState();
		const addr = envGetters.apiCosmos(state);
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
		return cosmosStakingV1beta1Getters['getParams'](getState(), { params: { ...key }, query }) ?? {}
	} catch (e) {
		throw new SpError(
			'QueryClient:QueryParams',
			'API Node Unavailable. Could not perform query: ' + e.message
		)
	}
})

const sendMsgDelegate = createAsyncThunk('cosmos.staking.v1beta1/sendMsgDelegate', async ({ value, fee = [], memo = '' }, { getState }) => {
	try {
		const signerWallet = walletGetters.signer(getState())
		const addr = envGetters.apiTendermint(getState())
		const txClient = await initTxClient(signerWallet, addr)
		const msg = await txClient.msgDelegate(value)
		const result = await txClient.signAndBroadcast([msg], {
			fee: { amount: fee, gas: '200000' },
			memo
		})
		return result
	} catch (e) {
		if (e == MissingWalletError) {
			throw new SpError(
				'TxClient:MsgDelegate:Init',
				'Could not initialize signing client. Wallet is required.'
			)
		} else {
			throw new SpError(
				'TxClient:MsgDelegate:Send',
				'Could not broadcast Tx: ' + e.message
			)
		}
	}
})

const sendMsgEditValidator = createAsyncThunk('cosmos.staking.v1beta1/sendMsgEditValidator', async (
	{ value, fee = [], memo = '' }, { dispatch, getState }) => {
	try {
		const signerWallet = walletGetters.signer(getState())
		const addr = envGetters.apiTendermint(getState())
		const txClient = await initTxClient(signerWallet, addr)
		const msg = await txClient.msgEditValidator(value)
		const result = await txClient.signAndBroadcast([msg], {
			fee: { amount: fee, gas: '200000' },
			memo
		})
		return result
	} catch (e) {
		if (e == MissingWalletError) {
			throw new SpError(
				'TxClient:MsgEditValidator:Init',
				'Could not initialize signing client. Wallet is required.'
			)
		} else {
			throw new SpError(
				'TxClient:MsgEditValidator:Send',
				'Could not broadcast Tx: ' + e.message
			)
		}
	}
})

const sendMsgCreateValidator = createAsyncThunk('cosmos.staking.v1beta1/sendMsgCreateValidator', async (
	{ value, fee = [], memo = '' }, { dispatch, getState }) => {
	try {
		const signerWallet = walletGetters.signer(getState())
		const addr = envGetters.apiTendermint(getState())
		const txClient = await initTxClient(signerWallet, addr)
		const msg = await txClient.msgCreateValidator(value)
		const result = await txClient.signAndBroadcast([msg], {
			fee: { amount: fee, gas: '200000' },
			memo
		})
		return result
	} catch (e) {
		if (e == MissingWalletError) {
			throw new SpError(
				'TxClient:MsgCreateValidator:Init',
				'Could not initialize signing client. Wallet is required.'
			)
		} else {
			throw new SpError(
				'TxClient:MsgCreateValidator:Send',
				'Could not broadcast Tx: ' + e.message
			)
		}
	}
})

const sendMsgUndelegate = createAsyncThunk('cosmos.staking.v1beta1/sendMsgUndelegate', async ({ value, fee = [], memo = '' }, { getState }) => {
	try {
		const signerWallet = walletGetters.signer(getState())
		const addr = envGetters.apiTendermint(getState())
		const txClient = await initTxClient(signerWallet, addr)
		const msg = await txClient.msgUndelegate(value)
		const result = await txClient.signAndBroadcast([msg], {
			fee: { amount: fee, gas: '200000' },
			memo
		})
		return result
	} catch (e) {
		if (e == MissingWalletError) {
			throw new SpError(
				'TxClient:MsgUndelegate:Init',
				'Could not initialize signing client. Wallet is required.'
			)
		} else {
			throw new SpError(
				'TxClient:MsgUndelegate:Send',
				'Could not broadcast Tx: ' + e.message
			)
		}
	}
})

const sendMsgBeginRedelegate = createAsyncThunk('cosmos.staking.v1beta1/sendMsgBeginRedelegate', async (
	{ value, fee = [], memo = '' }, { dispatch, getState }) => {
	try {
		const signerWallet = walletGetters.signer(getState())
		const addr = envGetters.apiTendermint(getState())
		const txClient = await initTxClient(signerWallet, addr)
		const msg = await txClient.msgBeginRedelegate(value)
		const result = await txClient.signAndBroadcast([msg], {
			fee: { amount: fee, gas: '200000' },
			memo
		})
		return result
	} catch (e) {
		if (e == MissingWalletError) {
			throw new SpError(
				'TxClient:MsgBeginRedelegate:Init',
				'Could not initialize signing client. Wallet is required.'
			)
		} else {
			throw new SpError(
				'TxClient:MsgBeginRedelegate:Send',
				'Could not broadcast Tx: ' + e.message
			)
		}
	}
})

const MsgDelegate = createAsyncThunk('cosmos.staking.v1beta1/MsgDelegate', async ({ value }, { dispatch, getState }) => {
	try {
		const signerWallet = walletGetters.signer(getState())
		const addr = envGetters.apiTendermint(getState())
		const txClient = await initTxClient(signerWallet, addr)
		const msg = await txClient.msgDelegate(value)
		return msg
	} catch (e) {
		if (e == MissingWalletError) {
			throw new SpError(
				'TxClient:MsgDelegate:Init',
				'Could not initialize signing client. Wallet is required.'
			)
		} else {
			throw new SpError(
				'TxClient:MsgDelegate:Create',
				'Could not create message: ' + e.message
			)
		}
	}
})

const MsgEditValidator = createAsyncThunk('cosmos.staking.v1beta1/MsgEditValidator', async ({ value }, { dispatch, getState }) => {
	try {
		const signerWallet = walletGetters.signer(getState())
		const addr = envGetters.apiTendermint(getState())
		const txClient = await initTxClient(signerWallet, addr)
		const msg = await txClient.msgEditValidator(value)
		return msg
	} catch (e) {
		if (e == MissingWalletError) {
			throw new SpError(
				'TxClient:MsgEditValidator:Init',
				'Could not initialize signing client. Wallet is required.'
			)
		} else {
			throw new SpError(
				'TxClient:MsgEditValidator:Create',
				'Could not create message: ' + e.message
			)
		}
	}
})

const MsgCreateValidator = createAsyncThunk('cosmos.staking.v1beta1/MsgCreateValidator', async ({ value }, { dispatch, getState }) => {
	try {
		const signerWallet = walletGetters.signer(getState())
		const addr = envGetters.apiTendermint(getState())
		const txClient = await initTxClient(signerWallet, addr)
		const msg = await txClient.msgCreateValidator(value)
		return msg
	} catch (e) {
		if (e == MissingWalletError) {
			throw new SpError(
				'TxClient:MsgCreateValidator:Init',
				'Could not initialize signing client. Wallet is required.'
			)
		} else {
			throw new SpError(
				'TxClient:MsgCreateValidator:Create',
				'Could not create message: ' + e.message
			)
		}
	}
})

const MsgUndelegate = createAsyncThunk('cosmos.staking.v1beta1/MsgUndelegate', async ({ value }, { dispatch, getState }) => {
	try {
		const signerWallet = walletGetters.signer(getState())
		const addr = envGetters.apiTendermint(getState())
		const txClient = await initTxClient(signerWallet, addr)
		const msg = await txClient.msgUndelegate(value)
		return msg
	} catch (e) {
		if (e == MissingWalletError) {
			throw new SpError(
				'TxClient:MsgUndelegate:Init',
				'Could not initialize signing client. Wallet is required.'
			)
		} else {
			throw new SpError(
				'TxClient:MsgUndelegate:Create',
				'Could not create message: ' + e.message
			)
		}
	}
})

const MsgBeginRedelegate = createAsyncThunk('cosmos.staking.v1beta1/MsgBeginRedelegate', async ({ value }, { dispatch, getState }) => {
	try {
		const signerWallet = walletGetters.signer(getState())
		const addr = envGetters.apiTendermint(getState())
		const txClient = await initTxClient(signerWallet, addr)
		const msg = await txClient.msgBeginRedelegate(value)
		return msg
	} catch (e) {
		if (e == MissingWalletError) {
			throw new SpError(
				'TxClient:MsgBeginRedelegate:Init',
				'Could not initialize signing client. Wallet is required.'
			)
		} else {
			throw new SpError(
				'TxClient:MsgBeginRedelegate:Create',
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
	QueryValidator,
	QueryValidators,
	QueryValidatorDelegations,
	QueryValidatorUnbondingDelegations,
	QueryDelegation,
	QueryUnbondingDelegation,
	QueryDelegatorDelegations,
	QueryDelegatorUnbondingDelegations,
	QueryRedelegations,
	QueryDelegatorValidators,
	QueryDelegatorValidator,
	QueryHistoricalInfo,
	QueryPool,
	QueryParams,
	sendMsgDelegate,
	sendMsgEditValidator,
	sendMsgCreateValidator,
	sendMsgUndelegate,
	sendMsgBeginRedelegate,
	MsgDelegate,
	MsgEditValidator,
	MsgCreateValidator,
	MsgUndelegate,
	MsgBeginRedelegate
}

export default cosmosStakingV1beta1Slice.reducer;