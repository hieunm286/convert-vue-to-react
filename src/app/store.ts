import { applyMiddleware, configureStore } from '@reduxjs/toolkit';
import env from '../redux/modules/common/env';
import envReducer from '../redux/modules/common/env/envSlice';
import wallet from '../redux/modules/common/wallet';
import walletReducer from '../redux/modules/common/wallet/walletSlice';
import cosmosStakingV1beta1Reducer from './cosmos.staking.v1beta1/slice';
import ibcApplicationsTransferV1Reducer from './ibc.applications.transfer.v1/slice';
import cosmosBankV1beta1Reducer from './cosmos.bank.v1beta1/slice';
import thunkMiddleware from 'redux-thunk';
import relayersReducer from '../redux/modules/common/relayers/relayerSlice';
import blocksReducer from '../redux/modules/common/blocks/blockSlice';
import transfersReducer from '../redux/modules/common/transfers/transferSlice';

const init = () => {
  const initEnv = env();
  const initWallet = wallet();
  const preloadedState = {
    env: initEnv,
    wallet: initWallet,
    relayers: {}
  }

  return preloadedState;
}

export const store = configureStore({
  reducer: {
    ibcApplicationsTransferV1: ibcApplicationsTransferV1Reducer,
    cosmosStakingV1beta1: cosmosStakingV1beta1Reducer,
    cosmosBankV1beta1: cosmosBankV1beta1Reducer,
    env: envReducer,
    wallet: walletReducer,
    relayers: relayersReducer,
    blocks: blocksReducer,
    transfers: transfersReducer
  },
  
  // preloadedState: init()
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
