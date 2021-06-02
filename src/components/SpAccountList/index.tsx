import React, { useEffect, useState } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { useUIContext } from "../../layout/context";
import { walletGetters } from "../../redux/modules/common/wallet/walletSlice";
import { copyToClipboard } from "../../utils/helpers";
import { Account, Wallet } from "../../utils/interfaces";
import * as WalletActions from "../../redux/modules/common/wallet/walletSlice";
import SpLinkIcon from "../SpLinkIcon";

export interface NewAccount {
  show: boolean;
  nextAvailable: boolean;
  pathIncrement: number | undefined;
}

export interface SpAccountListState {
  newAccount: NewAccount;
}

const SpAccountList: React.FC = () => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);
  const dispatch = useDispatch();
  const { _depsLoaded, setDepsLoaded } = useUIContext();

  const [newAccount, setNewAccount] = useState<NewAccount>({
    show: false,
    nextAvailable: true,
    pathIncrement: undefined,
  });

  useEffect(() => {
    if (!reduxStore?.wallet) {
      setDepsLoaded(false);
    }
  }, [reduxStore?.wallet]);

  const activeWallet = (): Wallet => {
    return reduxStore.wallet?.activeWallet;
  };

  const accountList = (): Account[] => {
    return reduxStore.wallet?.activeWallet?.accounts;
  };

  const HDPath = (): string => {
    return reduxStore.wallet?.activeWallet?.HDpath;
  };

  const depsLoaded = (): boolean => {
    return _depsLoaded;
  };

  const currentAccount = (): string | null => {
    if (_depsLoaded) {
      return walletGetters.address(reduxStore?.wallet);
    } else {
      return null;
    }
  };

  const copyAddress = (address: string): void => {
    copyToClipboard(address);
  };

  const defaultState = (): NewAccount => {
    return {
      show: false,
      nextAvailable: true,
      pathIncrement: undefined,
    };
  };

  const reset = (): void => {
    const rsState = defaultState();
    setNewAccount(rsState);
  };

  const newAccountForm = (): void => {
    const showNewAccount = { ...newAccount };
    showNewAccount.show = true;
    setNewAccount(showNewAccount);
  };

  const shortenAddress = (addr: string): string => {
    return addr.substr(0, 10) + "..." + addr.slice(-5);
  };

  const usingAccount = (address: string): void => {
    if (_depsLoaded) {
      dispatch(WalletActions.switchAccount(address));
    }
  };

  const createAccount = (): void => {
    if (_depsLoaded) {
      if (newAccount.nextAvailable) {
        dispatch(WalletActions.addAccount(undefined));
      } else {
        dispatch(WalletActions.addAccount(newAccount.pathIncrement));
      }
    }
    reset();
  };

  const handleNextAvailableChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewAccount({ ...newAccount, nextAvailable: e.target.checked });
  };

  const handlePathIncrement = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAccount({ ...newAccount, pathIncrement: parseFloat(e.target.value) });
  };

  return (
    <>
      {depsLoaded() && (
        <div className="sp-accounts-list">
          {!newAccount.show && (
            <div>
              {accountList()?.length > 0 && (
                <ul className="sp-accounts-list-items">
                  {accountList().map((account, key) => (
                    <li key={account.address} className="sp-accounts-list-item">
                      <div className="sp-accounts-list-item__use">
                        <div className="sp-accounts-list-item__path">
                          {account.pathIncrement}
                        </div>
                        <div
                          className={`sp-accounts-list-item__address ${
                            account.address == currentAccount() && "sp-active"
                          }`}
                          onClick={() => usingAccount(account.address)}
                        >
                          {shortenAddress(account.address)}
                        </div>
                        <div
                          className="sp-accounts-list-item__copy"
                          onClick={() => copyAddress(account.address)}
                        >
                          <span className="sp-icon sp-icon-Copy" />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {activeWallet()?.name != "Keplr Integration" &&
                activeWallet()?.password != null && (
                  <div className="sp-accounts-new">
                    <div onClick={createAccount}>
                      <SpLinkIcon icon="AddNew" text="Generate new address" />
                    </div>
                  </div>
                )}
            </div>
          )}
          {newAccount.show && (
            <div className="SpAccountForm SpForm">
              <div className="SpFormTitle">
                <strong>ADD ACCOUNT:</strong>
              </div>
              <div className="SpAccountCheckbox SpCheckbox">
                <label htmlFor="SpAccountNextAvailable">
                  CREATE NEXT AVAILABLE ACCOUNT?
                  <input
                    type="checkbox"
                    checked={newAccount.nextAvailable}
                    onChange={handleNextAvailableChange}
                    id="SpAccountNextAvailable"
                  />
                </label>
              </div>
              <div className="SpAccountHDPath" v-if="!newAccount.nextAvailable">
                USE SPECIFIC HD PATH: <em>{HDPath()}</em>
                <input
                  type="number"
                  value={newAccount.pathIncrement}
                  onChange={handlePathIncrement}
                  className="SpInputNumber"
                />
              </div>
              <div className="SpAccountCreate">
                <button onClick={createAccount} className="SpButton">
                  <div className="SpButtonText">CREATE ACCOUNT</div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SpAccountList;
