import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { sendMsgSend } from "../../app/cosmos.bank.v1beta1/slice";
import { store } from "../../app/store";
import { Amount, DenomTraces } from "../../utils/interfaces";

export interface TransferData {
  recipient: string;
  channel: string;
  amount: Array<Amount>;
  memo: string;
  fees: Array<Amount>;
}

export interface SpTokenSendState {
  transfer: TransferData;
  feesOpen: boolean;
  memoOpen: boolean;
  inFlight: boolean;
  bankAddress: string;
  staking: Record<string, unknown>;
  denomTraces: DenomTraces;
}

interface SpTokenSendProp {
  address?: string;
  refresh?: boolean;
}

const SpTokenSend: React.FC<SpTokenSendProp> = (props) => {
  const [transfer, setTransfer] = useState<TransferData>({
    recipient: "",
    channel: "",
    amount: [],
    memo: "",
    fees: [],
  });

  const [feesOpen, setFeesOpen] = useState<boolean>(false);
  const [memoOpen, setMemoOpen] = useState<boolean>(false);
  const [inFlight, setInFlight] = useState<boolean>(false);
  const [bankAddress, setBankAddress] = useState<boolean>(false);
  const [staking, setStaking] = useState<any>({});
  const [denomTraces, setDenomTraces] = useState<DenomTraces>({});

  const dispatch = useDispatch();

  const reduxStore = store.getState();

  const sendTransaction = async (): Promise<void> => {
    const value = {
        amount: '100',
        toAddress: 'cosmos1z0eqgx3z2k7wsnphua90zssr8cr7n692s9wftl',
        fromAddress: 'cosmos1s89hnz4ne00vuxa9trtmpsfl4s24npnu6na2ku',
    }
    try {
        const txResult = await (sendMsgSend({
            value,
            fee: ['0'],
            memo: '0',
        }, reduxStore)) as any;
        console.log(txResult);
        if (txResult && !txResult.code) {
            // this.resetTransaction()
            console.log('done');
        }
    } catch (e) {
        console.error(e)
    } finally {
    }
  }
//from: cosmos1s89hnz4ne00vuxa9trtmpsfl4s24npnu6na2ku
//to: cosmos1z0eqgx3z2k7wsnphua90zssr8cr7n692s9wftl
  return (
      <>
        <button onClick={sendTransaction}>Send</button>
      </>
  )
};

export default SpTokenSend;
