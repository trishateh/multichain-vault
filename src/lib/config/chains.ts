import { defineChain } from "viem";

// Sepolia chain configuration
export const sepolia = defineChain({
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://ethereum-sepolia-rpc.publicnode.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    },
  },
  testnet: true,
});

// Sei Testnet chain configuration
export const seiTestnet = defineChain({
  id: 1328,
  name: "Sei Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "SEI",
    symbol: "SEI",
  },
  rpcUrls: {
    default: {
      http: ["https://evm-rpc-testnet.sei-apis.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Seitrace",
      url: "https://seitrace.com/?chain=testnet",
    },
  },
  testnet: true,
});

export const supportedChains = [sepolia, seiTestnet] as const;
