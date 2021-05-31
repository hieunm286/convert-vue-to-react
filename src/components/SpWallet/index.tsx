import React, { useEffect, useState } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { useUIContext } from "../../layout/context";
import { Wallet } from "../../utils/interfaces";
import SpButton from "../SpButton";
import SpWalletCreate from "../SpWalletCreate";
import SpWalletMenu from "../SpWalletMenu";

const SpWallet = () => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);
  const dispatch = useDispatch();
  const { _depsLoaded, setDepsLoaded } = useUIContext();
  const [create, setCreate] = useState<boolean>(false);

  useEffect(() => {
    if (!reduxStore?.wallet) {
      setDepsLoaded(false);
    }
  }, [reduxStore?.wallet]);

  const walletList = (): Array<Wallet> => {
    if (_depsLoaded) {
      return reduxStore?.wallet.wallets;
    } else {
      return [];
    }
  };

  const createNew = () => {
    setCreate(true);
  };

  const close = () => {
      setCreate(false)
  }

  return (
    <>
      {_depsLoaded && (
        <div className="sp-wallet">
          {walletList().length > 0 && !create ? (
            <SpWalletMenu createNew={createNew} />
          ) : walletList().length == 0 && !create ? (
            <div onClick={createNew}>
              <SpButton>Access wallet</SpButton>
            </div>
          ) : (
            <SpWalletCreate
              title="Access wallet"
              close={close}
            >
              Create or import an existing wallet to manage your DeFi portfolio.
            </SpWalletCreate>
          )}
        </div>
      )}
    </>
  );
};

export default SpWallet;
