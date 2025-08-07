"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { SimpleVaultABI, ERC20_ABI } from "@/lib/contracts";
import { CONTRACT_ADDRESSES, SupportedChainId } from "@/lib/config/contracts";
import { useState } from "react";
import toast from "react-hot-toast";

export function useVaultOperations() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Check USDC allowance
  const checkAllowance = async (chainId: SupportedChainId, amount: string) => {
    if (!address) return false;

    try {
      // This would need to be implemented with useReadContract
      // For now, we'll assume approval is needed
      console.log("Checking allowance for", chainId, amount);
      return false;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  };

  const approve = async (chainId: SupportedChainId, amount: string) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return false;
    }

    try {
      setIsLoading(true);
      const contracts = CONTRACT_ADDRESSES[chainId];
      const amountWei = parseUnits(amount, 6);

      await writeContract({
        chainId,
        address: contracts.usdc,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contracts.vault, amountWei],
      });

      toast.success("Approval transaction submitted");
      return true;
    } catch (error: unknown) {
      console.error("Approval error:", error);
      toast.error(error instanceof Error ? error.message : "Approval failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deposit = async (chainId: SupportedChainId, amount: string) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return false;
    }

    try {
      setIsLoading(true);
      const contracts = CONTRACT_ADDRESSES[chainId];
      const amountWei = parseUnits(amount, 6);

      await writeContract({
        chainId,
        address: contracts.vault,
        abi: SimpleVaultABI,
        functionName: "deposit",
        args: [contracts.usdc, amountWei],
      });

      toast.success("Deposit transaction submitted");
      return true;
    } catch (error: unknown) {
      console.error("Deposit error:", error);
      toast.error(error instanceof Error ? error.message : "Deposit failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (chainId: SupportedChainId, amount: string) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return false;
    }

    try {
      setIsLoading(true);
      const contracts = CONTRACT_ADDRESSES[chainId];
      const amountWei = parseUnits(amount, 6);

      await writeContract({
        chainId,
        address: contracts.vault,
        abi: SimpleVaultABI,
        functionName: "withdraw",
        args: [contracts.usdc, amountWei],
      });

      toast.success("Withdrawal transaction submitted");
      return true;
    } catch (error: unknown) {
      console.error("Withdrawal error:", error);
      toast.error(error instanceof Error ? error.message : "Withdrawal failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    approve,
    deposit,
    withdraw,
    checkAllowance,
    isLoading: isLoading || isPending || isConfirming,
    isConfirmed,
    hash,
  };
}
