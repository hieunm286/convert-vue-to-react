import React, { useState } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { QueryDenomTrace } from "../../app/ibc.applications.transfer.v1/slice";
import { walletGetters } from "../../redux/modules/common/wallet/walletSlice";
import { str2rgba } from "../../utils/helpers";
import { Amount, ColoredAmount, DenomTraces } from "../../utils/interfaces";

export interface SpAmountSelectState {
  denomTraces: DenomTraces;
}

interface SpAssetsProp {
  balances?: Amount[];
}

const SpAssets: React.FC<SpAssetsProp> = (props) => {
  const [denomTraces, setDenomTraces] = useState<DenomTraces>();
  const reduxStore = useSelector((state: RootStateOrAny) => state);
  const dispatch = useDispatch();

  const address = (): string => {
    return reduxStore?.wallet?.selectedAddress;
  };

  const fullBalances = (): ColoredAmount[] => {
    return (
      props.balances?.map((x: Amount) => {
        addMapping(x);
        const y: ColoredAmount = { amount: "0", denom: "", color: "" };
        y.amount = x.amount;
        y.denom = x.denom;
        y.color = str2rgba(x.denom.toUpperCase());
        return x as ColoredAmount;
      }) ?? []
    );
  };

  const addMapping = async (balance: Amount): Promise<void> => {
    if (balance.denom.indexOf("ibc/") == 0) {
      const denom = balance.denom.split("/");
      const hash = denom[1];
      const newDenomTraces = { ...denomTraces } as any;
      newDenomTraces[hash] = await dispatch(
        QueryDenomTrace({
          options: { subscribe: false, all: false },
          params: { hash },
        })
      );
      setDenomTraces(newDenomTraces);
    }
  };

  return (
    <>
      <div className="sp-assets">
        <div className="sp-assets__header sp-component-title">
          <h3>Assets</h3>
        </div>
        <div className="sp-assets__main sp-box sp-shadow">
          {address() ? (
            <div className="sp-assets__main__header">
              <div className="sp-assets__main__header__token">TOKEN</div>
              <div className="sp-assets__main__header__amount">AMOUNT</div>
            </div>
          ) : (
            <div className="sp-assets__main__header">
              <div className="sp-assets__main__header__message">
                Your current account balance will appear here
              </div>
            </div>
          )}
          {!address() ||
            (fullBalances.length == 0 && (
              <>
                <div className="sp-assets__main__item">
                  <div className="sp-assets__main__denom__name">
                    <div
                      className="sp-denom-marker"
                      style={{ background: "#809cff" }}
                    />
                    <div className="sp-dummy-fill" />
                  </div>
                  <div className="sp-assets__main__denom__balance">
                    <div className="sp-dummy-fill" />
                  </div>
                </div>
                <div className="sp-assets__main__item">
                  <div className="sp-assets__main__denom__name">
                    <div
                      className="sp-denom-marker"
                      style={{ background: "#80d1ff" }}
                    />
                    <div className="sp-dummy-fill" />
                  </div>
                  <div className="sp-assets__main__denom__balance">
                    <div className="sp-dummy-fill" />
                  </div>
                </div>
                <div className="sp-assets__main__item">
                  <div className="sp-assets__main__denom__name">
                    <div
                      className="sp-denom-marker"
                      style={{ background: "#ffbd80 " }}
                    />
                    <div className="sp-dummy-fill" />
                  </div>
                  <div className="sp-assets__main__denom__balance">
                    <div className="sp-dummy-fill" />
                  </div>
                </div>
              </>
            ))}

          {fullBalances().map((balance, key) => (
            <div
              className="sp-assets__main__item"
              key={"denom_" + balance.denom}
            >
              <div className="sp-assets__main__denom__name">
                <div
                  className="sp-denom-marker"
                  style={{ background: `#${balance.color}` }}
                />
                {balance.denom.indexOf("ibc/") == 0 ? (
                  <>
                    IBC/
                    {denomTraces[
                      balance.denom.split("/")[1]
                    ]?.denom_trace.path.toUpperCase() ?? ""}
                    /
                    {denomTraces[
                      balance.denom.split("/")[1]
                    ]?.denom_trace.base_denom.toUpperCase() ?? "UNKNOWN"}
                  </>
                ) : (
                  <>{balance.denom.toUpperCase()}</>
                )}
              </div>
              <div className="sp-assets__main__denom__balance">
                {balance.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SpAssets;
