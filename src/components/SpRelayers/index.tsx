import React, { useEffect, useState } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { useUIContext } from "../../layout/context";
import { Relayer } from "../../utils/interfaces";
import * as RelayersActions from "../../redux/modules/common/relayers/relayerSlice";
import SpRelayer from "../SpRelayer";
import SpButton from "../SpButton";

export interface RelayerForm {
  name: string;
  endpoint: string;
  gasPrice: string;
  external: boolean;
  chainId: string;
  channelId: string;
  prefix: string;
}

const SpRelayers = () => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);
  const dispatch = useDispatch();
  const { _depsLoaded, setDepsLoaded } = useUIContext();
  const [showRelayerForm, setShowRelayerForm] = useState<boolean>(false);
  const [relayerForm, setRelayerForm] = useState<RelayerForm>({
    name: "",
    endpoint: "",
    prefix: "",
    gasPrice: "",
    external: false,
    chainId: "",
    channelId: "",
  });

  useEffect(() => {
    if (!reduxStore?.wallet || !reduxStore.relayers) {
      setDepsLoaded(false);
    }
  }, [reduxStore?.wallet, reduxStore.relayers]);

  const address = (): string => {
    return reduxStore?.wallet?.selectedAddress;
  };

  const relayers = (): Relayer[] => {
    return reduxStore?.relayers?.relayers || [];
  };

  const hasHubRelayer = (): boolean => {
    return relayers().findIndex((x) => x.chainIdB == "cosmoshub-4") > -1;
  };

  const addRelayer = async (): Promise<void> => {
    dispatch(RelayersActions.createRelayer(relayerForm));
    setRelayerForm({
      name: "",
      chainId: "",
      channelId: "",
      external: false,
      endpoint: "",
      prefix: "",
      gasPrice: "",
    });
  };

  const addHubRelayer = async (): Promise<void> => {
    dispatch(
      RelayersActions.createRelayer({
        name: "CosmosHub",
        endpoint: "https://rpc.nylira.net",
        prefix: "cosmos",
        gasPrice: "0.025uatom",
        chainId: undefined,
        channelId: undefined,
        external: undefined,
      })
    );
    setRelayerForm({
      name: "",
      chainId: "",
      channelId: "",
      external: false,
      endpoint: "",
      prefix: "",
      gasPrice: "",
    });
  };

  const handleExternalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRelayerForm({ ...relayerForm, external: e.target.checked });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    prop: string
  ) => {
    setRelayerForm({ ...relayerForm, [prop]: e.target.value });
  };

  return (
    <>
      {_depsLoaded && (
        <div>
          <div className="sp-relayers__holder">
            <div className="sp-component sp-relayers">
              <div className="sp-relayers__header sp-component-title">
                <h3>Relayer list</h3>
                <span>|</span>
                <span>Your configured relayers</span>
              </div>
              <div className="sp-relayers__main sp-box sp-shadow">
                {!address() && (
                  <div className="sp-relayers__main__message">
                    Your configured relayers will appear here.
                  </div>
                )}
                {!address() && (
                  <div className="sp-relayer sp-relayer__dummy">
                    <div className="sp-relayer__basic">
                      <div className="sp-relayer__details">
                        <div className="sp-relayer__name">
                          <div className="sp-dummy-fill" />
                        </div>
                        <div className="sp-relayer__path">
                          <div className="sp-dummy-fill" />
                        </div>
                        <div className="sp-relayer__status">
                          <div className="sp-dummy-fill" />
                        </div>
                      </div>
                      <div className="sp-relayer__actions">
                        <div className="sp-dummy-fill" />
                      </div>
                    </div>
                  </div>
                )}
                {address() && relayers().length == 0 && (
                  <div className="sp-relayers__main__message">
                    You have no relayers configured on this address.
                  </div>
                )}
                {relayers().map((relayer, index) => (
                  <div key={relayer.name}>
                    <div className="sp-line" v-if="index > 0" />
                    <SpRelayer relayer={relayer} />
                  </div>
                ))}
              </div>
            </div>
            <div className="sp-component sp-relayers__add">
              <div className="sp-assets__header sp-component-title">
                <h3>Add a relayer</h3>
              </div>
              {!address() ? (
                <>
                  <div className="sp-relayers__add__main sp-box sp-shadow">
                    <div className="sp-relayers__add__main__message">
                      Add or unlock a wallet to create a relayer.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {!showRelayerForm && !hasHubRelayer() && (
                    <div onClick={addHubRelayer}>
                      <SpButton type="primary">Connect to Cosmos Hub</SpButton>
                    </div>
                  )}
                  {!showRelayerForm && !hasHubRelayer() && (
                    <div className="sp-relayers__add__or">- or -</div>
                  )}
                  {!showRelayerForm && !hasHubRelayer() && (
                    <SpButton type="primary">Add custom relayer</SpButton>
                  )}
                  {showRelayerForm ||
                    (hasHubRelayer() && (
                      <div className="sp-relayers__add__main sp-box sp-shadow">
                        <form className="sp-relayers__add__form">
                          <div className="sp-form-group">
                            External
                            <input
                              type="checkbox"
                              checked={relayerForm.external}
                              onChange={handleExternalChange}
                            />
                          </div>
                          {relayerForm.external ? (
                            <>
                              <div className="sp-form-group">
                                <input
                                  className="sp-input"
                                  value={relayerForm.name}
                                  onChange={(e) => handleInputChange(e, "name")}
                                  placeholder="Name (e.g. Foochain)"
                                />
                              </div>
                              <div className="sp-form-group">
                                <input
                                  className="sp-input"
                                  value={relayerForm.chainId}
                                  onChange={(e) =>
                                    handleInputChange(e, "chainId")
                                  }
                                  placeholder="Chain ID (e.g. foochain-2)"
                                />
                              </div>
                              <div className="sp-form-group">
                                <input
                                  className="sp-input"
                                  value={relayerForm.channelId}
                                  onChange={(e) =>
                                    handleInputChange(e, "channelId")
                                  }
                                  placeholder="Channel (e.g. channel-0)"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="sp-form-group">
                                <input
                                  className="sp-input"
                                  value={relayerForm.name}
                                  onChange={(e) => handleInputChange(e, "name")}
                                  placeholder="Name (e.g. Foochain)"
                                />
                              </div>
                              <div className="sp-form-group">
                                <input
                                  className="sp-input"
                                  value={relayerForm.endpoint}
                                  onChange={(e) =>
                                    handleInputChange(e, "endpoint")
                                  }
                                  placeholder="Endpoint (e.g. https://rpc.foochain.org)"
                                />
                              </div>
                              <div className="sp-form-group">
                                <input
                                  className="sp-input"
                                  value={relayerForm.prefix}
                                  onChange={(e) =>
                                    handleInputChange(e, "prefix")
                                  }
                                  placeholder="Prefix (e.g. foo)"
                                />
                              </div>
                              <div className="sp-form-group">
                                <input
                                  className="sp-input"
                                  value={relayerForm.gasPrice}
                                  onChange={(e) =>
                                    handleInputChange(e, "gasPrice")
                                  }
                                  placeholder="Gas Price (e.g. 0.025ufoo)"
                                />
                              </div>
                            </>
                          )}

                          <div className="sp-relayers__add__btns">
                            {!hasHubRelayer && (
                              <div onClick={() => setShowRelayerForm(false)}>
                                <SpButton type="secondary">Cancel</SpButton>
                              </div>
                            )}
                            <div onClick={addRelayer}>
                              <SpButton type="primary">Add Relayer</SpButton>
                            </div>
                          </div>
                        </form>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SpRelayers;
