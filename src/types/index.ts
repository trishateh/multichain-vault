import { type Address } from "viem";

export interface ChainBalances {
  walletBalance: bigint;
  vaultBalance: bigint;
}

export interface PortfolioBalance {
  [chainId: number]: ChainBalances;
}

export interface BatchDepositInput {
  chainId: number;
  amount: string;
}

export interface BatchOperation {
  id: string;
  deposits: BatchDepositInput[];
  status: "pending" | "in_progress" | "completed" | "failed";
  currentStep: number;
  totalSteps: number;
  transactions: TransactionStatus[];
}

export interface TransactionStatus {
  chainId: number;
  type: "approval" | "deposit" | "withdraw";
  hash?: Address;
  status: "pending" | "in_progress" | "completed" | "failed";
  error?: string;
  amount?: string;
}

export interface Transaction {
  id: string;
  chainId: number;
  type: "approval" | "deposit" | "withdraw";
  hash: Address;
  amount: string;
  token: Address;
  timestamp: number;
  status: "pending" | "completed" | "failed";
  blockExplorer?: string;
}

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  vault: Address;
  usdc: Address;
}

export interface WalletState {
  isConnected: boolean;
  address: Address | null;
  chainId: number | null;
}

export interface BalanceState {
  balances: PortfolioBalance;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export interface TransactionHistoryState {
  history: Transaction[];
  pendingBatch: BatchOperation | null;
  isLoading: boolean;
}
