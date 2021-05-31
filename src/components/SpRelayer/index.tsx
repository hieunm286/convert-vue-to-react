import React, { useEffect, useState } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { useUIContext } from "../../layout/context";
import { relayersGetters } from "../../redux/modules/common/relayers/relayerSlice";
import { Relayer } from "../../utils/interfaces";
import * as RelayersActions from "../../redux/modules/common/relayers/relayerSlice";
import SpButton from "../SpButton";
import { envGetters } from "../../redux/modules/common/env/envSlice";
import { walletGetters } from "../../redux/modules/common/wallet/walletSlice";

interface SpRelayerProp {
  relayer: Relayer;
}

const SpRelayer: React.FC<SpRelayerProp> = ({ relayer }) => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);
  const dispatch = useDispatch();
  const { _depsLoaded, setDepsLoaded } = useUIContext();

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [extradots, setExtradots] = useState<string>("");

  useEffect(() => {
    if (!reduxStore?.wallet || !reduxStore.relayers) {
      setDepsLoaded(false);
    }
  }, [reduxStore?.wallet, reduxStore.relayers]);

  useEffect(() => {
    if (extradots == "......") {
      setExtradots("");
    }
  }, [extradots]);

  const loadingLog = (): string => {
    return relayersGetters.log(reduxStore.relayers) + extradots;
  };

  const linkRelayer = async (): Promise<void> => {
    setConnecting(true);
    const loading = setInterval(() => {
      // this.extradots = this.extradots + '.'
      setExtradots((extradots) => extradots + ".");
      if (extradots == "......") {
        setExtradots("");
      }
    }, 500);

    await dispatch(
      RelayersActions.linkRelayer({
        name: relayer.name,
      })
    );
    clearInterval(loading);
    setConnecting(false);
  };

  const startRelayer = async (): Promise<void> => {
    await dispatch(RelayersActions.runRelayer(relayer.name));
  };

  const stopRelayer = async (): Promise<void> => {
    await dispatch(RelayersActions.stopRelayer(relayer.name));
  };

  const homePrefix = (): string => {
    return envGetters.addrPrefix(reduxStore?.env);
  };
  const homeGasPrice = (): string => {
    return walletGetters.gasPrice(reduxStore?.wallet);
  };
  const homeEndpoint = (): string => {
    return envGetters.apiTendermint(reduxStore?.env);
  };
  const log = (): string => {
    return relayersGetters.log(reduxStore?.relayers);
  };

  return (
    <>
      {_depsLoaded && (
        <div className="sp-relayer">
          {connecting && <div className="sp-relayer__overlay" />}
          {connecting && (
            <div className="sp-relayer__modal sp-box">
              <div className="sp-relayer__modal__header">
                Setting up relayer
              </div>
              <div className="sp-icon sp-icon-Reload" />
              {loadingLog()}
            </div>
          )}

          <div className="sp-relayer__basic">
            <div className="sp-relayer__details">
              <div className="sp-relayer__name">{relayer.name}</div>
              <div className="sp-relayer__path">
                {relayer.chainIdA} &lt;-&gt; {relayer.chainIdB}
              </div>
              <div className="sp-relayer__status">
                {relayer.status.toUpperCase()}
              </div>
            </div>
            <div className="sp-relayer__actions">
              {relayer.status == "connected" && relayer.running && (
                <div className="sp-relayer__running">RUNNING</div>
              )}
              {relayer.status == "connected" && !relayer.running && (
                <div className="sp-relayer__stopped">STOPPED</div>
              )}
              {relayer.status != "connected" && (
                <div onClick={linkRelayer}>
                  <SpButton type="primary">Connect relayer</SpButton>
                </div>
              )}
              {relayer.status == "connected" && relayer.running && (
                <div onClick={stopRelayer}>
                  <SpButton type="primary"> Stop relayer</SpButton>
                </div>
              )}
              {relayer.status == "connected" && !relayer.running && (
                <div onClick={startRelayer}>
                  <SpButton type="primary"> Start relayer</SpButton>
                </div>
              )}
            </div>
          </div>
          <div className="sp-relayer__advanced">
            {relayer.status == "created" ? (
              <div className="sp-relayer__advanced__header">
                <div className="sp-relayer__advanced__header__message">
                  In order to complete this relayer setup you must fund the
                  address:
                  <strong>{relayer.targetAddress}</strong> at{" "}
                  <strong>{relayer.chainIdB}</strong>.<br />
                  When the address is funded, click the "Connect relayer"
                  button.
                </div>
              </div>
            ) : (
              <div className="sp-relayer__advanced__header">
                <div className="sp-relayer__advanced__header__title">
                  Advanced
                </div>
                <div className="sp-line"></div>
                <div
                  className="sp-relayer__advanced__header__icon"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <div
                    className={`sp-icon ${
                      showAdvanced ? "sp-icon-UpCaret" : "sp-icon-DownCaret"
                    }`}
                  />
                </div>
              </div>
            )}
            {relayer.status != "created" && showAdvanced && (
              <div className="sp-relayer__advanced__contents">
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain A ID
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.chainIdA || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain A Endpoint
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {homeEndpoint() || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain A Prefix
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {homePrefix() || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain A Gas Price
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {homeGasPrice() || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain B ID
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.chainIdB || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain B Endpoint
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.endpoint || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain B Prefix
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.prefix || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain B Gas Price
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.gasPrice || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain A ClientID
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.endA?.clientID || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain A ConnectionID
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.endA?.connectionID || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain A PortID
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.src?.portId || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain A ChannelID
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.src?.channelId || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain B ClientID
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.endB?.clientID || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain B ConnectionID
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.endB?.connectionID || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain B PortID
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.dest?.portId || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain B ChannelID
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.dest?.channelId || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain A Packet Height
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.heights?.packetHeightA || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain A Ack Height
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.heights?.ackHeightA || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain B Packet Height
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.heights?.packetHeightB || "-"}
                  </div>
                </div>
                <div className="sp-relayer__advanced__contents__item">
                  <div className="sp-relayer__advanced__contents__item__key">
                    Chain B Ack Height
                  </div>
                  <div className="sp-relayer__advanced__contents__item__value">
                    {relayer.heights?.ackHeightB || "-"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SpRelayer;
