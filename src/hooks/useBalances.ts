"use client";

import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { supportedChains } from "@/lib/config/chains";
import { CONTRACT_ADDRESSES } from "@/lib/config/contracts";
import { SimpleVaultABI, ERC20_ABI } from "@/lib/contracts";

export interface ChainBalance {
  chainId: number;
  chainName: string;
  walletBalance: string;
  vaultBalance: string;
  walletBalanceRaw: bigint;
  vaultBalanceRaw: bigint;
  isLoading: boolean;
  error?: Error;
}

export interface BalanceState {
  balances: ChainBalance[];
  totalWalletBalance: string;
  totalVaultBalance: string;
  totalPortfolioValue: string;
  isLoading: boolean;
  error?: Error;
}

export function useBalances(): BalanceState {
  const { address, isConnected } = useAccount();

  // Create contract calls for all chains
  const contracts = supportedChains.flatMap((chain) => {
    if (!address) return [];

    const chainContracts =
      CONTRACT_ADDRESSES[chain.id as keyof typeof CONTRACT_ADDRESSES];

    return [
      // Wallet USDC balance
      {
        address: chainContracts.usdc,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
        chainId: chain.id,
      } as const,
      // Vault USDC balance
      {
        address: chainContracts.vault,
        abi: SimpleVaultABI,
        functionName: "getBalance",
        args: [address, chainContracts.usdc],
        chainId: chain.id,
      } as const,
    ];
  });

  const { data, isLoading, error } = useReadContracts({
    contracts,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Process the results
  const balances: ChainBalance[] = supportedChains.map((chain, chainIndex) => {
    const walletBalanceIndex = chainIndex * 2;
    const vaultBalanceIndex = chainIndex * 2 + 1;

    const walletBalanceResult = data?.[walletBalanceIndex];
    const vaultBalanceResult = data?.[vaultBalanceIndex];

    const walletBalanceRaw =
      walletBalanceResult?.status === "success"
        ? (walletBalanceResult.result as bigint)
        : BigInt(0);
    const vaultBalanceRaw =
      vaultBalanceResult?.status === "success"
        ? (vaultBalanceResult.result as bigint)
        : BigInt(0);

    const walletBalance = formatUnits(walletBalanceRaw, 6); // USDC has 6 decimals
    const vaultBalance = formatUnits(vaultBalanceRaw, 6);

    return {
      chainId: chain.id,
      chainName: chain.name,
      walletBalance,
      vaultBalance,
      walletBalanceRaw,
      vaultBalanceRaw,
      isLoading: isLoading && isConnected,
      error:
        walletBalanceResult?.status === "failure" ||
        vaultBalanceResult?.status === "failure"
          ? new Error("Failed to fetch balance")
          : undefined,
    };
  });

  // Calculate totals
  const totalWalletBalanceRaw = balances.reduce(
    (sum, balance) => sum + balance.walletBalanceRaw,
    BigInt(0)
  );
  const totalVaultBalanceRaw = balances.reduce(
    (sum, balance) => sum + balance.vaultBalanceRaw,
    BigInt(0)
  );
  const totalPortfolioValueRaw = totalWalletBalanceRaw + totalVaultBalanceRaw;

  const totalWalletBalance = formatUnits(totalWalletBalanceRaw, 6);
  const totalVaultBalance = formatUnits(totalVaultBalanceRaw, 6);
  const totalPortfolioValue = formatUnits(totalPortfolioValueRaw, 6);

  return {
    balances,
    totalWalletBalance,
    totalVaultBalance,
    totalPortfolioValue,
    isLoading: isLoading && isConnected,
    error: error || balances.find((b) => b.error)?.error,
  };
}
