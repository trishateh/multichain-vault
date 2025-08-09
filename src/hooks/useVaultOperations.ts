"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { SimpleVaultABI, ERC20_ABI } from "@/lib/contracts";
import { CONTRACT_ADDRESSES, SupportedChainId } from "@/lib/config/contracts";
import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { useTransactionStore } from "@/store/transactionStore";

export function useVaultOperations() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const { addTransaction } = useTransactionStore();

  // Separate hooks for approval and deposit to track states independently
  const {
    writeContract: writeApproval,
    data: approvalHash,
    isPending: isApprovalPending,
    error: approvalError,
  } = useWriteContract();

  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
    error: depositError,
  } = useWriteContract();

  // Track approval transaction
  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalConfirmed,
    error: approvalReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Track deposit transaction
  const {
    isLoading: isDepositConfirming,
    isSuccess: isDepositConfirmed,
    error: depositReceiptError,
  } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // State to track deposit flow
  const [depositFlowState, setDepositFlowState] = useState<
    | "idle"
    | "approval-pending"
    | "approval-confirming"
    | "deposit-pending"
    | "deposit-confirming"
    | "completed"
    | "error"
  >("idle");

  // Store current deposit parameters
  const [currentDepositParams, setCurrentDepositParams] = useState<{
    chainId: SupportedChainId;
    amount: string;
  } | null>(null);

  // For backward compatibility with existing functions
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Handle approval state changes with toasts
  useEffect(() => {
    if (depositFlowState === "approval-pending" && isApprovalPending) {
      toast.loading("Please approve USDC spending in your wallet...", {
        id: "approval-pending",
      });
    }

    if (
      depositFlowState === "approval-pending" &&
      approvalHash &&
      !isApprovalPending
    ) {
      toast.dismiss("approval-pending");
      toast.success("Approval transaction submitted!");
      setDepositFlowState("approval-confirming");
    }

    if (depositFlowState === "approval-pending" && approvalError) {
      toast.dismiss("approval-pending");
      toast.error("Approval failed");
      setDepositFlowState("error");
    }
  }, [depositFlowState, isApprovalPending, approvalHash, approvalError]);

  // Handle approval confirmation state changes
  useEffect(() => {
    if (depositFlowState === "approval-confirming" && isApprovalConfirming) {
      toast.loading("Waiting for approval confirmation...", {
        id: "approval-confirming",
      });
    }

    if (depositFlowState === "approval-confirming" && isApprovalConfirmed) {
      toast.dismiss("approval-confirming");
      toast.success("Approval confirmed! Preparing deposit...");

      // Record the approval transaction
      if (approvalHash && currentDepositParams) {
        const contracts = CONTRACT_ADDRESSES[currentDepositParams.chainId];
        addTransaction({
          id: `approval-${Date.now()}`,
          chainId: currentDepositParams.chainId,
          type: "approval",
          hash: approvalHash,
          amount: currentDepositParams.amount,
          token: contracts.usdc,
          timestamp: Date.now(),
          status: "completed",
        });
      }

      setDepositFlowState("deposit-pending");
    }

    if (depositFlowState === "approval-confirming" && approvalReceiptError) {
      toast.dismiss("approval-confirming");
      toast.error("Approval confirmation failed");
      setDepositFlowState("error");
    }
  }, [
    depositFlowState,
    isApprovalConfirming,
    isApprovalConfirmed,
    approvalReceiptError,
    approvalHash,
    addTransaction,
    currentDepositParams,
  ]);

  // Handle deposit state changes with toasts
  useEffect(() => {
    if (depositFlowState === "deposit-pending" && isDepositPending) {
      toast.loading("Please confirm the deposit in your wallet...", {
        id: "deposit-pending",
      });
    }

    if (
      depositFlowState === "deposit-pending" &&
      depositHash &&
      !isDepositPending
    ) {
      toast.dismiss("deposit-pending");
      toast.success("Deposit transaction submitted!");
      setDepositFlowState("deposit-confirming");
    }

    if (depositFlowState === "deposit-pending" && depositError) {
      toast.dismiss("deposit-pending");
      toast.error("Deposit failed");
      setDepositFlowState("error");
    }
  }, [depositFlowState, isDepositPending, depositHash, depositError]);

  // Handle deposit confirmation state changes
  useEffect(() => {
    if (depositFlowState === "deposit-confirming" && isDepositConfirming) {
      toast.loading("Waiting for deposit confirmation...", {
        id: "deposit-confirming",
      });
    }

    if (depositFlowState === "deposit-confirming" && isDepositConfirmed) {
      toast.dismiss("deposit-confirming");
      toast.success("Deposit completed successfully!");

      // Record the deposit transaction
      if (depositHash && currentDepositParams) {
        const contracts = CONTRACT_ADDRESSES[currentDepositParams.chainId];
        addTransaction({
          id: `deposit-${Date.now()}`,
          chainId: currentDepositParams.chainId,
          type: "deposit",
          hash: depositHash,
          amount: currentDepositParams.amount,
          token: contracts.usdc,
          timestamp: Date.now(),
          status: "completed",
        });
      }

      setDepositFlowState("completed");
    }

    if (depositFlowState === "deposit-confirming" && depositReceiptError) {
      toast.dismiss("deposit-confirming");
      toast.error("Deposit confirmation failed");
      setDepositFlowState("error");
    }
  }, [
    depositFlowState,
    isDepositConfirming,
    isDepositConfirmed,
    depositReceiptError,
    depositHash,
    addTransaction,
    currentDepositParams,
  ]);

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

  // Silent approve function for use in batch operations
  const approveSilent = useCallback(
    async (chainId: SupportedChainId, amount: string) => {
      if (!address) {
        return { success: false, hash: null };
      }

      try {
        const contracts = CONTRACT_ADDRESSES[chainId];
        const amountWei = parseUnits(amount, 6);

        const result = await writeContract({
          chainId,
          address: contracts.usdc,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contracts.vault, amountWei],
        });

        return { success: true, hash: result };
      } catch (error: unknown) {
        console.error("Approval error:", error);
        return { success: false, hash: null, error };
      }
    },
    [address, writeContract]
  );

  const approve = useCallback(
    async (chainId: SupportedChainId, amount: string) => {
      if (!address) {
        toast.error("Please connect your wallet");
        return { success: false, hash: null };
      }

      try {
        setIsLoading(true);
        const contracts = CONTRACT_ADDRESSES[chainId];
        const amountWei = parseUnits(amount, 6);

        const result = await writeContract({
          chainId,
          address: contracts.usdc,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contracts.vault, amountWei],
        });

        toast.success("Approval transaction submitted");
        return { success: true, hash: result };
      } catch (error: unknown) {
        console.error("Approval error:", error);
        if (error instanceof Error && error.message.includes("User rejected")) {
          toast.error("Transaction was rejected");
        } else {
          toast.error(
            error instanceof Error ? error.message : "Approval failed"
          );
        }
        return { success: false, hash: null };
      } finally {
        setIsLoading(false);
      }
    },
    [address, writeContract]
  );

  // Silent deposit function for use in batch operations
  const depositSilent = useCallback(
    async (chainId: SupportedChainId, amount: string) => {
      if (!address) {
        return { success: false, hash: null };
      }

      try {
        const contracts = CONTRACT_ADDRESSES[chainId];
        const amountWei = parseUnits(amount, 6);

        const result = await writeContract({
          chainId,
          address: contracts.vault,
          abi: SimpleVaultABI,
          functionName: "deposit",
          args: [contracts.usdc, amountWei],
        });

        return { success: true, hash: result };
      } catch (error: unknown) {
        console.error("Deposit error:", error);
        return { success: false, hash: null, error };
      }
    },
    [address, writeContract]
  );

  const deposit = useCallback(
    async (chainId: SupportedChainId, amount: string) => {
      if (!address) {
        toast.error("Please connect your wallet");
        return { success: false, hash: null };
      }

      try {
        setIsLoading(true);
        const contracts = CONTRACT_ADDRESSES[chainId];
        const amountWei = parseUnits(amount, 6);

        const result = await writeContract({
          chainId,
          address: contracts.vault,
          abi: SimpleVaultABI,
          functionName: "deposit",
          args: [contracts.usdc, amountWei],
        });
        console.log("result", result);
        toast.success("Deposit transaction submitted");
        return { success: true, hash: result };
      } catch (error: unknown) {
        console.error("Deposit error:", error);
        if (error instanceof Error && error.message.includes("User rejected")) {
          toast.error("Transaction was rejected");
        } else {
          toast.error(
            error instanceof Error ? error.message : "Deposit failed"
          );
        }
        return { success: false, hash: null };
      } finally {
        setIsLoading(false);
      }
    },
    [address, writeContract]
  );

  const withdraw = useCallback(
    async (chainId: SupportedChainId, amount: string) => {
      if (!address) {
        toast.error("Please connect your wallet");
        return { success: false, hash: null };
      }

      try {
        setIsLoading(true);
        const contracts = CONTRACT_ADDRESSES[chainId];
        const amountWei = parseUnits(amount, 6);

        const result = await writeContract({
          chainId,
          address: contracts.vault,
          abi: SimpleVaultABI,
          functionName: "withdraw",
          args: [contracts.usdc, amountWei],
        });

        toast.success("Withdrawal transaction submitted");

        // Record the withdrawal transaction (we'll use a placeholder hash for now)
        addTransaction({
          id: `withdraw-${chainId}-${Date.now()}`,
          chainId,
          type: "withdraw",
          hash: `0x${Date.now().toString(16)}` as `0x${string}`,
          amount: amount,
          token: contracts.usdc,
          timestamp: Date.now(),
          status: "completed",
        });

        return { success: true, hash: result };
      } catch (error: unknown) {
        console.error("Withdrawal error:", error);
        if (error instanceof Error && error.message.includes("User rejected")) {
          toast.error("Transaction was rejected");
        } else {
          toast.error(
            error instanceof Error ? error.message : "Withdrawal failed"
          );
        }
        return { success: false, hash: null };
      } finally {
        setIsLoading(false);
      }
    },
    [address, writeContract, addTransaction]
  );

  // State-driven deposit flow that responds to actual wagmi states
  const depositWithApproval = useCallback(
    async (chainId: SupportedChainId, amount: string) => {
      if (!address) {
        toast.error("Please connect your wallet");
        return { success: false, step: "error" };
      }

      if (depositFlowState !== "idle") {
        toast.error("A deposit is already in progress");
        return { success: false, step: "error" };
      }

      try {
        setIsLoading(true);
        const contracts = CONTRACT_ADDRESSES[chainId];
        const amountWei = parseUnits(amount, 6);

        // Store parameters for later use in auto-deposit
        setCurrentDepositParams({ chainId, amount });

        // Start the approval process - the useEffect hooks will handle toasts
        setDepositFlowState("approval-pending");

        await writeApproval({
          chainId,
          address: contracts.usdc,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contracts.vault, amountWei],
        });

        // Return immediately - the useEffect hooks will manage the rest of the flow
        return { success: true, step: "started" };
      } catch (error: unknown) {
        console.error("Deposit flow error:", error);
        setDepositFlowState("error");
        setIsLoading(false);
        return { success: false, step: "error" };
      }
    },
    [address, writeApproval, depositFlowState]
  );

  // Auto-trigger deposit when approval is confirmed
  useEffect(() => {
    if (
      depositFlowState === "deposit-pending" &&
      !isDepositPending &&
      !depositHash &&
      currentDepositParams
    ) {
      const triggerDeposit = async () => {
        try {
          const { chainId, amount } = currentDepositParams;
          const contracts = CONTRACT_ADDRESSES[chainId];
          const amountWei = parseUnits(amount, 6);

          await writeDeposit({
            chainId,
            address: contracts.vault,
            abi: SimpleVaultABI,
            functionName: "deposit",
            args: [contracts.usdc, amountWei],
          });
        } catch (error) {
          console.error("Auto deposit trigger error:", error);
          setDepositFlowState("error");
        }
      };

      // Small delay to ensure approval has settled
      const timeout = setTimeout(triggerDeposit, 1000);
      return () => clearTimeout(timeout);
    }
  }, [
    depositFlowState,
    isDepositPending,
    depositHash,
    currentDepositParams,
    writeDeposit,
  ]);

  // Reset flow state when completed or error
  useEffect(() => {
    if (depositFlowState === "completed" || depositFlowState === "error") {
      const timeout = setTimeout(() => {
        setDepositFlowState("idle");
        setCurrentDepositParams(null);
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [depositFlowState]);

  return {
    approve,
    deposit,
    withdraw,
    depositWithApproval,
    checkAllowance,
    // Silent versions for batch operations
    approveSilent,
    depositSilent,
    isLoading:
      isLoading ||
      isPending ||
      isConfirming ||
      isApprovalPending ||
      isDepositPending,
    isConfirmed,
    hash,
    depositFlowState,
    resetDepositFlow: () => setDepositFlowState("idle"),
  };
}
