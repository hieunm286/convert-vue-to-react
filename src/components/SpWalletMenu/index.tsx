import React, { useEffect, useRef, useState } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { useUIContext } from "../../layout/context";
import { Wallet } from "../../utils/interfaces";
import avatar from "gradient-avatar";
import MD5 from "crypto-js/md5";
import * as WalletActions from "../../redux/modules/common/wallet/walletSlice";
import { useOnClickOutside } from "../../hooks/utils.hooks";
import SpAccountList from "../SpAccountList";
import SpLinkIcon from "../SpLinkIcon";
import SpButton from "../SpButton";

const SpWalletMenu: React.FC<{ createNew: () => void }> = ({ createNew }) => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);
  const dispatch = useDispatch();
  const { _depsLoaded, setDepsLoaded } = useUIContext();

  const [opened, setOpened] = useState<boolean>(false);
  const [unlocking, setUnlocking] = useState<boolean>(false);
  const [toUnlock, setToUnlock] = useState<string | null>(null);
  const [password, setPassword] = useState<string>("");
  const ref = useRef(null);

  useEffect(() => {
    if (!reduxStore?.wallet) {
      setDepsLoaded(false);
    }
  }, [reduxStore?.wallet]);

  useOnClickOutside(ref, () => {
    setOpened(false);
  });

  const walletList = (): Wallet[] => {
    if (_depsLoaded) {
      return reduxStore?.wallet?.wallets;
    } else {
      return [];
    }
  };

  const walletToUnlock = (): Wallet | undefined => {
    return walletList().find((x) => x.name == toUnlock);
  };

  const shortAddress = (): string | null => {
    if (currentAccount()) {
      return (
        currentAccount().substr(0, 10) + "..." + currentAccount().slice(-5)
      );
    } else {
      return null;
    }
  };

  const currentAccount = (): string | null => {
    if (_depsLoaded) {
      if (_depsLoaded) {
        if (loggedIn()) {
          return reduxStore?.wallet?.selectedAddress;
        } else {
          return null;
        }
      }
    } else {
      return null;
    }
  };

  const walletName = (): string => {
    if (_depsLoaded) {
      return reduxStore?.wallet?.activeWallet?.name ?? null;
    } else {
      return "";
    }
  };

  const loggedIn = (): boolean => {
    if (_depsLoaded) {
      return reduxStore?.wallet?.activeClient !== null;
    } else {
      return false;
    }
  };

  const lastWallet = (): string | null => {
    if (_depsLoaded) {
      if (reduxStore?.wallet?.activeWallet) {
        return reduxStore?.wallet?.activeWallet.name;
      } else {
        return window.localStorage.getItem("lastWallet");
      }
    } else {
      return null;
    }
  };

  const topWallet = (): Wallet => {
    return walletList().filter((x) => x.name == lastWallet())[0];
  };

  const restWallets = (): Wallet[] => {
    return walletList().filter((x) => x.name != lastWallet());
  };

  const getAvatar = (name: string): string => {
    return avatar(MD5(name) + "", 64);
  };

  const unlockStoreWallet = async (): Promise<void> => {
    if (_depsLoaded) {
      await dispatch(
        WalletActions.unlockWallet({
          name: walletToUnlock()?.name,
          password: password,
        })
      );
      setUnlocking(false);
    }
  };

  const createNewWallet = (): void => {
    createNew();
  };

  const toggleWallet = async (name: string): Promise<void> => {
    if (name != walletName()) {
      if (name == "Keplr Integration") {
        await window.keplr.enable(reduxStore?.env?.chainId);
        await dispatch(
          WalletActions.unlockWallet({
            name,
            password: null,
          })
        );
      } else {
        setToUnlock(name);
        setUnlocking(true);
      }
    } else {
      dispatch(WalletActions.signOut());
      setToUnlock("");
      setUnlocking(false);
    }
  };

  return (
    <>
      {_depsLoaded && !unlocking ? (
        <div
          className={`sp-wallet-menu sp-rounded sp-shadow ${
            opened && "sp-opened"
          }`}
          ref={ref}
        >
          <div
            className="sp-wallet-menu__toggle"
            onClick={() => setOpened(!opened)}
          >
            <span
              className={`sp-icon ${!opened && "sp-icon-DownCaret"} ${
                opened && "sp-icon-UpCaret"
              }`}
            />
          </div>
          <div className="sp-wallet-menu-items">
            {topWallet() && (
              <>
                <div
                  className={`sp-wallet-menu-item ${
                    topWallet().name != walletName() &&
                    "sp-wallet-menu-item__locked"
                  }`}
                  onClick={() => setOpened(!opened)}
                >
                  <div className="sp-wallet-menu-item__avatar">
                    {getAvatar(topWallet().name)}
                  </div>
                  <div className="sp-wallet-menu-item__avatar-shadow">
                    {getAvatar(topWallet.name)}
                  </div>
                  <div className="sp-wallet-menu-item__info">
                    <span className="sp-text sp-bold sp-active">
                      {topWallet.name}
                    </span>
                    <br />
                    {topWallet().name == walletName() ? (
                      <span className="sp-text" title="currentAccount">
                        {shortAddress()}
                      </span>
                    ) : (
                      <span className="sp-text"> Locked </span>
                    )}
                  </div>
                  <div className="sp-wallet-menu-item__status">
                    {opened && (
                      <span
                        className={`sp-icon ${
                          topWallet().name == walletName() && "sp-icon-Unlock"
                        } ${
                          topWallet().name != walletName() && "sp-icon-Lock"
                        }`}
                        onClick={() => toggleWallet(topWallet().name)}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
            {topWallet().name == walletName() && (
              <>
                <div className="sp-wallet-menu__accounts">
                  <SpAccountList />
                </div>
              </>
            )}
            {restWallets().map((wallet, index) => (
              <div
                className={`sp-wallet-menu-item ${
                  wallet.name != walletName() && "sp-wallet-menu-item__locked"
                }`}
                key={wallet.name}
                onClick={() => toggleWallet(wallet.name)}
              >
                <div className="sp-wallet-menu-item__avatar">
                  {getAvatar(wallet.name)}
                </div>
                <div className="sp-wallet-menu-item__avatar-shadow">
                  {getAvatar(wallet.name)}
                </div>
                <div className="sp-wallet-menu-item__info">
                  <span
                    className={`sp-text sp-bold ${
                      !topWallet() && index == 0 && "sp-active"
                    }`}
                  >
                    {wallet.name}
                  </span>
                  <br />
                  {wallet.name == walletName() ? (
                    <span className="sp-text">{currentAccount()}</span>
                  ) : (
                    <span className="sp-text"> Locked </span>
                  )}
                </div>
                <div className="sp-wallet-menu-item__status">
                  {topWallet() ||
                    index > 0 ||
                    (opened && (
                      <span
                        className={`sp-icon ${
                          wallet.name == walletName() && "sp-icon-Unlock"
                        } ${wallet.name != walletName() && "sp-icon-Lock"}`}
                        onClick={() => toggleWallet(wallet.name)}
                      />
                    ))}
                </div>
              </div>
            ))}

            <div className="sp-dash"></div>
            <div className="sp-wallet-menu-action">
              <div onClick={createNewWallet}>
                <SpLinkIcon icon="AddNew" text="Add New Wallet" />
              </div>
            </div>
          </div>
        </div>
      ) : _depsLoaded && unlocking ? (
        <div className="sp-wallet-menu sp-rounded sp-opened">
          <div
            className="sp-wallet-menu__toggle"
            onClick={() => {
              setUnlocking(false);
              setToUnlock(null);
            }}
          >
            <span
              className={`sp-icon ${
                !unlocking ? "sp-icon-DownCaret" : "sp-icon-Close"
              }`}
            />
          </div>
          <div className="sp-wallet-menu-items">
            <div className="sp-wallet-menu-item">
              <div className="sp-wallet-menu-item__avatar">
                {getAvatar(walletToUnlock()?.name ?? "")}
              </div>
              <div className="sp-wallet-menu-item__avatar-shadow">
                {getAvatar(walletToUnlock()?.name ?? "")}
              </div>
              <div className="sp-wallet-menu-item__info">
                <span className="sp-text sp-bold sp-active">
                  {walletToUnlock()?.name}
                </span>
                <br />
                <span className="sp-text"> Locked </span>
              </div>
            </div>
          </div>
          <div className="sp-wallet-menu-unlock">
            <div className="sp-wallet-menu-unlock__title sp-header-text">
              Unlock Wallet
            </div>
            <div className="sp-wallet-menu-unlock__text">
              Enter your Wallet password below to unlock and access your
              addresses.
            </div>
            <div className="sp-wallet-menu-unlock__form">
              <div className="sp-form-group">
                <input
                  className="sp-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  name="password"
                  placeholder="Password"
                />
              </div>
              <div onClick={unlockStoreWallet}>
                <SpButton type="primary">Unlock Wallet</SpButton>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default SpWalletMenu;
