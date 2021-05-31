import { txClient, queryClient, MissingWalletError } from "./module";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { FungibleTokenPacketData } from "./module/types/ibc/applications/transfer/v1/transfer";
import { DenomTrace } from "./module/types/ibc/applications/transfer/v1/transfer";
import { Params } from "./module/types/ibc/applications/transfer/v1/transfer";
import { envGetters } from "../../redux/modules/common/env/envSlice";
import SpError from "../../redux/errors/SpError";
import { walletGetters } from "../../redux/modules/common/wallet/walletSlice";

export { FungibleTokenPacketData, DenomTrace, Params };

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
    DenomTrace: {},
    DenomTraces: {},
    Params: {},

    _Structure: {
      FungibleTokenPacketData: getStructure(
        FungibleTokenPacketData.fromPartial({})
      ),
      DenomTrace: getStructure(DenomTrace.fromPartial({})),
      Params: getStructure(Params.fromPartial({})),
    },
    _Subscriptions: new Set(),
  };
};

// initial state
const initialState = getDefaultState();

export const ibcApplicationTransferSlice = createSlice({
  name: "ibc.applications.transfer.v1",
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

export const { RESET_STATE, QUERY, SUBSCRIBE, UNSUBSCRIBE } =
  ibcApplicationTransferSlice.actions;

const ibcApplicationTransferGetters = {
  getDenomTrace: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.DenomTrace[JSON.stringify(params)] ?? {};
  },
  getDenomTraces: (state, params = { params: {} }) => {
    if (!params.query) {
      params.query = null;
    }
    return state.DenomTraces[JSON.stringify(params)] ?? {};
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

const StoreUpdate = createAsyncThunk(
  "ibc.applications.transfer.v1/StoreUpdate",
  async (d, { dispatch, getState }) => {
    getState()._Subscriptions.forEach(async (subscription) => {
      try {
        await dispatch(subscription.action(subscription.payload));
      } catch (e) {
        throw new SpError("Subscriptions: " + e.message);
      }
    });
  }
);

const QueryDenomTrace = createAsyncThunk('ibc.applications.transfer.v1/QueryDenomTrace', async ({
    options: { subscribe, all } = { subscribe: false, all: false },
    params: { ...key },
    query = null,
  }, { dispatch, getState }) => {
    try {
      const addr = envGetters.apiCosmos(getState());
      const queryClient = await initQueryClient(addr);
      let value = (await queryClient.queryDenomTrace(key.hash)).data;
      dispatch(
        QUERY({
          query: "DenomTrace",
          key: { params: { ...key }, query },
          value,
        })
      );
      if (subscribe)
        dispatch(
          SUBSCRIBE({
            action: QueryDenomTrace,
            payload: { options: { all }, params: { ...key }, query },
          })
        );
      return (
        ibcApplicationTransferGetters["getDenomTrace"](getState(), {
          params: { ...key },
          query,
        }) ?? {}
      );
    } catch (e) {
      throw new SpError(
        "QueryClient:QueryDenomTrace",
        "API Node Unavailable. Could not perform query: " + e.message
      );
    }
  });

const QueryDenomTraces = createAsyncThunk('ibc.applications.transfer.v1/QueryDenomTraces', async ({
    options: { subscribe, all } = { subscribe: false, all: false },
    params: { ...key },
    query = null,
  }, { dispatch, getState }) => {
    try {
      const addr = envGetters.apiCosmos(getState());
      const queryClient = await initQueryClient(addr);
      let value = (await queryClient.queryDenomTraces(query)).data;
      while (all && value.pagination && value.pagination.nextKey != null) {
        let next_values = (
          await queryClient.queryDenomTraces({
            ...query,
            "pagination.key": value.pagination.nextKey,
          })
        ).data;
        value = mergeResults(value, next_values);
      }
      dispatch(
        QUERY({
          query: "DenomTraces",
          key: { params: { ...key }, query },
          value,
        })
      );
      if (subscribe)
        dispatch(
          SUBSCRIBE({
            action: QueryDenomTraces,
            payload: { options: { all }, params: { ...key }, query },
          })
        );
      return (
        ibcApplicationTransferGetters["getDenomTraces"](getState(), {
          params: { ...key },
          query,
        }) ?? {}
      );
    } catch (e) {
      throw new SpError(
        "QueryClient:QueryDenomTraces",
        "API Node Unavailable. Could not perform query: " + e.message
      );
    }
  });

const QueryParams = createAsyncThunk('ibc.applications.transfer.v1/QueryParams', async ({
    options: { subscribe, all } = { subscribe: false, all: false },
    params: { ...key },
    query = null,
  }, { dispatch, getState }) => {
    try {
      const addr = envGetters.apiCosmos(getState());
      const queryClient = await initQueryClient(addr);
      let value = (await queryClient.queryParams()).data;
      dispatch(
        QUERY({
          query: "Params",
          key: { params: { ...key }, query },
          value,
        })
      );
      if (subscribe)
        dispatch(
          SUBSCRIBE({
            action: QueryParams,
            payload: { options: { all }, params: { ...key }, query },
          })
        );
      return (
        ibcApplicationTransferGetters["getParams"](getState(), {
          params: { ...key },
          query,
        }) ?? {}
      );
    } catch (e) {
      throw new SpError(
        "QueryClient:QueryParams",
        "API Node Unavailable. Could not perform query: " + e.message
      );
    }
  });

const sendMsgTransfer = createAsyncThunk('ibc.applications.transfer.v1/sendMsgTransfer', async ({ value, fee = [], memo = "" }, { getState }) => {
    try {
      const signerWallet = walletGetters.signer(getState());
      const addr = envGetters.apiTendermint(getState());
      const txClient = await initTxClient(signerWallet, addr);
      const msg = await txClient.msgTransfer(value);
      const result = await txClient.signAndBroadcast([msg], {
        fee: { amount: fee, gas: "200000" },
        memo,
      });
      return result;
    } catch (e) {
      if (e == MissingWalletError) {
        throw new SpError(
          "TxClient:MsgTransfer:Init",
          "Could not initialize signing client. Wallet is required."
        );
      } else {
        throw new SpError(
          "TxClient:MsgTransfer:Send",
          "Could not broadcast Tx: " + e.message
        );
      }
    }
  });

const MsgTransfer = createAsyncThunk('ibc.applications.transfer.v1/MsgTransfer', async ({ value }, { getState }) => {
    try {
      const signerWallet = walletGetters.signer(getState());
      const addr = envGetters.apiTendermint(getState());
      const txClient = await initTxClient(signerWallet, addr);
      const msg = await txClient.msgTransfer(value);
      return msg;
    } catch (e) {
      if (e == MissingWalletError) {
        throw new SpError(
          "TxClient:MsgTransfer:Init",
          "Could not initialize signing client. Wallet is required."
        );
      } else {
        throw new SpError(
          "TxClient:MsgTransfer:Create",
          "Could not create message: " + e.message
        );
      }
    }
  });

export {
  init,
  resetState,
  unsubscribe,
  StoreUpdate,
  QueryDenomTrace,
  QueryDenomTraces,
  QueryParams,
  sendMsgTransfer,
  MsgTransfer,
  ibcApplicationTransferGetters,
};

export default ibcApplicationTransferSlice.reducer;
