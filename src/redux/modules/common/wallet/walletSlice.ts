// @ts-nocheck 
import {
  DirectSecp256k1HdWallet,
  DirectSecp256k1Wallet,
} from "@cosmjs/proto-signing";

import { assertIsBroadcastTxSuccess } from "@cosmjs/stargate";
import { stringToPath } from "@cosmjs/crypto";
import CryptoJS from "crypto-js";
import { keyFromWif, keyToWif } from "../../../helpers/keys";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as envActions from "../env/envSlice";

const initialState: any = {
  wallets: JSON.parse(window.localStorage.getItem("wallets")) || [],
  activeWallet: null,
  activeClient: null,
  selectedAddress: "",
  authorized: false,
  gasPrice: "0.0000025token",
};

const connectWithKeplr = createAsyncThunk(
  "wallet/connectWithKeplr",
  async (accountSigner: any, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const state: any = getState().wallet;
    await dispatch(envActions.signIn(accountSigner));

    const wallet = {
      name: "Keplr Integration",
      mnemonic: null,
      HDpath: null,
      password: null,
      prefix: envActions.envGetters.addrPrefix(getState().env),
      pathIncrement: null,
      accounts: [],
    };
    const [account] = await accountSigner.getAccounts();
    wallet.accounts.push({ address: account.address, pathIncrement: null });
    dispatch(ADD_WALLET(wallet));

    try {
      await dispatch(envActions.signIn(accountSigner));

      let client = envActions.envGetters.signingClient(getState().env);
      dispatch(SET_ACTIVE_CLIENT(client));
      dispatch(SET_SELECTED_ADDRESS(account.address));
    } catch (e) {
      console.log(e);
    }
    dispatch(storeWallets());
  }
);

const unlockWallet = createAsyncThunk(
  "wallet/unlockWallet",
  async ({ name, password }: any, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const state: any = getState().wallet;
    const encryptedWallet =
      state.wallets[state.wallets.findIndex((x) => x.name === name)].wallet;
    let wallet;
    if (name == "Keplr Integration") {
      wallet = JSON.parse(encryptedWallet);
    } else {
      wallet = JSON.parse(
        CryptoJS.AES.decrypt(encryptedWallet, password).toString(
          CryptoJS.enc.Utf8
        )
      );
    }
    dispatch(SET_ACTIVE_WALLET(wallet));
    if (wallet.accounts.length > 0) {
      let accountSigner;
      if (wallet.name == "Keplr Integration") {
        accountSigner = window.getOfflineSigner(
          envActions.envGetters.chainId(getState().env)
        );
      } else {
        accountSigner = await DirectSecp256k1HdWallet.fromMnemonic(
          wallet.mnemonic,
          stringToPath(wallet.HDpath + wallet.accounts[0].pathIncrement) as any,
          wallet.prefix
        );
      }
      try {
        await dispatch(envActions.signIn(accountSigner));
        let client = envActions.envGetters.signingClient(state);
        dispatch(SET_ACTIVE_CLIENT(client));
        const [account] = await accountSigner.getAccounts();
        dispatch(SET_SELECTED_ADDRESS(account.address));
      } catch (e) {
        console.log(e);
      }
    }
  }
);

const updateRelayers = (relayers) => (dispatch) => {
  dispatch(SET_RELAYERS(relayers));
  dispatch(storeWallets());
};

const switchAccount = createAsyncThunk(
  "wallet/switchAccount",
  async (address: any, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const state = getState().wallet as any;
    if (!state) return;
    const accountIndex = state.activeWallet.accounts.findIndex(
      (acc) => acc.address == address
    );
    const accountSigner = await DirectSecp256k1HdWallet.fromMnemonic(
      state.activeWallet.mnemonic,
      stringToPath(
        state.activeWallet.HDpath +
          state.activeWallet.accounts[accountIndex].pathIncrement
      ) as any,
      state.activeWallet.prefix
    );

    try {
      await dispatch(envActions.signIn(accountSigner));
      let client = envActions.envGetters.signingClient(getState().env);
      dispatch(SET_ACTIVE_CLIENT(client));
      const [account] = await accountSigner.getAccounts();
      dispatch(SET_SELECTED_ADDRESS(account.address));
    } catch (e) {
      console.log(e);
    }
  }
);

const addAccount = createAsyncThunk(
  "wallet/addAccount",
  async (pathIncrement: any, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const state: any = getState().wallet;
    if (!state) return;

    if (!pathIncrement) {
      pathIncrement = state.activeWallet.pathIncrement + 1;
      dispatch(PATH_INCREMENT());
    }
    const accountSigner = await DirectSecp256k1HdWallet.fromMnemonic(
      getState().wallet.activeWallet.mnemonic,
      stringToPath(getState().wallet.activeWallet.HDpath + pathIncrement) as any,
      getState().wallet.activeWallet.prefix
    );
    const [acc] = await accountSigner.getAccounts();
    const account = {
      address: acc.address,
      pathIncrement: parseInt(pathIncrement),
    };
    if (
      getState().wallet.activeWallet.accounts.findIndex(
        (acc) => acc.address == account.address
      ) == -1
    ) {
      dispatch(ADD_ACCOUNT(account));
      dispatch(storeWallets());
    } else {
      throw new Error("Account already in store.");
    }
  }
);

const storeWallets = () => (dispatch, getState) => {
  const state: any = getState();
  if (!state) return;
  window.localStorage.setItem("wallets", JSON.stringify(getState().wallet.wallets));
  dispatch(SET_BACKUP_STATE(false));
};

const signInWithPrivateKey = createAsyncThunk(
  "wallet/signInWithPrivateKey",
  async ({ prefix = "cosmos", privKey }: any, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const pKey = keyFromWif(privKey.trim());
    const accountSigner = await DirectSecp256k1Wallet.fromKey(pKey, prefix);
    const [firstAccount] = await accountSigner.getAccounts();

    try {
      await dispatch(envActions.signIn(accountSigner));
      let client = envActions.envGetters.signingClient(getState().env);
      dispatch(SET_ACTIVE_CLIENT(client));
      dispatch(SET_SELECTED_ADDRESS(firstAccount.address));
    } catch (e) {
      console.log(e);
    }
  }
);

const restoreWallet = createAsyncThunk(
  "wallet/restoreWallet",
  async ({ encrypted, password }: any, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const state: any = getState();
    if (!state) return;
    const wallet = JSON.parse(
      CryptoJS.AES.decrypt(encrypted, password).toString(CryptoJS.enc.Utf8)
    );
    let newName = wallet.name;
    let incr = 1;
    while (getState().wallet.wallets.findIndex((x) => x.name == newName) != -1) {
      newName = wallet.name + "_" + incr;
      incr++;
    }
    wallet.name = newName;
    const accountSigner = await DirectSecp256k1HdWallet.fromMnemonic(
      wallet.mnemonic,
      stringToPath(wallet.HDpath + "0") as any,
      wallet.prefix
    );
    const [firstAccount] = await accountSigner.getAccounts();
    dispatch(ADD_WALLET(wallet));

    try {
      await dispatch(envActions.signIn(accountSigner));

      let client = envActions.envGetters.signingClient(getState().env);
      dispatch(SET_ACTIVE_CLIENT(client));
      dispatch(SET_SELECTED_ADDRESS(firstAccount.address));
    } catch (e) {
      console.log(e);
    }

    dispatch(storeWallets());
  }
);

const createWalletWithMnemonic = createAsyncThunk(
  "wallet/createWalletWithMnemonic",
  async (
    {
      name = null,
      mnemonic,
      HDpath = "m/44'/118'/0'/0/",
      prefix = "cosmos",
      password = null,
    }: any,
    thunkAPI
  ) => {
    const { dispatch, getState } = thunkAPI;
    const wallet = {
      name,
      mnemonic,
      HDpath,
      password,
      prefix,
      pathIncrement: 0,
      accounts: [],
    };
    const accountSigner = await DirectSecp256k1HdWallet.fromMnemonic(
      mnemonic,
      stringToPath(HDpath + "0") as any,
      prefix
    );
    const [firstAccount] = await accountSigner.getAccounts();
    const account = { address: firstAccount.address, pathIncrement: 0 };
    wallet.accounts.push(account);
    dispatch(ADD_WALLET(wallet));

    try {
      await dispatch(envActions.signIn(accountSigner));

      let client = envActions.envGetters.signingClient(getState().env);
      dispatch(SET_ACTIVE_CLIENT(client));
      dispatch(SET_SELECTED_ADDRESS(firstAccount.address));
    } catch (e) {
      console.log(e);
    }
    dispatch(storeWallets());
  }
);

const sendTransaction = createAsyncThunk(
  "wallet/sendTransaction",
  async ({ message, memo, denom }: any, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const state: any = getState().wallet;
    const fee = {
      amount: [{ amount: "0", denom }],
      gas: "200000",
    };
    try {
      console.log({
        add: state?.selectedAddress,
        msg: [message],
        fee,
        memo,
      });
      const result = await state?.activeClient?.signAndBroadcast(
        state?.selectedAddress,
        [message],
        fee,
        memo
      );
      assertIsBroadcastTxSuccess(result);
    } catch (e) {
      console.log(e);
      throw new Error("Failed to broadcast transaction." + e);
    }
  }
);

export const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    SET_ACTIVE_WALLET: (state, action) => {
      state.activeWallet = action.payload;
      window.localStorage.setItem("lastWallet", action.payload.name);
    },
    SET_ACTIVE_CLIENT: (state, action) => {
      state.activeClient = action.payload;
      state.authorized = true;
    },
    ADD_WALLET: (state, action) => {
      state.activeWallet = action.payload;
      window.localStorage.setItem("lastWallet", action.payload.name);
      if (state.activeWallet.name && state.activeWallet.password) {
        state.wallets.push({
          name: state.activeWallet.name,
          wallet: CryptoJS.AES.encrypt(
            JSON.stringify(state.activeWallet),
            state.activeWallet.password
          ).toString(),
        });
      }
      if (
        state.activeWallet.name == "Keplr Integration" &&
        !state.activeWallet.password
      ) {
        state.wallets.push({
          name: state.activeWallet.name,
          wallet: JSON.stringify(state.activeWallet),
        });
      }
    },
    PATH_INCREMENT: (state) => {
      state.activeWallet.pathIncrement = state.activeWallet.pathIncrement + 1;
    },
    ADD_ACCOUNT: (state, action) => {
      state.activeWallet.accounts.push(action.payload);
      if (state.activeWallet.name && state.activeWallet.password) {
        state.wallets[
          state.wallets.findIndex((x) => x.name === state.activeWallet.name)
        ].wallet = CryptoJS.AES.encrypt(
          JSON.stringify(state.activeWallet),
          state.activeWallet.password
        ).toString();
      }
    },
    SET_RELAYERS: (state, action) => {
      state.activeWallet.accounts.find(
        (x) => x.address == state.selectedAddress
      ).relayers = action.payload;
      if (state.activeWallet.name && state.activeWallet.password) {
        state.wallets[
          state.wallets.findIndex((x) => x.name === state.activeWallet.name)
        ].wallet = CryptoJS.AES.encrypt(
          JSON.stringify(state.activeWallet),
          state.activeWallet.password
        ).toString();
      }
    },
    SET_SELECTED_ADDRESS: (state, action) => {
      state.selectedAddress = action.payload;
    },
    SET_BACKUP_STATE: (state, action) => {
      state.backupState = action.payload;
    },
    ADD_MESSAGE_TYPE: (state, action) => {
      const { typeUrl, type } = action.payload;
      state.activeClient.registry.register(typeUrl, type);
    },
    SIGN_OUT: (state) => {
      state.selectedAddress = "";
      state.activeClient = null;
      state.activeWallet = null;
      state.authorized = false;
    },
  },
});

export const {
  SET_ACTIVE_WALLET,
  SET_ACTIVE_CLIENT,
  ADD_WALLET,
  PATH_INCREMENT,
  ADD_ACCOUNT,
  SET_RELAYERS,
  SET_SELECTED_ADDRESS,
  SET_BACKUP_STATE,
  ADD_MESSAGE_TYPE,
  SIGN_OUT,
} = walletSlice.actions;

export const test = (state) => state.activeWallet;

export const walletGetters = {
  client: (state) => state.activeClient,
  gasPrice: (state) => state.gasPrice,
  wallet: (state) => state.activeWallet,
  address: (state) => state.selectedAddress,
  getMnemonic: (state) => state.activeWallet.mnemonic,
  getPath: (state) =>
    state.activeWallet?.HDpath +
    state.activeWallet?.accounts.find((x) => x.address == state.selectedAddress)
      .pathIncrement,
  relayers: (state) => {
    return (
      state.activeWallet?.accounts.find(
        (x) => x.address == state.selectedAddress
      ).relayers ?? []
    );
  },
  nameAvailable: (state, name) => {
    return state.wallets.findIndex((x) => x.name == name) == -1;
  },
  lastWallet: (state) => {
    if (state.activeWallet) {
      return state.activeWallet.name;
    } else {
      return window.localStorage.getItem("lastWallet");
    }
  },
  loggedIn: (state) => state.activeClient !== null,
  signer: (state) => {
    if (state.activeClient) {
      return state.activeClient.signer;
    } else {
      return null;
    }
  },
  walletName: (state) => (state.activeWallet ? state.activeWallet.name : null),
  privKey: (state) => {
    if (state.activeClient) {
      return keyToWif(state.activeClient.signer.privkey);
    } else {
      return null;
    }
  },
};

const signOut = () => (dispatch) => {
  dispatch(SIGN_OUT());
};

export {
  signOut,
  connectWithKeplr,
  unlockWallet,
  updateRelayers,
  switchAccount,
  addAccount,
  storeWallets,
  signInWithPrivateKey,
  restoreWallet,
  createWalletWithMnemonic,
  sendTransaction,
};

export default walletSlice.reducer;
