import React from "react";
import { RootStateOrAny, useSelector } from "react-redux";
import SpStatusLED from "../SpStatusLED";

const SpStatusRPC: React.FC<{ showText?: boolean }> = ({ showText }) => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);

  const rpcNode = (): string => {
    return reduxStore.env?.rpcNode;
  };

  const nodeStatus = (): boolean => {
    return reduxStore.env?.rpcConnected;
  };

  return (
    <>
      <div className="sp-status-rpc">
        <SpStatusLED status={nodeStatus()} />
        {showText && (
          <div
            className="sp-status-rpc__text"
            title={"Tendermint RPC " + rpcNode()}
          >
            Tendermint RPC
          </div>
        )}
      </div>
    </>
  );
};

export default SpStatusRPC;
