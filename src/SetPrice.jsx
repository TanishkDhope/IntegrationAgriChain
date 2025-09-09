import React, { useState } from "react";
import {
  createWalletClient,
  custom,
  createPublicClient,
  recoverPublicKey,
  toHex,
  recoverAddress,
  verifyMessage
} from "viem";
import { getCurrentChain } from "./product_registry.js";
import { encodeAbiParameters, keccak256 } from "viem";

export default function SetPrice() {
  const [tokenId, setTokenId] = useState(0);
  const [price, setPrice] = useState(0);
  const [signature, setSignature] = useState("");
  const [timestamp, setTimestamp] = useState(0);
  const [tokenToVerify, setTokenToVerify] = useState(0);
  const [verifyPrice, setVerifyPrice] = useState(0);
  const [verifyTimestamp, setVerifyTimestamp] = useState(0);
  const [farmerAddress, setFarmerAddress] = useState("");
  const [verifySignature, setVerifySignature] = useState("");

  const handleSignPrice = async () => {
    if (!window.ethereum) return alert("Install MetaMask!");

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
    });
    const [connectedAccount] = await walletClient.requestAddresses();
    const currentChain = await getCurrentChain(walletClient);
    console.log(connectedAccount)
    // Set the current timestamp
    const now = Math.floor(Date.now() / 1000);
    setTimestamp(now);
    console.log(
      "Current timestamp:",
      now,
      "tokenId:",
      tokenId,
      "price:",
      price
    );
    // Encode tokenId, price, timestamp like Solidity
    const encoded = encodeAbiParameters(
      [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
      [tokenId, price, now]
    );

    const signature = await walletClient.signMessage({
      account: connectedAccount,
      message: { raw: encoded }, // raw bytes, not stringified
    });

    setSignature(signature);
    alert("✅ Price signed and stored in state!");
  };

  const handleVerify = async () => {
    try {
      // Encode parameters the same way as when signing
      console.log(
        "Current timestamp:",
        verifyTimestamp,
        "tokenId:",
        tokenToVerify,
        "price:",
        verifyPrice
      );

      const encoded = encodeAbiParameters(
        [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
        [tokenToVerify, verifyPrice, verifyTimestamp]
      );

      // Verify signature against farmer’s address
      const valid = await verifyMessage({
        address: farmerAddress,
        message: { raw: encoded },
        signature: verifySignature,
      });


      if (valid) {
        console.log("✅ Price verified:", verifyPrice);
      } else {
        console.log("❌ Invalid signature, cannot trust price");
      }
    } catch (err) {
      console.error("Verification failed:", err);
    }
  };
  return (
    <>
      <div>
        <h2>Farmer Price Signer</h2>
        <input
          type="text"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(Number(e.target.value))}
        />
        <input
          type="text"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <button onClick={handleSignPrice}>Sign Price</button>

        {signature && (
          <div>
            <p>Signature: {signature}</p>
            <p>Timestamp: {timestamp}</p>
          </div>
        )}
      </div>
      <br></br>
      <h2>Verify Price</h2>
      <input
        value={tokenToVerify}
        placeholder="Token ID"
        onChange={(e) => setTokenToVerify(Number(e.target.value))}
      />
      <input
        value={verifyPrice}
        placeholder="Price"
        onChange={(e) => setVerifyPrice(Number(e.target.value))}
      />
      <input
        value={verifyTimestamp}
        placeholder="Timestamp"
        onChange={(e) => setVerifyTimestamp(Number(e.target.value))}
      />
      <input
        value={farmerAddress}
        placeholder="Farmer Address"
        onChange={(e) => setFarmerAddress(e.target.value)}
      />
      <input
        value={verifySignature}
        placeholder="Signature"
        onChange={(e) => setVerifySignature(e.target.value)}
      />
      <button
        onClick={() => {
          handleVerify();
        }}
      >
        Verify Price
      </button>
    </>
  );
}
