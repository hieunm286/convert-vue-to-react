import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { QueryDenomTrace } from "../../app/ibc.applications.transfer.v1/slice";
import { str2rgba } from "../../utils/helpers";
import { Amount, ColoredAmount, DenomTraces } from "../../utils/interfaces";

export interface SpAmountSelectProp {
  modelValue?: Amount;
  available?: Amount[];
  index?: number;
  selected?: string[];
  last?: boolean;
}

const SpAmountSelect: React.FC<SpAmountSelectProp> = (props) => {
  const [amount, setAmount] = useState<string>("");
  const [denom, setDenomState] = useState<string | null>(null);
  const [focused, setFocused] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [denomTraces, setDenomTraces] = useState<DenomTraces>({});

  const dispatch = useDispatch();

  useEffect(() => {
    setAmount(props.modelValue?.amount + "" ?? "");
    setDenomState(props.modelValue?.denom ?? null);
  }, [props.modelValue]);

  useEffect(() => {
    const { amount, denom }: Amount = currentVal();
    setAmount(amount);
    setDenomState(denom);
  }, [amount, denom]);

  const addMapping = async (balance: Amount): Promise<void> => {
    if (balance.denom.indexOf("ibc/") == 0) {
      const denom = balance.denom.split("/");
      const hash = denom[1];
      const newDenomTraces = { ...denomTraces } as any
      newDenomTraces[hash] = await dispatch(QueryDenomTrace({
        options: { subscribe: false, all: false },
        params: { hash },
    }))
      setDenomTraces(newDenomTraces);
    }
  };

  const setDenom = (avail: Amount): void => {
    if (enabledDenoms().findIndex((x) => x == avail) != -1) {
      setDenomState(avail.denom);
      setModalOpen(false);
    }
  };

  const parseAmount = (amount: string): number => {
    return amount == "" ? 0 : parseInt(amount);
  };

  const enabledDenoms = (): Amount[] => {
    return (
      props.available?.filter(
        (x) =>
          props.selected?.findIndex((y) => y == x.denom) == -1 ||
          props.selected?.findIndex((y) => y == x.denom) == props.index
      ) ?? []
    );
  };

  const denoms = (): ColoredAmount[] => {
    return (
      props.available?.map((x: Amount) => {
        addMapping(x);
        const y: ColoredAmount = { amount: "0", denom: "", color: "" };
        y.amount = x.amount;
        y.denom = x.denom;
        y.color = str2rgba(x.denom.toUpperCase());
        return x as ColoredAmount;
      }) ?? []
    );
  };

  const filteredDenoms = (): ColoredAmount[] => {
    return searchTerm == ""
      ? denoms()
      : denoms().filter(
          (x) => x.denom.toUpperCase().indexOf(searchTerm.toUpperCase()) !== -1
        );
  };

  const fulldenom = (): ColoredAmount => {
    const denomsArr = denoms();
    return (
      denomsArr.find((x: ColoredAmount) => x.denom == denom) ?? {
        amount: "",
        denom: "",
        color: "",
      }
    );
  };

  const currentVal = useCallback((): Amount => {
    return { amount: amount, denom: denom ?? "" };
  }, [amount, denom]);

  const toggleModal = (): void => {
    setModalOpen(!modalOpen);
  };

  const hideModal = (): void => {
    setModalOpen(false);
  };

  const handleChangeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  return (
    <>
      <div className="sp-amount-select">
        {modalOpen && (
          <div className="sp-amount-select__overlay" onClick={hideModal}></div>
        )}
        <div
          className={`sp-form-group" ${
            modalOpen ? "sp-amount-select__overlay__open" : ""
          }`}
        >
          <div className={`sp-amount-select__denom ${focused && "sp-focused"}`}>
            <div
              className="sp-amount-select__denom__selected"
              onClick={toggleModal}
            >
              <div className="sp-amount-select__denom__name">
                <div
                  className={`sp-amount-select__denom__balance ${
                    parseAmount(fulldenom().amount) - parseAmount(amount) < 0 &&
                    "sp-amount-select__denom__balance__fail"
                  }`}
                >
                  <strong>Avail.</strong>
                  {parseAmount(fulldenom().amount) - parseAmount(amount)}/
                  {fulldenom().amount}
                </div>
                <div
                  className="sp-denom-marker"
                  style={{ background: `#${fulldenom().color}` }}
                />
                {fulldenom().denom.indexOf("ibc/") == 0 ? (
                  <>
                    IBC/
                    {denomTraces[
                      fulldenom().denom.split("/")[1]
                    ]?.denom_trace.path.toUpperCase() ?? ""}
                    /
                    {denomTraces[
                      fulldenom().denom.split("/")[1]
                    ]?.denom_trace.base_denom.toUpperCase() ?? "UNKNOWN"}
                  </>
                ) : (
                  <>{fulldenom().denom.toUpperCase()}</>
                )}
              </div>
              <div className="sp-amount-select__denom__controls">
                {modalOpen && !props.last && (
                  <div className="sp-amount-select__denom__remove">Remove</div>
                )}

                <span
                  className={`
								${!modalOpen ? "sp-icon sp-icon-DownCaret" : "sp-icon sp-icon-UpCaret"}
							`}
                />
              </div>
            </div>
            {modalOpen && (
              <div className="sp-amount-select__denom__modal">
                <div className="sp-amount-select__denom__modal__search">
                  <div className="sp-icon sp-icon-Search" />
                  <input
                    type="text"
                    v-model="searchTerm"
                    placeholder="Search..."
                    className="sp-amount-select__denom__modal__search__input"
                  />
                </div>
                <div className="sp-line"></div>
                <div className="sp-amount-select__denom__modal__header">
                  <div className="sp-amount-select__denom__modal__header__token">
                    TOKEN
                  </div>
                  <div className="sp-amount-select__denom__modal__header__amount">
                    AMOUNT
                  </div>
                </div>
                {filteredDenoms().map((avail, key) => (
                  <div
                    className={`sp-amount-select__denom__modal__item ${
                      avail.denom == fulldenom().denom &&
                      "sp-amount-select__denom__modal__item__selected"
                    } ${
                      enabledDenoms().findIndex((x) => x == avail) == -1 &&
                      "sp-amount-select__denom__modal__item__disabled"
                    }`}
                    onClick={() => setDenom(avail)}
                    key={"denom_" + avail.denom}
                  >
                    <div className="sp-amount-select__denom__name">
                      <div
                        className="sp-denom-marker"
                        style={{ background: `#${avail.color}` }}
                      />
                      {avail.denom.indexOf("ibc/") == 0 ? (
                        <>
                          IBC/
                          {denomTraces[
                            avail.denom.split("/")[1]
                          ]?.denom_trace.path.toUpperCase() ?? ""}
                          /
                          {denomTraces[
                            avail.denom.split("/")[1]
                          ]?.denom_trace.base_denom.toUpperCase() ?? "UNKNOWN"}
                        </>
                      ) : (
                        <>{avail.denom.toUpperCase()}</>
                      )}
                    </div>
                    <div className="sp-amount-select__denom__balance">
                      {avail.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            className={`sp-input sp-input-large ${
              fulldenom().amount != "" &&
              parseAmount(fulldenom().amount) - parseAmount(amount) < 0 &&
              "sp-error"
            }`}
            name="rcpt"
            v-model="amount"
            value={amount}
            onChange={handleChangeAmount}
            placeholder="0"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
      </div>
    </>
  );
};

export default SpAmountSelect;
