import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Client from "@starport/client-js";
import SpError from "../../../errors/SpError";
import * as cosmosStakingV1beta1Actions from "../../../../app/cosmos.staking.v1beta1/slice";
import * as cosmosBankV1beta1Actions from "../../../../app/cosmos.bank.v1beta1/slice";

const apiNode =
  (process.env.REACT_APP_API_COSMOS &&
    process.env.REACT_APP_API_COSMOS.replace("0.0.0.0", "localhost")) ||
  "http://localhost:1317";
const rpcNode =
  (process.env.REACT_APP_API_TENDERMINT &&
    process.env.REACT_APP_API_TENDERMINT.replace("0.0.0.0", "localhost")) ||
  "http://localhost:26657";
const wsNode =
  (process.env.REACT_APP_WS_TENDERMINT &&
    process.env.REACT_APP_WS_TENDERMINT.replace("0.0.0.0", "localhost")) ||
  "ws://localhost:26657/websocket";
const addrPrefix = process.env.REACT_APP_ADDRESS_PREFIX || "cosmos";

const initialState = {
  chainId: "",
  addrPrefix: addrPrefix,
  sdkVersion: "Stargate",
  apiNode: apiNode,
  rpcNode: rpcNode,
  wsNode: wsNode,
  client: null,
  chainName: "",
  apiConnected: false,
  rpcConnected: false,
  wsConnected: false,
  getTXApi: "",
  initialized: false,
};

export const envSlice = createSlice({
  name: "env",
  initialState,
  reducers: {
    SET_CONFIG: (state, action) => {
      const config = action.payload;
      state.apiNode = config.apiNode;
      if (config.rpcNode) {
        state.rpcNode = config.rpcNode;
      }
      if (config.wsNode) {
        state.wsNode = config.wsNode;
      }
      if (config.chainId) {
        state.chainId = config.chainId;
      }
      if (config.addrPrefix) {
        state.addrPrefix = config.addrPrefix;
      }
      if (config.sdkVersion) {
        state.sdkVersion = config.sdkVersion;
      }
      if (config.getTXApi) {
        state.getTXApi = config.getTXApi;
      }
    },
    CONNECT: (state, action) => {
      const { client } = action.payload;
      state.client = client;
    },
    INITIALIZE_WS_COMPLETE: (state) => {
      state.initialized = true;
    },
    SET_CHAIN_ID: (state, action) => {
      state.chainId = action.payload;
    },
    SET_CHAIN_NAME: (state, action) => {
      state.chainName = action.payload;
    },
    SET_WS_STATUS(state, action) {
      state.wsConnected = action.payload;
    },
    SET_API_STATUS(state, action) {
      state.apiConnected = action.payload;
    },
    SET_RPC_STATUS(state, action) {
      state.rpcConnected = action.payload;
    },
    SET_TX_API(state, action) {
      state.getTXApi = action.payload;
    },
  },
});

export const {
  SET_CONFIG,
  CONNECT,
  INITIALIZE_WS_COMPLETE,
  SET_CHAIN_ID,
  SET_CHAIN_NAME,
  SET_WS_STATUS,
  SET_API_STATUS,
  SET_RPC_STATUS,
  SET_TX_API,
} = envSlice.actions;

export const envGetters = {
  client: (state) => state.client,
  signingClient: (state) => state.client.signingClient,
  chainId: (state) => state.chainId,
  chainName: (state) => state.chainName,
  addrPrefix: (state) => state.addrPrefix,
  apiTendermint: (state) => state.rpcNode,
  apiCosmos: (state) => state.apiNode,
  apiWS: (state) => state.wsNode,
  sdkVersion: (state) => state.sdkVersion,
  apiConnected: (state) => state.apiConnected,
  rpcConnected: (state) => state.rpcConnected,
  wsConnected: (state) => state.wsConnected,
};

const initConfig = {
  starportUrl: "http://localhost:12345",
  apiNode: apiNode,
  rpcNode: rpcNode,
  wsNode: wsNode,
  chainId: "",
  addrPrefix: addrPrefix,
  chainName: "",
  sdkVersion: "Stargate",
  getTXApi: rpcNode + "/tx?hash=0x",
};

const init = createAsyncThunk(
  "env/init",
  async (configs = initConfig, thunkAPI) => {
	const { dispatch, getState } = thunkAPI;
    try {
      dispatch(config(configs));
      console.log("Redux nodule: common.env initialized!");
    } catch (e) {
      throw new SpError("Env:Config", "Could not configure environment");
    }
  }
);

const config = createAsyncThunk(
  "env/config",
  async (
    config = {
      apiNode: "http://localhost:1317",
      rpcNode: "http://localhost:26657",
      wsNode: "ws://localhost:26657/websocket",
      chainName: "",
      chainId: "",
      addrPrefix: "",
      sdkVersion: "Stargate",
      getTXApi: "http://localhost:26657/tx?hash=0x",
    },
    thunkAPI
  ) => {
	const { dispatch, getState } = thunkAPI;
    const state = getState();
    try {
      let client;
      if (!state.client) {
        client = new Client({
          apiAddr: config.apiNode,
          rpcAddr: config.rpcNode,
          wsAddr: config.wsNode,
        });
        client.setMaxListeners(0);
        client.on("chain-id", (id) => {
          if (id) {
            dispatch(SET_CHAIN_ID(id));
          }
        });
        client.on("chain-name", (name) => {
          if (name) {
            dispatch(SET_CHAIN_NAME(name));
          }
        });
        client.on("ws-status", (status) =>
          dispatch(setConnectivity({ connection: "ws", status: status }))
        );
        client.on("api-status", (status) =>
          dispatch(setConnectivity({ connection: "api", status: status }))
        );
        client.on("rpc-status", (status) =>
          dispatch(setConnectivity({ connection: "rpc", status: status }))
        );
        dispatch(SET_CONFIG(config));
        await dispatch(
          cosmosStakingV1beta1Actions.QueryParams({
            options: { subscribe: false, all: false },
            params: {},
            query: null,
          })
        );
        await dispatch(
          cosmosBankV1beta1Actions.QueryTotalSupply({
            options: { subscribe: false, all: false },
            params: {},
            query: null,
          })
        );
        // commit('CONNECT', { client })
        dispatch(CONNECT({ client }));
        // commit('INITIALIZE_WS_COMPLETE')
        dispatch(INITIALIZE_WS_COMPLETE());
      } else {
        client = state.client;
        let reconnectWS = false;
        let reconnectSigningClient = false;
        let reconnectClient = false;
        if (config.wsNode != state.wsNode) {
          reconnectWS = true;
        }
        if (config.rpcNode != state.rpcNode) {
          reconnectSigningClient = true;
        }
        if (config.apiNode != state.apiNode) {
          reconnectClient = true;
        }
        // commit('SET_CONFIG', config)
        dispatch(SET_CONFIG(config));
        if (reconnectWS && config.wsNode) {
          try {
            await client.switchWS(config.wsNode);
          } catch (e) {
            throw new SpError(
              "Env:Client:Websocket",
              "Could not switch to websocket node:" + config.wsNode
            );
          }
        }
        if (reconnectClient && config.apiNode) {
          client.switchAPI(config.apiNode);
        }
        if (reconnectSigningClient && config.rpcNode) {
          try {
            await client.switchRPC(config.rpcNode);
          } catch (e) {
            throw new SpError(
              "Env:Client:TendermintRPC",
              "Could not switch to Tendermint RPC node:" + config.rpcNode
            );
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
);

// const config = async (
// 		// { commit, state, dispatch },
// 		config = {
// 			apiNode: 'http://localhost:1317',
// 			rpcNode: 'http://localhost:26657',
// 			wsNode: 'ws://localhost:26657/websocket',
// 			chainName: '',
// 			chainId: '',
// 			addrPrefix: '',
// 			sdkVersion: 'Stargate',
// 			getTXApi: 'http://localhost:26657/tx?hash=0x',
// 		}
// 	) => async (dispatch, getState) => {
// 		const state = getState();
// 		try {
// 			let client
// 			if (!state.client) {
// 				client = new Client({
// 					apiAddr: config.apiNode,
// 					rpcAddr: config.rpcNode,
// 					wsAddr: config.wsNode,
// 				})
// 				client.setMaxListeners(0)
// 				client.on('chain-id', (id) => {
// 					if (id) {
// 						dispatch(SET_CHAIN_ID(id))
// 					}
// 				})
// 				client.on('chain-name', (name) => {
// 					if (name) {
// 						dispatch(SET_CHAIN_NAME(name))
// 					}
// 				})
// 				client.on('ws-status', (status) => dispatch(setConnectivity({ connection: 'ws', status: status })))
// 				client.on('api-status', (status) => dispatch(setConnectivity({ connection: 'api', status: status })))
// 				client.on('rpc-status', (status) => dispatch(setConnectivity({ connection: 'rpc', status: status })))
// 				dispatch(SET_CONFIG(config))
// 				await dispatch(
// 					cosmosStakingV1beta1Actions.QueryParams({
// 						options: { subscribe: false, all: false },
// 						params: {},
// 						query: null,
// 					})
// 				)
// 				await dispatch(
// 					cosmosBankV1beta1Actions.QueryTotalSupply({
// 						options: { subscribe: false, all: false },
// 						params: {},
// 						query: null,
// 					})
// 				)
// 				// commit('CONNECT', { client })
// 				dispatch(CONNECT({ client }))
// 				// commit('INITIALIZE_WS_COMPLETE')
// 				dispatch(INITIALIZE_WS_COMPLETE())
// 			} else {
// 				client = state.client
// 				let reconnectWS = false
// 				let reconnectSigningClient = false
// 				let reconnectClient = false
// 				if (config.wsNode != state.wsNode) {
// 					reconnectWS = true
// 				}
// 				if (config.rpcNode != state.rpcNode) {
// 					reconnectSigningClient = true
// 				}
// 				if (config.apiNode != state.apiNode) {
// 					reconnectClient = true
// 				}
// 				// commit('SET_CONFIG', config)
// 				dispatch(SET_CONFIG(config))
// 				if (reconnectWS && config.wsNode) {
// 					try {
// 						await client.switchWS(config.wsNode)
// 					} catch (e) {
// 						throw new SpError('Env:Client:Websocket', 'Could not switch to websocket node:' + config.wsNode)
// 					}
// 				}
// 				if (reconnectClient && config.apiNode) {
// 					client.switchAPI(config.apiNode)
// 				}
// 				if (reconnectSigningClient && config.rpcNode) {
// 					try {
// 						await client.switchRPC(config.rpcNode)
// 					} catch (e) {
// 						throw new SpError(
// 							'Env:Client:TendermintRPC',
// 							'Could not switch to Tendermint RPC node:' + config.rpcNode,
// 						)
// 					}
// 				}
// 			}
// 		} catch (e) {
// 			console.error(e)
// 		}
// 	}

const setTxAPI = (payload) => (dispatch) => {
  dispatch(SET_TX_API(payload));
};

const setConnectivity = (payload) => (dispatch) => {
    switch (payload.connection) {
      case "ws":
        dispatch(SET_WS_STATUS(payload.status));
        break;
      case "api":
        dispatch(SET_API_STATUS(payload.status));
        break;
      case "rpc":
        dispatch(SET_RPC_STATUS(payload.status));
        break;
      default:
        break;
    }
  }

const signIn = createAsyncThunk("env/signIn", async (signer, { getState }) => {
  const state = getState();
  try {
    await state.client.useSigner(signer);
  } catch (e) {
    throw new SpError(
      "Env:Client:Wallet",
      "Could not create signing client with signer: " + signer
    );
  }
});

export { init, config, setTxAPI, setConnectivity, signIn };

export default envSlice.reducer;
