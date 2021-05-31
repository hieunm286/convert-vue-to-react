import React from "react";
import { RootStateOrAny, useSelector } from "react-redux";
import SpStatusLED from "../SpStatusLED";

const SpStatusWS: React.FC<{ showText?: boolean }> = ({ showText }) => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);

  const wsNode = (): string => {
    return reduxStore.env?.wsNode;
  };

  const nodeStatus = (): boolean => {
    return reduxStore.env?.wsConnected;
  };

  return (
    <>
      <div className="sp-status-ws">
        <SpStatusLED status={nodeStatus()} />
        {showText && (
          <div className="sp-status-ws__text" title={"WebSocket " + wsNode()}>
            WebSocket
          </div>
        )}
      </div>
    </>
  );
};

export default SpStatusWS;
