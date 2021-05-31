import React from "react";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

interface SpBlockDisplayLineProp {
  block?: any;
  tsFormat?: string;
}

const SpBlockDisplayLine: React.FC<SpBlockDisplayLineProp> = ({
  block,
  tsFormat,
}) => {
  const formatTS = (timestamp) => {
    const momentTime = dayjs(timestamp);
    return momentTime.format(tsFormat);
  };
  return (
    <>
      <tr className="SpBlockDisplayLine">
        <td className="blockHeight">
          <Link to={"/block/" + block?.height}>{block.height} </Link>
        </td>
        <td className="blockHash">{block?.hash}</td>
        <td className="blockTime">{formatTS(block?.timestamp)}</td>
        <td className="blockTxs">{block?.details?.num_txs}</td>
      </tr>
    </>
  );
};

export default SpBlockDisplayLine;
