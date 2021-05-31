import React, { useEffect } from "react";
import { RootStateOrAny, useSelector } from "react-redux";
import { useUIContext } from "../../layout/context";
import { Block } from "../../utils/interfaces";

const SpBlockHeight = () => {
  const { _depsLoaded, setDepsLoaded } = useUIContext();
  const reduxStore = useSelector((state: RootStateOrAny) => state);

  useEffect(() => {
    if (!reduxStore?.blocks) {
      setDepsLoaded(false);
    }
  }, [reduxStore?.blocks]);

  const blocks = (): Block[] => {
    if (_depsLoaded) {
      return reduxStore.blocks;
    } else {
      return [];
    }
  };

  const blockHeight = (): number | "N/A" => {
    const block = blocks();
    if (block.length > 0) {
      return block[0].height;
    } else {
      return "N/A";
    }
  };

  return (
    <>
      {_depsLoaded && (
        <div className="SpBlockHeight">
          Block Height: <strong>{blockHeight()}</strong>
        </div>
      )}
    </>
  );
};

export default SpBlockHeight;
