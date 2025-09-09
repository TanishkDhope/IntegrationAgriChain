import { createPublicClient, http, createWalletClient, custom } from "viem";
import { abi, contractAddress } from "./contract.js";

export async function setPrice(tokenId, price) {
  if (typeof window.ethereum != undefined) {
    walletClient = createWalletClient({
      transport: custom(window.ethereum),
    });
    const [connectedAccount] = await walletClient.requestAddresses();
    const currentChain = await getCurrentChain(walletClient);
    publicClient = createPublicClient({
      transport: custom(window.ethereum),
    });
    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    // Solidity-like hash
    const encoded = walletClient.encodeAbiParameters(
      [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
      [tokenId, price, expirationTime]
    );

    const messageHash = walletClient.keccak256(encoded);

    const signature = await walletClient.signMessage({
      message: messageHash,
      account: farmerAddress, // MetaMask account
    });

    console.log("Signature:", signature);
  } else {
    console.log("Please install MetaMask");
  }
}

export async function verifyPrice(
  tokenId,
  price,
  timestamp,
  signature,
  farmerAddress
) {
    
}
