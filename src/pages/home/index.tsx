import React from "react";
import { RootStateOrAny, useSelector } from "react-redux";
import SpTokenSend from "../../components/SpTokenSend";
import SpTransferList from "../../components/SpTransferList";

const HomePage = () => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);

  const address = () => {
    return reduxStore?.wallet?.selectedAddress;
  };

  return (
    <>
      <div>
        <div className="container">
          <SpTokenSend address={address()} />
          <SpTransferList address={address()} />
        </div>
      </div>
    </>
  );
};

export default HomePage;
