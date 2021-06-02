import React, { useState } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { useUIContext } from "../../layout/context";
import { walletGetters } from "../../redux/modules/common/wallet/walletSlice";
import { Amount, AmountWithMeta, Wallet } from "../../utils/interfaces";
import * as bip39 from "bip39";
import { saveAs } from "file-saver";
import AES from "crypto-js/aes";
import dayjs from "dayjs";
import * as WalletActions from "../../redux/modules/common/wallet/walletSlice";
import { cosmosStakingV1beta1Getters } from "../../app/cosmos.staking.v1beta1/slice";
import { cosmosBankV1beta1Getters } from "../../app/cosmos.bank.v1beta1/slice";
import SpCard from "../SpCard";
import SpButton from "../SpButton";
import SpMnemonic from "../SpMnemonic";

export interface SpCreateForm {
  step1: boolean;
  step2: boolean;
  name: string;
  password: string;
  confirm: string;
  mnemonic: string;
}
export interface SpImportForm {
  step1: boolean;
  step2: boolean;
  name: string;
  password: string;
  confirm: string;
  mnemonicOrKey: string;
}
export interface SpWalletCreateState {
  createform: boolean;
  importform: boolean;
  creating: boolean;
  create: SpCreateForm;
  imported: SpImportForm;
}

const SpWalletCreate: React.FC<{ title?: string; close: () => void }> = ({
  title,
  close,
}) => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);
  const dispatch = useDispatch();
  const { _depsLoaded, setDepsLoaded } = useUIContext();
  const [state, setState] = useState<SpWalletCreateState>({
    createform: false,
    importform: false,
    creating: false,
    create: {
      step1: true,
      step2: false,
      name: "",
      password: "",
      confirm: "",
      mnemonic: "",
    },
    imported: {
      step1: true,
      step2: false,
      name: "",
      password: "",
      confirm: "",
      mnemonicOrKey: "",
    },
  });

  const keplrAvailable = (): boolean => {
    return window.keplr ? true : false;
  };

  const nameToCreate = (): string => {
    return state.createform ? state.create.name : state.imported.name;
  };

  const walletNameAvailable = (): boolean => {
    return walletGetters.nameAvailable(reduxStore?.wallet, nameToCreate());
  };

  const wallet = (): Wallet => {
    return reduxStore?.wallet?.activeWallet;
  };

  const validMnemonic = (): boolean => {
    return bip39.validateMnemonic(state.imported.mnemonicOrKey);
  };

  const downloadBackup = (): void => {
    const backup = AES.encrypt(
      JSON.stringify(wallet()),
      wallet().password ?? ""
    );

    const blob = new Blob([backup.toString()], {
      type: "application/octet-stream; charset=us-ascii",
    });
    saveAs(blob, backupName());
  };

  const backupName = (): string => {
    return wallet().name + "_Backup_" + dayjs().format("YYYY-MM-DD") + ".bin";
  };

  const reset = (): void => {
    setState(defaultState());
  };

  const goBack = (): void => {
    if (state.createform) {
      if (state.create.step1) {
        reset();
        return;
      }
      if (state.create.step2) {
        state.create.step2 = false;
        state.create.step1 = true;
        return;
      }
    }

    if (state.importform) {
      if (state.imported.step1) {
        reset();
        return;
      }
      if (state.imported.step2) {
        state.imported.step2 = false;
        state.imported.step1 = true;
        return;
      }
    }
  };

  const generateMnemonic = (): void => {
    const mnemonic = bip39.generateMnemonic(256);
    setState({ ...state, create: { ...state.create, mnemonic: mnemonic } });
  };

  const createStep2 = async (): Promise<void> => {
    setState({ ...state, creating: true });
    if (walletNameAvailable()) {
      setState({
        ...state,
        create: { ...state.create, step1: false, step2: true },
      });
      generateMnemonic();
      await createWallet();
      setState({ ...state, creating: false });
    }
    //this.downloadBackup()
  };

  const importStep2 = (): void => {
    setState({
      ...state,
      imported: { ...state.imported, step1: false, step2: true },
    });
  };

  const done = (): void => {
    reset();
    close();
  };

  const doneImport = async (): Promise<void> => {
    setState({ ...state, creating: true });
    if (walletNameAvailable()) {
      await importWallet();
      setState({ ...state, creating: false });
      reset();
      close();
    }
  };

  const importWallet = async (): Promise<void> => {
    if (_depsLoaded) {
      dispatch(
        WalletActions.createWalletWithMnemonic({
          name: state.imported.name,
          mnemonic: state.imported.mnemonicOrKey,
          password: state.imported.password,
          prefix: reduxStore?.env?.addrPrefix,
        })
      );
      //this.reset()
    }
  };

  const useKeplr = async (): Promise<void> => {
    if (_depsLoaded) {
      const staking = cosmosStakingV1beta1Getters.getParams(
        reduxStore?.cosmosStakingV1beta1
      );
      const tokens = cosmosBankV1beta1Getters.getTotalSupply(
        reduxStore?.cosmosBankV1beta1
      );
      const chainId = reduxStore?.env?.chainId;

      try {
        await window.keplr.experimentalSuggestChain({
          chainId: chainId,
          chainName: reduxStore?.env?.chainName,
          rpc: reduxStore?.env?.rpcNode,
          rest: reduxStore?.env?.apiNode,
          stakeCurrency: {
            coinDenom: staking.params.bond_denom.toUpperCase(),
            coinMinimalDenom: staking.params.bond_denom,
            coinDecimals: 0,
          },
          bip44: {
            coinType: 118,
          },
          bech32Config: {
            bech32PrefixAccAddr: reduxStore?.env?.addrPrefix,
            bech32PrefixAccPub: reduxStore?.env?.addrPrefix + "pub",
            bech32PrefixValAddr: reduxStore?.env?.addrPrefix + "valoper",
            bech32PrefixValPub: reduxStore?.env?.addrPrefix + "valoperpub",
            bech32PrefixConsAddr: reduxStore?.env?.addrPrefix + "valcons",
            bech32PrefixConsPub: reduxStore?.env?.addrPrefix + "valconspub",
          },
          currencies: tokens.supply.map((x: Amount) => {
            const y: AmountWithMeta = {
              amount: "0",
              denom: "",
              coinDenom: "",
              coinMinimalDenom: "",
              coinDecimals: 0,
            };
            y.coinDenom = x.denom.toUpperCase();
            y.coinMinimalDenom = x.denom;
            y.coinDecimals = 0;
            return y;
          }),
          feeCurrencies: tokens.supply.map((x: Amount) => {
            const y: AmountWithMeta = {
              amount: "0",
              denom: "",
              coinDenom: "",
              coinMinimalDenom: "",
              coinDecimals: 0,
            };
            y.coinDenom = x.denom.toUpperCase();
            y.coinMinimalDenom = x.denom;
            y.coinDecimals = 0;
            return y;
          }),
          coinType: 118,
          gasPriceStep: {
            low: 0.01,
            average: 0.025,
            high: 0.04,
          },
        });
        await window.keplr.enable(chainId);
        const offlineSigner = window.getOfflineSigner(chainId);
        await dispatch(WalletActions.connectWithKeplr(offlineSigner));
        done();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const createWallet = async (): Promise<void> => {
    if (_depsLoaded) {
      dispatch(
        WalletActions.createWalletWithMnemonic({
          name: state.create.name,
          mnemonic: state.create.mnemonic,
          password: state.create.password,
          prefix: reduxStore?.env?.addrPrefix,
        })
      );
      //this.reset()
    }
  };

  const defaultState = (): SpWalletCreateState => {
    return {
      createform: false,
      importform: false,
      creating: false,
      create: {
        step1: true,
        step2: false,
        name: "",
        password: "",
        confirm: "",
        mnemonic: "",
      },
      imported: {
        step1: true,
        step2: false,
        name: "",
        password: "",
        confirm: "",
        mnemonicOrKey: "",
      },
    };
  };

  return (
    <>
      <div className="sp-wallet-create sp-shadow">
        {!state.createform && !state.importform ? (
          <div className="sp-wallet-create__close">
            <a className="sp-icon sp-icon-Close" />
          </div>
        ) : (
          <div className="sp-wallet-create__back">
            {state.create.step2 && (
              <a className="sp-icon sp-icon-Lock" onClick={goBack} />
            )}
            {!state.create.step2 && (
              <a className="sp-icon sp-icon-LeftArrow" onClick={goBack} />
            )}
          </div>
        )}

        {!state.createform && !state.importform && (
          <>
            <h3>{title}</h3>
            <div className="sp-wallet-create__text">
              <slot></slot>
            </div>
            <div className="sp-wallet-create__cards">
              <div onClick={() => setState({ ...state, createform: true })}>
                <SpCard type="primary" icon="Add">
                  Create new wallet
                </SpCard>
              </div>
              <div onClick={() => setState({ ...state, importform: true })}>
                <SpCard type="secondary" icon="Upload">
                  Import existing wallet
                </SpCard>
              </div>
            </div>
            {keplrAvailable() && (
              <div className="sp-wallet-create__keplr" onClick={useKeplr}>
                <SpButton type="primary">Use Keplr</SpButton>
              </div>
            )}
          </>
        )}
        {state.createform && state.create.step1 && (
          <>
            <h3>Create wallet</h3>
            <div className="sp-wallet-create__text">
              Generate your own unique wallet. Receive a public address (0x...)
              and choose a method for access and recovery.
            </div>
            <div className="sp-wallet-create__form">
              <div className="sp-form-group">
                <input
                  className={`sp-input ${
                    !walletNameAvailable() && !state.creating && "sp-error"
                  }`}
                  value={state.create.name}
                  onChange={(e) =>
                    setState({
                      ...state,
                      create: { ...state.create, name: e.target.value },
                    })
                  }
                  type="text"
                  name="walletname"
                  placeholder="Wallet name"
                />
              </div>
              {!walletNameAvailable() && !state.creating && (
                <div className="sp-error-message">
                  A wallet by this name already exist. Please choose a different
                  one.
                </div>
              )}

              <div className="sp-form-group">
                <input
                  className="sp-input"
                  value={state.create.password}
                  onChange={(e) =>
                    setState({
                      ...state,
                      create: { ...state.create, password: e.target.value },
                    })
                  }
                  name="password"
                  type="password"
                  placeholder="Password"
                />
                <input
                  className="sp-input"
                  value={state.create.confirm}
                  onChange={(e) =>
                    setState({
                      ...state,
                      create: { ...state.create, confirm: e.target.value },
                    })
                  }
                  name="confirm"
                  type="password"
                  placeholder="Confirm password"
                />
              </div>
              {state.create.password != "" &&
                state.create.password != state.create.confirm && (
                  <div className="sp-error-message">Passwords do not match</div>
                )}
              <div onClick={createStep2}>
                <SpButton type="primary">Create</SpButton>
              </div>
            </div>
          </>
        )}
        {state.createform && state.create.step2 && (
          <>
            <h3>
              Here is your
              <br />
              recovery phrase
            </h3>
            <div className="sp-wallet-create__text">
              You can restore your wallet using your recovery phrase.
            </div>
            <div className="sp-wallet-create__text">
              Write it down on paper. Resist temptation to email it to yourself
              or sceenshot it.
            </div>
            <SpMnemonic mnemonic={state.create.mnemonic} />
            <div onClick={downloadBackup}>
              <SpButton type="secondary">Download Backup</SpButton>
            </div>
            <div onClick={done}>
              <SpButton type="primary">Done</SpButton>
            </div>
          </>
        )}
        {state.importform && state.imported.step1 && (
          <>
            <h3>
              Import
              <br />
              existing wallet
            </h3>
            <div className="sp-wallet-create__text">
              Paste your recovery phrase or private key below to import your
              wallet.
            </div>
            <textarea
              className="sp-key-area sp-textarea"
              value={state.imported.mnemonicOrKey}
              onChange={(e) =>
                setState({
                  ...state,
                  imported: {
                    ...state.imported,
                    mnemonicOrKey: e.target.value,
                  },
                })
              }
            ></textarea>
            {/* <!--
			<SpMnemonicInput
				className="sp-key-area sp-textarea"
				v-model="imported.mnemonicOrKey"
			></SpMnemonicInput>
			//--> */}
            {state.imported.mnemonicOrKey != "" && !validMnemonic() && (
              <div className="sp-error-message">
                You have not entered a valid mnemonic or private key.
              </div>
            )}

            <div onClick={importStep2}>
              <SpButton
                type="primary"
                disabled={
                  state.imported.mnemonicOrKey == "" || !validMnemonic()
                }
              >
                Next
              </SpButton>
            </div>
          </>
        )}
        {state.importform && state.imported.step2 && (
          <>
            <h3>Import existing wallet</h3>
            <div className="sp-wallet-create__text">
              Please name your wallet and choose a password
            </div>
            <div className="sp-wallet-create__form">
              <div className="sp-form-group">
                <input
                  className={`sp-input ${
                    !walletNameAvailable() && !state.creating && "sp-error"
                  }`}
                  value={state.imported.name}
                  onChange={(e) =>
                    setState({
                      ...state,
                      imported: { ...state.imported, name: e.target.value },
                    })
                  }
                  type="text"
                  name="walletname"
                  placeholder="Wallet name"
                />
              </div>
              <div className="sp-form-group">
                <input
                  className="sp-input"
                  value={state.imported.password}
                  onChange={(e) =>
                    setState({
                      ...state,
                      imported: { ...state.imported, password: e.target.value },
                    })
                  }
                  name="password"
                  type="password"
                  placeholder="Password"
                />
                <input
                  className="sp-input"
                  value={state.imported.confirm}
                  onChange={(e) =>
                    setState({
                      ...state,
                      imported: { ...state.imported, confirm: e.target.value },
                    })
                  }
                  name="confirm"
                  type="password"
                  placeholder="Confirm password"
                />
              </div>
              <div onClick={doneImport}>
                <SpButton
                  disabled={
                    state.imported.name == "" ||
                    state.imported.password == "" ||
                    state.imported.password != state.imported.confirm
                  }
                >
                  Done
                </SpButton>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SpWalletCreate;
