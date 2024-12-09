import * as chains from "viem/chains";
import { defineChain } from "viem";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

// // Define Tenderly network using defineChain
// const tenderlyTestnet = defineChain({
//   id: 1337,
//   name: "Tenderly Testnet",
//   nativeCurrency: {
//     decimals: 18,
//     name: "Ether",
//     symbol: "ETH",
//   },
//   rpcUrls: {
//     default: { 
//       http: ["https://rpc.vnet.tenderly.co/devnet/your-project/your-access-key"],
//       webSocket: ["wss://rpc.vnet.tenderly.co/devnet/your-project/your-access-key"] 
//     },
//     public: { 
//       http: ["https://rpc.vnet.tenderly.co/devnet/your-project/your-access-key"],
//       webSocket: ["wss://rpc.vnet.tenderly.co/devnet/your-project/your-access-key"]
//     },
//   },
//   blockExplorers: {
//     default: { name: "Tenderly", url: "https://dashboard.tenderly.co" },
//   },
// });

const scaffoldConfig = {
  // Ensure targetNetworks is an array with at least one network
  targetNetworks: [
    {
      id: 11155111,
      name: "virtual_sepolia",
      rpcUrls: {
        default: {
          http: [process.env.NEXT_PUBLIC_TENDERLY_RPC_URL || ""],
        },
        public: {
          http: [process.env.NEXT_PUBLIC_TENDERLY_RPC_URL || ""],
        },
      },
      nativeCurrency: {
        name: "Sepolia ETH",
        symbol: "ETH",
        decimals: 18,
      },
      testnet: true,
    },
  ] as const,
  
  pollingInterval: 30000,
  
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF",
  
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  
  onlyLocalBurnerWallet: false,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;

