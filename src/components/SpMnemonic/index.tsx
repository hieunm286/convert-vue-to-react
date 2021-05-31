import React from "react";
import { copyToClipboard } from "../../utils/helpers";
import SpLinkIcon from "../SpLinkIcon";

const SpMnemonic: React.FC<{ mnemonic: string }> = ({ mnemonic }) => {
  const words = (): string[] => {
    return mnemonic.split(" ");
  };

  const firstHalfWords = (): string[] => {
    const w = words();
    return w.slice(0, w.length / 2);
  };

  const secondHalfWords = (): string[] => {
    const w = words();
    return w.slice(w.length / 2);
  };

  const copyMnemonic = (): void => {
    copyToClipboard(mnemonic);
  };

  return (
    <>
      <div className="sp-mnemonic">
        <ul className="sp-mnemonic__list">
          {firstHalfWords().map((word, index) => (
            <li className="sp-mnemonic__list__item" key={word + index + "1"}>
              <span>{index + 1}</span> {word}
            </li>
          ))}
        </ul>
        <ul className="sp-mnemonic__list">
          {secondHalfWords().map((word, index) => {
            <li className="sp-mnemonic__list__item" key={word + index + "1"}>
              <span>{index + 1 + firstHalfWords().length}</span> {word}
            </li>;
          })}
        </ul>
        <div className="sp-mnemonic__copy">
          <div onClick={copyMnemonic}>
            <SpLinkIcon icon="Copy" text="Copy phrase" />
          </div>
        </div>
      </div>
    </>
  );
};

export default SpMnemonic;
