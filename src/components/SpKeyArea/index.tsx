import React, { useState } from "react";

interface SpKeyAreaProp {
  value?: string;
}

const SpKeyArea: React.FC<SpKeyAreaProp> = ({ value }) => {
  const [rawContent, setRawContent] = useState(value);
  const [delayTimer, setDelayTimer] = useState(null);

  const validateInput = (e: HTMLElement): void => {
    setRawContent(e.innerText);
  };

  const keyUp = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === " " || e.key === "Spacebar") {
      validateInput(e.target as HTMLElement);
    }
  };

  const blur = (e: React.FocusEvent<HTMLDivElement>): void => {
    validateInput(e.target as HTMLElement);
  };

  const paste = (event: React.ClipboardEvent<HTMLDivElement>): void => {
    validateInput(event.target as HTMLElement);
  };
  const del = (event: KeyboardEvent): void => {
    validateInput(event.target as HTMLElement);
  };

  return (
    <>
      <div
        contentEditable
        onKeyUp={keyUp}
        onBlur={blur}
        onPaste={paste}
        // v-on:blur="blur"
        // v-on:paste="paste"
        // v-on:delete="del"
      ></div>
    </>
  );
};

interface SpKeyAreaProp {}

export default SpKeyArea;
