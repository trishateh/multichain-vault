"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { SimpleVaultABI, ERC20_ABI } from "@/lib/contracts";
import { CONTRACT_ADDRESSES } from "@/lib/config/contracts";
import { useTransactionStore } from "@/store/transactionStore";
import { SupportedChainId } from "@/lib/config/contracts";
import toast from "react-hot-toast";

interface BatchDepositInput {
  chainId: SupportedChainId;
  amount: string;
}

interface BatchStep {
  chainId: SupportedChainId;
  type: "approval" | "deposit" | "withdraw";
  amount: string;
  status: "pending" | "wallet-pending" | "confirming" | "completed" | "failed";
}

type BatchFlowState = "idle" | "executing" | "completed" | "failed";

export function useBatchOperations() {
  const { address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Dedicated wagmi hooks for batch operations with state tracking
  const {
    writeContract: writeBatchContract,
    data: currentTxHash,
    isPending: isTxPending,
    error: txError,
    reset: resetWriteContract,
  } = useWriteContract();

  // Track current transaction receipt
  const {
    isLoading: isTxConfirming,
    isSuccess: isTxConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: currentTxHash,
  });

  // Batch operation state
  const [batchFlowState, setBatchFlowState] = useState<BatchFlowState>("idle");
  const [batchSteps, setBatchSteps] = useState<BatchStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  const { addTransaction } = useTransactionStore();

  // State-driven transaction flow effects
  useEffect(() => {
    if (batchFlowState !== "executing" || currentStepIndex >= batchSteps.length)
      return;

    const currentStep = batchSteps[currentStepIndex];
    const chainName =
      currentStep.chainId === 11155111 ? "Sepolia" : "Sei Testnet";

    // Handle wallet pending state - show toast when wallet popup appears
    if (currentStep.status === "wallet-pending" && isTxPending) {
      const actionText =
        currentStep.type === "approval"
          ? "approve USDC spending"
          : currentStep.type === "deposit"
          ? "confirm the deposit"
          : "confirm the withdrawal";
      toast.loading(`Please ${actionText} on ${chainName}...`, {
        id: `batch-${currentStepIndex}`,
      });
    }

    // Handle transaction submitted (hash received) - user signed transaction
    if (
      currentStep.status === "wallet-pending" &&
      currentTxHash &&
      !isTxPending
    ) {
      toast.dismiss(`batch-${currentStepIndex}`);
      const actionText =
        currentStep.type === "approval"
          ? "Approval"
          : currentStep.type === "deposit"
          ? "Deposit"
          : "Withdrawal";
      toast.success(`${actionText} transaction submitted on ${chainName}!`);

      // Update step status to confirming
      setBatchSteps((prev) =>
        prev.map((step, idx) =>
          idx === currentStepIndex ? { ...step, status: "confirming" } : step
        )
      );
    }

    // Handle transaction error (user rejection or other error)
    if (currentStep.status === "wallet-pending" && txError) {
      toast.dismiss(`batch-${currentStepIndex}`);
      if (txError.message.includes("User rejected")) {
        toast.error(`Transaction was rejected on ${chainName}`);
      } else {
        toast.error(`Transaction failed on ${chainName}`);
      }

      setBatchSteps((prev) => {
        const isApproval = currentStep.type === "approval";
        const nextIdx = currentStepIndex + 1;
        return prev.map((step, idx) => {
          if (idx === currentStepIndex) return { ...step, status: "failed" };
          if (
            isApproval &&
            idx === nextIdx &&
            step.chainId === currentStep.chainId &&
            step.type === "deposit"
          ) {
            return { ...step, status: "failed" };
          }
          return step;
        });
      });
      // Skip paired deposit if approval failed
      setCurrentStepIndex(
        (prev) => prev + (currentStep.type === "approval" ? 2 : 1)
      );
      resetWriteContract();
    }
  }, [
    batchFlowState,
    currentStepIndex,
    batchSteps,
    isTxPending,
    currentTxHash,
    txError,
  ]);

  // Handle transaction confirmation
  useEffect(() => {
    if (batchFlowState !== "executing" || currentStepIndex >= batchSteps.length)
      return;

    const currentStep = batchSteps[currentStepIndex];
    const chainName =
      currentStep.chainId === 11155111 ? "Sepolia" : "Sei Testnet";

    // Handle confirming state
    if (currentStep.status === "confirming" && isTxConfirming) {
      toast.loading(`Waiting for confirmation on ${chainName}...`, {
        id: `batch-confirm-${currentStepIndex}`,
      });
    }

    // Handle confirmed transaction - only NOW record transaction and show success
    if (currentStep.status === "confirming" && isTxConfirmed) {
      toast.dismiss(`batch-confirm-${currentStepIndex}`);
      const actionText =
        currentStep.type === "approval"
          ? "Approval"
          : currentStep.type === "deposit"
          ? "Deposit"
          : "Withdrawal";
      toast.success(`${actionText} confirmed on ${chainName}!`);

      // Record transaction in history ONLY after confirmation
      if (currentTxHash) {
        const contracts = CONTRACT_ADDRESSES[currentStep.chainId];
        addTransaction({
          id: `batch-${currentStep.type}-${currentStep.chainId}-${Date.now()}`,
          chainId: currentStep.chainId,
          type: currentStep.type,
          hash: currentTxHash,
          amount: currentStep.amount,
          token: contracts.usdc,
          timestamp: Date.now(),
          status: "completed",
        });
      }

      // Update step status to completed
      setBatchSteps((prev) =>
        prev.map((step, idx) =>
          idx === currentStepIndex ? { ...step, status: "completed" } : step
        )
      );

      // Move to next step or complete batch
      if (currentStepIndex + 1 >= batchSteps.length) {
        setBatchFlowState("completed");
        setIsExecuting(false);
        toast.success("Batch deposit completed successfully!");
      } else {
        setCurrentStepIndex((prev) => prev + 1);
        resetWriteContract();
      }
    }

    // Handle confirmation error
    if (currentStep.status === "confirming" && receiptError) {
      toast.dismiss(`batch-confirm-${currentStepIndex}`);
      toast.error(`Transaction confirmation failed on ${chainName}`);

      setBatchSteps((prev) => {
        const isApproval = currentStep.type === "approval";
        const nextIdx = currentStepIndex + 1;
        return prev.map((step, idx) => {
          if (idx === currentStepIndex) return { ...step, status: "failed" };
          if (
            isApproval &&
            idx === nextIdx &&
            step.chainId === currentStep.chainId &&
            step.type === "deposit"
          ) {
            return { ...step, status: "failed" };
          }
          return step;
        });
      });
      setCurrentStepIndex(
        (prev) => prev + (currentStep.type === "approval" ? 2 : 1)
      );
      resetWriteContract();
    }
  }, [
    batchFlowState,
    currentStepIndex,
    batchSteps,
    isTxConfirming,
    isTxConfirmed,
    receiptError,
    currentTxHash,
    addTransaction,
    resetWriteContract,
  ]);

  // Simple step execution - let wagmi handle chain switching
  useEffect(() => {
    if (batchFlowState !== "executing") return;
    if (currentStepIndex >= batchSteps.length) return;

    const currentStep = batchSteps[currentStepIndex];
    if (currentStep.status !== "pending") return;

    const executeStep = async () => {
      const chainName =
        currentStep.chainId === 11155111 ? "Sepolia" : "Sei Testnet";

      try {
        // Switch to the target chain if needed
        if (currentChainId !== currentStep.chainId) {
          toast.loading(`Switching to ${chainName}...`, {
            id: `switch-${currentStepIndex}`,
          });

          await switchChain({ chainId: currentStep.chainId });
          toast.dismiss(`switch-${currentStepIndex}`);
          toast.success(`Switched to ${chainName}`);

          // Wait for chain switch to fully complete
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Mark step as wallet-pending and trigger transaction
        setBatchSteps((prev) =>
          prev.map((step, idx) =>
            idx === currentStepIndex
              ? { ...step, status: "wallet-pending" }
              : step
          )
        );

        const contracts = CONTRACT_ADDRESSES[currentStep.chainId];
        const amountWei = parseUnits(currentStep.amount, 6);

        // Always specify the exact chainId in the writeContract call
        const baseContractCall = {
          chainId: currentStep.chainId,
        };

        // Call writeContract - this will trigger wallet popup on the correct chain
        if (currentStep.type === "approval") {
          await writeBatchContract({
            ...baseContractCall,
            address: contracts.usdc,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [contracts.vault, amountWei],
          });
        } else if (currentStep.type === "deposit") {
          await writeBatchContract({
            ...baseContractCall,
            address: contracts.vault,
            abi: SimpleVaultABI,
            functionName: "deposit",
            args: [contracts.usdc, amountWei],
          });
        } else if (currentStep.type === "withdraw") {
          await writeBatchContract({
            ...baseContractCall,
            address: contracts.vault,
            abi: SimpleVaultABI,
            functionName: "withdraw",
            args: [contracts.usdc, amountWei],
          });
        }
      } catch (error) {
        toast.dismiss(`switch-${currentStepIndex}`);

        const message = (error as Error)?.message || "Operation failed";

        // Check if it's a chain switch error vs transaction error
        if (message.includes("User rejected")) {
          toast.error(`Operation rejected on ${chainName}`);
        } else if (message.includes("chain")) {
          toast.error(`Failed to switch to ${chainName}`);
        } else {
          toast.error(`Operation failed on ${chainName}`);
        }

        setBatchSteps((prev) => {
          const isApproval = currentStep.type === "approval";
          const nextIdx = currentStepIndex + 1;
          return prev.map((step, idx) => {
            if (idx === currentStepIndex) return { ...step, status: "failed" };
            if (
              isApproval &&
              idx === nextIdx &&
              step.chainId === currentStep.chainId &&
              step.type === "deposit"
            ) {
              return { ...step, status: "failed" };
            }
            return step;
          });
        });
        setCurrentStepIndex(
          (prev) => prev + (currentStep.type === "approval" ? 2 : 1)
        );
        resetWriteContract();
      }
    };

    executeStep();
  }, [
    batchFlowState,
    currentStepIndex,
    batchSteps,
    switchChain,
    writeBatchContract,
    resetWriteContract,
  ]);

  // Finalize when all steps processed
  useEffect(() => {
    if (batchFlowState !== "executing") return;
    if (currentStepIndex < batchSteps.length) return;
    const anyFailed = batchSteps.some((s) => s.status === "failed");
    setBatchFlowState(anyFailed ? "failed" : "completed");
    setIsExecuting(false);
    if (anyFailed) {
      toast.error("Operation completed with some failures");
    } else {
      toast.success("Operation completed successfully!");
    }
  }, [batchFlowState, currentStepIndex, batchSteps]);

  // Reset batch operation
  const resetBatchOperation = useCallback(() => {
    setBatchFlowState("idle");
    setBatchSteps([]);
    setCurrentStepIndex(0);
    setIsExecuting(false);
    resetWriteContract();
  }, [resetWriteContract]);

  // Auto-reset after completion or failure (allow user to see results briefly)
  useEffect(() => {
    if (batchFlowState === "completed" || batchFlowState === "failed") {
      const timer = setTimeout(() => {
        resetBatchOperation();
      }, 3000); // Reset after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [batchFlowState, resetBatchOperation]);

  // Create batch steps from deposit inputs
  const createBatchSteps = useCallback(
    (deposits: BatchDepositInput[]): BatchStep[] => {
      const steps: BatchStep[] = [];

      deposits.forEach((deposit) => {
        // Add approval step
        steps.push({
          chainId: deposit.chainId,
          type: "approval",
          amount: deposit.amount,
          status: "pending",
        });

        // Add deposit step
        steps.push({
          chainId: deposit.chainId,
          type: "deposit",
          amount: deposit.amount,
          status: "pending",
        });
      });

      return steps;
    },
    []
  );

  // Create withdraw single-step
  const createWithdrawSteps = useCallback(
    (withdrawal: {
      chainId: SupportedChainId;
      amount: string;
    }): BatchStep[] => {
      return [
        {
          chainId: withdrawal.chainId,
          type: "withdraw",
          amount: withdrawal.amount,
          status: "pending",
        },
      ];
    },
    []
  );

  // New state-driven batch execution
  const executeBatchOperation = useCallback(
    async (deposits: BatchDepositInput[]) => {
      if (!address) {
        toast.error("Please connect your wallet");
        return;
      }

      if (batchFlowState !== "idle") {
        toast.error("A batch operation is already in progress");
        return;
      }

      // Create batch steps and start execution
      const steps = createBatchSteps(deposits);
      setBatchSteps(steps);
      // Determine first actionable step that has a positive amount
      const firstIdx = steps.findIndex((s) => parseFloat(s.amount || "0") > 0);
      setCurrentStepIndex(firstIdx === -1 ? 0 : firstIdx);
      setBatchFlowState("executing");
      setIsExecuting(true);

      toast.loading("Starting batch deposit...", { id: "batch-start" });
      setTimeout(() => toast.dismiss("batch-start"), 1000);
    },
    [address, batchFlowState, createBatchSteps]
  );

  // Execute single withdraw operation using the same engine
  const executeWithdrawOperation = useCallback(
    async (withdrawal: { chainId: SupportedChainId; amount: string }) => {
      if (!address) {
        toast.error("Please connect your wallet");
        return;
      }

      if (batchFlowState !== "idle") {
        toast.error("An operation is already in progress");
        return;
      }

      // Start the withdrawal operation - chain switching will be handled by the main effect
      const steps = createWithdrawSteps(withdrawal);
      setBatchSteps(steps);
      setCurrentStepIndex(0);
      setBatchFlowState("executing");
      setIsExecuting(true);

      toast.loading("Starting withdrawal...", { id: "batch-start" });
      setTimeout(() => toast.dismiss("batch-start"), 800);
    },
    [address, batchFlowState, createWithdrawSteps]
  );

  // Cancel batch operation
  const cancelBatch = useCallback(() => {
    resetBatchOperation();
    toast.success("Batch operation cancelled");
  }, [resetBatchOperation]);

  // Force reset - for manual cleanup
  const forceReset = useCallback(() => {
    resetBatchOperation();
  }, [resetBatchOperation]);

  // Defensive: clear stale in-progress state when route/component remounts
  useEffect(() => {
    if (batchFlowState !== "idle" && batchSteps.length === 0) {
      resetBatchOperation();
    }
  }, []);

  return {
    // State
    isExecuting,
    batchFlowState,
    batchSteps,
    currentStepIndex,

    // Actions
    executeBatchOperation,
    executeWithdrawOperation,
    cancelBatch,
    resetBatchOperation,
    forceReset, // New: for manual cleanup
    retryStep: (
      chainId: SupportedChainId,
      type: "approval" | "deposit" | "withdraw"
    ) => {
      setBatchSteps((prev) => {
        const idx = prev.findIndex(
          (s) => s.chainId === chainId && s.type === type
        );
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], status: "pending" };
        return updated;
      });
      setCurrentStepIndex((prevIdx) => {
        // Jump to the retried step
        const targetIdx = batchSteps.findIndex(
          (s) => s.chainId === chainId && s.type === type
        );
        return targetIdx === -1 ? prevIdx : targetIdx;
      });
      if (batchFlowState !== "executing") {
        setBatchFlowState("executing");
        setIsExecuting(true);
      }
      resetWriteContract();
    },
  };
}
