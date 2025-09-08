import {
  mint,
  getUserTokens,
  transferTokens,
  getTxnHistory,
  connect,
} from "./product_registry.js";

import { useState } from "react";

function Tokens() {
  const [amount, setAmount] = useState("");
  const [uri, setUri] = useState("");
  const [tokens, setTokens] = useState([]);
  const [transferAmt, setTransferAmt] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [historyId, setHistoryId] = useState("");
  const [history, setHistory] = useState([]);
  const [account, setAccount] = useState(null);

  const handleMint = async () => {
    await mint(amount, uri);
    const result = await getUserTokens();
    console.log(result);
    setTokens(result);
  };

  const handleConnect = async () => {
    const acc = await connect();

    if (!acc) return;
    setAccount(acc);

    const result = await getUserTokens();
    console.log(result);
    setTokens(result);
  };

  const handleGetTokens = async () => {
    const result = await getUserTokens();
    setTokens(result);
  };

  const handleTransfer = async () => {
    await transferTokens(tokenId, toAddress, transferAmt);
    const result = await getUserTokens();
    console.log(result);
    setTokens(result);
  };

  const handleHistory = async () => {
    const result = getTxnHistory(historyId);
    setHistory(result);
  };
  return (
    <div>
      <h3>Product Registry</h3>

      {/* Mint Section */}
      <div>
        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          placeholder="URI"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
        />
        <button onClick={handleMint}>Mint Tokens</button>
      </div>

      <div>
        <button onClick={handleConnect}>Connect</button>
        <button onClick={handleGetTokens}>Get All Tokens Owned</button>
      </div>

      {/* Transfer Section */}
      <div>
        <input
          placeholder="Transfer Amount"
          value={transferAmt}
          onChange={(e) => setTransferAmt(e.target.value)}
        />
        <input
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
        <input
          placeholder="To Address"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
        />
        <button onClick={handleTransfer}>Transfer</button>
      </div>

      <div>
        {tokens?.map((t, idx) => (
          <div key={idx} className="token-card">
            <img src={t.image} alt={t.name} />
            <h3>{t.name}</h3>
            <p>ID: {t.id.toString()}</p>
            <p>Balance: {t.balance}</p>
            <p>{t.description}</p>
          </div>
        ))}
      </div>

      {/* History Section */}
      <div>
        <input
          placeholder="Token ID for History"
          value={historyId}
          onChange={(e) => setHistoryId(e.target.value)}
        />
        <button onClick={handleHistory}>Get History</button>

        <div>
          {history.map((h, idx) => (
            <div key={idx} className="history-card">
              <p>
                <strong>From:</strong> {h.from}
              </p>
              <p>
                <strong>To:</strong> {h.to}
              </p>
              <p>
                <strong>Token ID:</strong> {h.id}
              </p>
              <p>
                <strong>Amount:</strong> {h.value}
              </p>
              <p>
                <strong>Tx Hash:</strong>{" "}
                <a
                  href={`https://etherscan.io/tx/${h.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {h.txHash.slice(0, 10)}…
                </a>
              </p>
              <p>
                <strong>Block:</strong> {h.blockNumber}
              </p>
              <p>
                <strong>Time:</strong> {new Date(h.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Tokens;
