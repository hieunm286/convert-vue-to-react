import React from 'react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

interface SpBlockDisplaySmallProp {
    block?: any;
    tsFormat?: string;
  }
  
const SpBlockDisplaySmall: React.FC<SpBlockDisplaySmallProp> = ({
    block,
    tsFormat,
  }) => {
    const formatTS = (timestamp) => {
        const momentTime = dayjs(timestamp);
        return momentTime.format(tsFormat);
      };

    return (
        <>
            <Link className="SpBlockDisplaySmall" to={"/block/" + block.height}>
		<div className="SpBlockDisplaySmallHeight">
			{ block?.height }
		</div>
		<div className="SpBlockDisplaySmallHash">
			{ block?.hash }
		</div>
		<div className="SpBlockDisplaySmallTime">
			{ formatTS(block?.timestamp) }
		</div>
		<div className="SpBlockDisplaySmallTxs">No of Txs: { block?.details?.data?.txs?.length }</div>
	</Link>
        </>
    );
};

export default SpBlockDisplaySmall;