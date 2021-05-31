import React from "react";
import { RootStateOrAny, useSelector } from "react-redux";
import SpStatusLED from "../SpStatusLED";

const SpStatusAPI: React.FC<{ showText?: boolean }> = ({ showText }) => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);

  const apiNode = (): string => {
    return reduxStore.env?.apiNode;
  };

  const nodeStatus = (): boolean => {
    return reduxStore.env?.apiConnected;
  };

  return (
    <>
      <div className="sp-status-api">
        <SpStatusLED
          status={nodeStatus()}
        //   alt={"Cosmos SDK API " + apiNode()}
        //   title={"Cosmos SDK API " + apiNode()}
        />
        {showText && (
          <div
            className="sp-status-api__text"
            // alt={'Cosmos SDK API ' + apiNode()}
            title={"Cosmos SDK API " + apiNode()}
          >
            Cosmos SDK API
          </div>
        )}
      </div>
    </>
  );
};

export default SpStatusAPI;
