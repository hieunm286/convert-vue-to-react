import React, { useEffect, useState } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { useUIContext } from "../../layout/context";
import { transferGetters } from "../../redux/modules/common/transfers/transferSlice";
import { Amount, Transaction, TxDecodedPacket } from "../../utils/interfaces";
import * as TransferActions from "../../redux/modules/common/transfers/transferSlice";
import dayjs from "dayjs";
import { decode } from "js-base64";
import { relayersGetters } from "../../redux/modules/common/relayers/relayerSlice";

interface SpTransferListProps {
  address?: string;
  refresh?: boolean;
}

const SpTransferList: React.FC<SpTransferListProps> = ({
  address,
  refresh,
}) => {
  const reduxStore = useSelector((state: RootStateOrAny) => state);
  const dispatch = useDispatch();
  const { _depsLoaded, setDepsLoaded } = useUIContext();
  const [bankAddress, setBankAddress] = useState<string>("");

  useEffect(() => {
    if (!reduxStore?.transfers) {
      setDepsLoaded(false);
    }
  }, [reduxStore?.transfers]);

  useEffect(() => {
    if (_depsLoaded) {
      setBankAddress(address);
      if (address != "") {
        dispatch(
          TransferActions.ServiceGetTxsEvent({
            subscribe: true,
            event: "transfer.sender%3D%27" + address + "%27",
          })
        );
        dispatch(
          TransferActions.ServiceGetTxsEvent({
            subscribe: true,
            event: "transfer.recipient%3D%27" + address + "%27",
          })
        );
      }
    }
  }, [address, _depsLoaded, dispatch]);

  const sentTransactions = (): Transaction => {
    return transferGetters.getGetTxsEvent(reduxStore?.transfers, {
      event: "transfer.sender%3D%27" + bankAddress + "%27",
    });
  };

  const receivedTransactions = (): Transaction => {
    return transferGetters.getGetTxsEvent(reduxStore?.transfers, {
      event: "transfer.recipient%3D%27" + bankAddress + "%27",
    });
  };

  const transactions = (): Transaction[] => {
    const sent: Array<Transaction> =
      sentTransactions().txs?.map((tx: Transaction, index: number) => {
        tx.response = sentTransactions().tx_responses[index];
        return tx;
      }) ?? [];
    const received: Array<Transaction> =
      receivedTransactions().txs?.map((tx: Transaction, index: number) => {
        tx.response = receivedTransactions().tx_responses[index];
        return tx;
      }) ?? [];
    return [...sent, ...received].sort(
      (a: Transaction, b: Transaction) => b.response.height - a.response.height
    );
  };

  const created = async (): Promise<void> => {
    if (_depsLoaded) {
      const addr = address ?? "";
      setBankAddress(addr);
      if (addr != "") {
        await dispatch(
          TransferActions.ServiceGetTxsEvent({
            subscribe: true,
            event: "transfer.sender%3D%27" + addr + "%27",
          })
        );
        await dispatch(
          TransferActions.ServiceGetTxsEvent({
            subscribe: true,
            event: "transfer.recipient%3D%27" + addr + "%27",
          })
        );
      }
    }
  };

  const getAmounts = (tx: Transaction): Amount[] => {
    return tx.body.messages[0]?.amount ?? [];
  };

  const getFmtTime = (time: string | undefined): string => {
    const momentTime = dayjs(time);
    return momentTime.format("D MMM, YYYY");
  };

  const getDecoded = (packet: string): TxDecodedPacket => {
    try {
      return JSON.parse(decode(packet));
    } catch (e) {
      return {};
    }
  };

  const getTxText = (tx: Transaction): string => {
    let text = "";
    if (tx.response.code != 0) {
      text = "(Failed) ";
    }
    if (tx?.body.messages.length > 1) {
      text = text + "Multiple messages";
    } else {
      if (
        tx.body.messages[0]["@type"] == "/cosmos.bank.v1beta1.MsgSend" ||
        tx.body.messages[0]["@type"] ==
          "/ibc.applications.transfer.v1.MsgTransfer"
      ) {
        if (tx.body.messages[0].from_address == bankAddress) {
          text = text + "Sent to";
        }
        if (tx.body.messages[0].to_address == bankAddress) {
          text = text + "Received from";
        }
        if (tx.body.messages[0].sender == bankAddress) {
          text = text + "IBC Sent to";
        }
      } else {
        let packet: TxDecodedPacket = { sender: "", receiver: "" };
        switch (tx.body.messages[0]["@type"]) {
          case "/ibc.core.channel.v1.MsgChannelOpenAck":
            text = text + "IBC Channel Open Ack";
            break;
          case "/ibc.core.channel.v1.MsgChannelOpenConfirm":
            text = text + "IBC Channel Open Confirm";
            break;
          case "/ibc.core.channel.v1.MsgChannelOpenTry":
            text = text + "IBC Channel Open Try";
            break;
          case "/ibc.core.channel.v1.MsgRecvPacket":
            packet = getDecoded(tx.body.messages[0].packet?.data ?? "");

            if (packet.receiver == bankAddress) {
              text = text + "IBC Received from";
            } else {
              text = text + "IBC Recv Packet";
            }

            break;
          case "/ibc.core.channel.v1.MsgAcknowledgement":
            text = text + "IBC Ack Packet";
            break;
          case "/ibc.core.channel.v1.MsgTimeout":
            text = text + "IBC Timeout Packet";
            break;
          case "/ibc.core.channel.v1.MsgChannelOpenInit":
            text = text + "IBC Channel Open Init";
            break;
          case "/ibc.core.client.v1.MsgCreateClient":
            text = text + "IBC Client Create";
            break;
          case "/ibc.core.client.v1.MsgUpdateClient":
            text = text + "IBC Client Update";
            break;
          case "/ibc.core.connection.v1.MsgConnectionOpenAck":
            text = text + "IBC Connection Open Ack";
            break;
          case "/ibc.core.connection.v1.MsgConnectionOpenInit":
            text = text + "IBC Connection Open Init";
            break;
          case "/ibc.core.connection.v1.MsgConnectionOpenConfirm":
            text = text + "IBC Connection Open Confirm";
            break;
          case "/ibc.core.connection.v1.MsgConnectionOpenTry":
            text = text + "IBC Connection Open Try";
            break;
          default:
            text = text + "Message";
            break;
        }
      }
    }
    return text;
  };

  const getTxDetails = (tx: Transaction): string => {
    let text = "";
    if (tx.body.messages.length > 1) {
      text = text + "-";
    } else {
      if (
        tx.body.messages[0]["@type"] == "/cosmos.bank.v1beta1.MsgSend" ||
        tx.body.messages[0]["@type"] ==
          "/ibc.applications.transfer.v1.MsgTransfer"
      ) {
        if (tx.body.messages[0].from_address == bankAddress) {
          text = text + tx.body.messages[0].to_address;
        }
        if (tx.body.messages[0].to_address == bankAddress) {
          text = text + tx.body.messages[0].from_address;
        }
        if (tx.body.messages[0].sender == bankAddress) {
          const chain = relayersGetters.chainFromChannel(
            reduxStore?.relayers,
            tx.body.messages[0].source_channel
          );
          text = text + chain + ":" + tx.body.messages[0].receiver;
        }
        if (tx.body.messages[0].receiver == bankAddress) {
          const chain = relayersGetters.chainToChannel(
            reduxStore?.relayers,
            tx.body.messages[0].source_channel
          );
          text = text + chain + ":" + tx.body.messages[0].receiver;
        }
      } else {
        let packet;
        switch (tx.body.messages[0]["@type"]) {
          case "/ibc.core.channel.v1.MsgChannelOpenAck":
            text =
              text +
              tx.body.messages[0].port_id +
              " / " +
              tx.body.messages[0].channel_id;
            break;
          case "/ibc.core.channel.v1.MsgChannelOpenConfirm":
            text =
              text +
              tx.body.messages[0].port_id +
              " / " +
              tx.body.messages[0].channel_id;
            break;
          case "/ibc.core.channel.v1.MsgChannelOpenTry":
            text =
              text +
              tx.body.messages[0].port_id +
              " / " +
              tx.body.messages[0].previous_channel_id +
              " / " +
              tx.body.messages[0].counterparty_version;
            break;
          case "/ibc.core.channel.v1.MsgRecvPacket":
            packet = getDecoded(tx.body.messages[0].packet?.data ?? "");
            if (packet.sender == bankAddress) {
              text = text + "IBC:" + packet.receiver;
            } else {
              if (packet.receiver == bankAddress) {
                text = text + "IBC:" + packet.sender;
              } else {
                text = text + "IBC Recv Packet";
              }
            }
            break;
          case "/ibc.core.channel.v1.MsgAcknowledgement":
            text =
              text +
              tx.body.messages[0].packet?.source_port +
              ":" +
              tx.body.messages[0].packet?.source_channel +
              " <-> " +
              tx.body.messages[0].packet?.destination_port +
              ":" +
              tx.body.messages[0].packet?.destination_channel;
            break;
          case "/ibc.core.channel.v1.MsgTimeout":
            text = text + "IBC Timeout Packet";
            break;
          case "/ibc.core.channel.v1.MsgChannelOpenInit":
            text = text + tx.body.messages[0].port_id;
            break;
          case "/ibc.core.client.v1.MsgCreateClient":
            text = text + tx.body.messages[0].signer;
            break;
          case "/ibc.core.client.v1.MsgUpdateClient":
            text = text + tx.body.messages[0].client_id;
            break;
          case "/ibc.core.connection.v1.MsgConnectionOpenAck":
            text =
              text +
              tx.body.messages[0].connection_id +
              " / " +
              tx.body.messages[0].counterparty_connection_id;
            break;
          case "/ibc.core.connection.v1.MsgConnectionOpenInit":
            text = text + tx.body.messages[0].client_id;
            break;
          case "/ibc.core.connection.v1.MsgConnectionOpenConfirm":
            text = text + tx.body.messages[0].connection_id;
            break;
          case "/ibc.core.connection.v1.MsgConnectionOpenTry":
            text =
              text +
              tx.body.messages[0].client_id +
              " / " +
              tx.body.messages[0].previous_connection_id;
            break;
          default:
            text = text + "Message";
            break;
        }
      }
    }
    return text;
  };

  return (
    <>
      {_depsLoaded && (
        <div className="sp-component sp-transfer-list">
          <div className="sp-transfer-list__header sp-component-title">
            <h3>Transactions</h3>
            <span>|</span>
            <span>A list of your recent transactions</span>
          </div>
          {address && transactions().length > 0 ? (
            <table className="sp-transfer-list__table sp-box sp-shadow">
              <thead>
                <tr>
                  <th className="sp-transfer-list__status">STATUS</th>
                  <th className="sp-transfer-list__table__address">
                    ADDRESS / DETAILS
                  </th>
                  <th className="sp-transfer-list__table__amount">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {transactions().map((tx, index) => (
                  <tr key={tx.response.hash}>
                    <td className="sp-transfer-list__status">
                      <div className="sp-transfer-list__status__wrapper">
                        <div
                          className={`sp-transfer-list__status__icon ${
                            tx.response.code != 0 &&
                            "sp-transfer-list__status__icon__failed"
                          } ${
                            tx.response.code == 0 &&
                            (tx.body.messages[0].from_address == bankAddress ||
                              tx.body.messages[0].sender == bankAddress) &&
                            "sp-transfer-list__status__icon__sent"
                          } ${
                            tx.response.code == 0 &&
                            (tx.body.messages[0].to_address == bankAddress ||
                              (tx.body.messages[0]["@type"] ==
                                "/ibc.core.channel.v1.MsgRecvPacket" &&
                                getDecoded(
                                  tx.body.messages[0].packet?.data ?? ""
                                )?.receiver == bankAddress)) &&
                            "sp-transfer-list__status__icon__received"
                          } ${
                            tx.response.code == 0 &&
                            tx.body.messages[0].to_address != bankAddress &&
                            tx.body.messages[0].from_address != bankAddress &&
                            tx.body.messages[0].sender != bankAddress &&
                            !(
                              tx.body.messages[0]["@type"] ==
                                "/ibc.core.channel.v1.MsgRecvPacket" &&
                              getDecoded(tx.body.messages[0].packet?.data ?? "")
                                ?.receiver == bankAddress
                            ) &&
                            "sp-transfer-list__status__icon__success"
                          }`}
                        >
                          <span
                            className={`sp-icon ${
                              tx.response.code != 0 && "sp-icon-Close"
                            } ${
                              tx.response.code == 0 &&
                              (tx.body.messages[0].from_address ==
                                bankAddress ||
                                tx.body.messages[0].sender == bankAddress) &&
                              "sp-icon-UpArrow"
                            } ${
                              tx.response.code == 0 &&
                              (tx.body.messages[0].to_address == bankAddress ||
                                (tx.body.messages[0]["@type"] ==
                                  "/ibc.core.channel.v1.MsgRecvPacket" &&
                                  getDecoded(
                                    tx.body.messages[0].packet?.data ?? ""
                                  )?.receiver == bankAddress)) &&
                              "sp-icon-DownArrow"
                            } ${
                              tx.response.code == 0 &&
                              tx.body.messages[0].to_address != bankAddress &&
                              tx.body.messages[0].from_address != bankAddress &&
                              tx.body.messages[0].sender != bankAddress &&
                              !(
                                tx.body.messages[0]["@type"] ==
                                  "/ibc.core.channel.v1.MsgRecvPacket" &&
                                getDecoded(
                                  tx.body.messages[0].packet?.data ?? ""
                                )?.receiver == bankAddress
                              ) &&
                              "sp-icon-Docs"
                            }`}
                          />
                        </div>
                        <div className="sp-transfer-list__status__action">
                          <div className="sp-transfer-list__status__action__text">
                            {getTxText(tx)}
                          </div>
                          <div className="sp-transfer-list__status__action__date">
                            {getFmtTime(tx.response.timestamp)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="sp-transfer-list__table__address">
                      {getTxDetails(tx)}
                    </td>
                    {tx.body.messages[0]["@type"] ==
                    "/cosmos.bank.v1beta1.MsgSend" ? (
                      <td
                        className="sp-transfer-list__table__amount"
                        v-if="tx.body.messages[0]['@type'] == '/cosmos.bank.v1beta1.MsgSend'"
                      >
                        {getAmounts(tx).map((token, index) => (
                          <div key={"am" + index}>
                            {tx.body.messages[0].from_address == bankAddress
                              ? "-" +
                                token.amount +
                                " " +
                                token.denom.toUpperCase()
                              : "+" +
                                token.amount +
                                " " +
                                token.denom.toUpperCase()}
                          </div>
                        ))}
                      </td>
                    ) : tx.body.messages[0]["@type"] ==
                      "/ibc.applications.transfer.v1.MsgTransfer" ? (
                      <td className="sp-transfer-list__table__amount">
                        <div>
                          {tx.body.messages[0].sender == bankAddress
                            ? "-" +
                              tx.body.messages[0].token?.amount +
                              " " +
                              tx.body.messages[0].token?.denom.toUpperCase()
                            : "+" +
                              tx.body.messages[0].token?.amount +
                              " " +
                              tx.body.messages[0].token?.denom.toUpperCase()}
                        </div>
                      </td>
                    ) : tx.body.messages[0]["@type"] ==
                      "/ibc.core.channel.v1.MsgRecvPacket" ? (
                      <td className="sp-transfer-list__table__amount">
                        <div>
                          {getDecoded(tx.body.messages[0].packet?.data ?? "")
                            .receiver == bankAddress
                            ? "+" +
                              getDecoded(tx.body.messages[0].packet?.data ?? "")
                                .amount +
                              " IBC/" +
                              tx.body.messages[0].packet?.destination_port.toUpperCase() +
                              "/" +
                              tx.body.messages[0].packet?.destination_channel.toUpperCase() +
                              "/" +
                              getDecoded(
                                tx.body.messages[0].packet?.data ?? ""
                              )?.denom?.toUpperCase()
                            : "-" +
                              getDecoded(tx.body.messages[0].packet?.data ?? "")
                                .amount +
                              " IBC/" +
                              tx.body.messages[0].packet?.destination_port.toUpperCase() +
                              "/" +
                              tx.body.messages[0].packet?.destination_channel.toUpperCase() +
                              "/" +
                              getDecoded(
                                tx.body.messages[0].packet?.data ?? ""
                              )?.denom?.toUpperCase()}
                        </div>
                      </td>
                    ) : (
                      <td className="sp-transfer-list__table__amount"></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="sp-transfer-list__table sp-box sp-shadow">
              <tbody>
                <tr>
                  <td className="sp-transfer-list__status">
                    <div className="sp-transfer-list__status__wrapper">
                      <div className="sp-transfer-list__status__icon sp-transfer-list__status__icon__empty">
                        <span className="sp-icon sp-icon-Transactions" />
                      </div>
                      <div className="sp-transfer-list__status__action">
                        <div className="sp-transfer-list__status__action__text">
                          No transactions yet
                        </div>
                        {!address && (
                          <div className="sp-transfer-list__status__action__date">
                            Add or unlock a wallet to see recent transactions
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="sp-transfer-list__table__address"></td>
                  <td className="sp-transfer-list__table__amount"></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
};

export default SpTransferList;
