import {
  createWalletClient,
  custom,
  createPublicClient,
  parseEther,
  defineChain,
  http,
  parseAbiItem,
  keccak256,
  toBytes,
  decodeAbiParameters,
  decodeEventLog,
} from "https://esm.sh/viem";

import { abi, contractAddress } from "./constants.js";
// Global history object
const txHistory = {};

const tokenTransferredEvent = parseAbiItem(
  "event TokenTransferred(address indexed from, address indexed to, uint256 indexed tokenId, uint256 amount)"
);

let walletClient;
let publicClient;

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    walletClient = createWalletClient({
      transport: custom(window.ethereum),
    });
    const [account] = await walletClient.requestAddresses();
    return account;
  } else {
    return null;
  }
}

async function mint(amount, uri) {
  if (typeof window.ethereum != undefined) {
    walletClient = createWalletClient({
      transport: custom(window.ethereum),
    });
    const [connectedAccount] = await walletClient.requestAddresses();
    const currentChain = await getCurrentChain(walletClient);
    publicClient = createPublicClient({
      transport: custom(window.ethereum),
    });
    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: "mint",
        args: [BigInt(amount), uri],
        account: connectedAccount,
        chain: currentChain,
      });
      // Then execute the transaction
      const hash = await walletClient.writeContract(request);
      console.log({ hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "reverted") {
        console.error("Transaction failed!");
      } else {
        console.log("Transaction succeeded!");
        console.log("Tx mined in block:", receipt.blockNumber);
      }
    } catch (err) {
      console.log("Transaction failed:", err);
    }
  } else {
    console.log("Please install MetaMask");
  }
}
async function getUserTokens() {
  if (typeof window.ethereum != undefined) {
    walletClient = createWalletClient({
      transport: custom(window.ethereum),
    });
    const [connectedAccount] = await walletClient.requestAddresses();
    publicClient = createPublicClient({
      transport: custom(window.ethereum),
    });
    const currentChain = await getCurrentChain(walletClient);
    try {
      const [ids, balances] = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "getUserTokens",
        args: [connectedAccount],
        chain: currentChain,
      });
      console.log("User Tokens:");
      ids.forEach((id, i) => {
        console.log(
          ` Token ID: ${id.toString()}, Balance: ${balances[i].toString()}`
        );
      });

      if (!ids.length) return [];

      //   return ids.map((id, i) => ({
      //     id: BigInt(id),
      //     balance: Number(balances[i] || 0),
      //   }));

      const result = [];
      for (let i = 0; i < ids.length; i++) {
        const tokenId = BigInt(ids[i]);
        const balance = Number(balances[i] || 0);

        const metadata = await getTokenMetadata(tokenId);
        if (!metadata) continue;

        const imageUrl =
          metadata.image && metadata.image.startsWith("ipfs://")
            ? metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")
            : metadata.image;

        result.push({
          id: tokenId,
          balance,
          name: metadata.name || "Unnamed Token",
          description: metadata.description || "",
          image: imageUrl,
        });
      }

      return result;
    } catch (err) {
      console.log("Failed to fetch user tokens: ", err);
      return [];
    }
  } else {
    console.log("Please install MetaMask");
  }
}

function saveTxInMemory(tokenId, txData) {
  tokenId = tokenId.toString(); // normalize key to string
  if (!txHistory[tokenId]) {
    txHistory[tokenId] = [];
  }

  // Add timestamp
  txData.timestamp = Date.now();
  txHistory[tokenId].push(txData);

  console.log("Transaction saved in memory:", txData);
}

// Function to fetch transaction history for a given tokenId
function getTxnHistory(historyId) {
  let tokenId = historyId.toString(); // ensure string
    if (!txHistory[tokenId] || txHistory[tokenId].length === 0) {
    console.log(`No transactions found for tokenId ${tokenId}`);
    return [];
  }

   return [...txHistory[tokenId]]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(tx => ({
      ...tx,
      time: new Date(tx.timestamp * 1000).toLocaleString() // readable
    }));

}

async function transferTokens(tokenId, toAddress, transferAmt) {
  if (typeof window.ethereum !== "undefined") {
    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
    });
    const [connectedAccount] = await walletClient.requestAddresses();
    const currentChain = await getCurrentChain(walletClient);
    const publicClient = createPublicClient({
      transport: custom(window.ethereum),
    });
    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: "tokenTransfer",
        args: [connectedAccount, toAddress, tokenId, BigInt(transferAmt), "0x"],
        account: connectedAccount,
        chain: currentChain,
      }); // Execute transaction
      const hash = await walletClient.writeContract(request);
      console.log({ hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Receipt:", receipt);
      if (receipt.status === "reverted") {
        console.error("Transaction failed!");
      } else {
        console.log("Transaction succeeded!");
        console.log("Tx mined in block:", receipt.blockNumber); // Find the relevant event in receipt.logs
        const event = receipt.logs.find(
          (log) =>
            log.topics[0] ===
            keccak256(toBytes("txnInfo(address,address,uint256,uint256)"))
        );
        console.log(event);
        const decoded = decodeAbiParameters(
          [
            { name: "to", type: "address" },
            { name: "id", type: "uint256" },
            { name: "value", type: "uint256" },
          ],
          toBytes(event.data)
        );
        console.log("Decoded:", decoded); // Slice last 40 characters
        const address = "0x" + event.topics[1].slice(-40);
        console.log(address);
        console.log(decoded[1], decoded[2]);

        // Save transaction in memory
        saveTxInMemory(decoded[1], {
          from: address,
          to: decoded[0],
          id: decoded[1],
          value: decoded[2],
          txHash: hash,
          blockNumber: receipt.blockNumber,
        });
      }
    } catch (err) {
      console.log("Transaction failed:", err);
    }
  } else {
    console.log("Please install MetaMask");
  }
}

async function getTokenMetadata(id) {
  if (id === undefined || id === null) return null;
  let tokenUri = await publicClient.readContract({
    address: contractAddress,
    abi: abi,
    functionName: "uri",
    args: [BigInt(id)],
  });

  if (!tokenUri) return null;
  // console.log("TokenUri:",tokenUri,"id:",id)
  // Convert ipfs:// URL to gateway URL
  if (tokenUri.startsWith("ipfs://")) {
    console.log("Converting IPFS URL:", tokenUri);
    tokenUri = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
    console.log("Converted to:", tokenUri);
  }

  try {
    const response = await fetch(tokenUri);

    return await response.json();
  } catch (err) {
    console.error("Failed to fetch metadata for token", id, err);
    return null;
  }
}

async function getCurrentChain(client) {
  const chainId = await client.getChainId();
  const currentChain = defineChain({
    id: chainId,
    name: "Custom Chain",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["http://localhost:8545"],
      },
    },
  });
  return currentChain;
}

export { mint, getUserTokens, transferTokens, getTxnHistory, connect };
