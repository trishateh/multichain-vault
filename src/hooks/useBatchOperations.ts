"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useAccount,
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
  type: "approval" | "deposit";
  amount: string;
  status: "pending" | "wallet-pending" | "confirming" | "completed" | "failed";
}

type BatchFlowState = "idle" | "executing" | "completed" | "failed";

export function useBatchOperations() {
  const { address, chainId: currentChainId } = useAccount();
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
          : "confirm the deposit";
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
        currentStep.type === "approval" ? "Approval" : "Deposit";
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

      setBatchSteps((prev) =>
        prev.map((step, idx) =>
          idx === currentStepIndex ? { ...step, status: "failed" } : step
        )
      );
      setBatchFlowState("failed");
      setIsExecuting(false);
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
        currentStep.type === "approval" ? "Approval" : "Deposit";
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

      setBatchSteps((prev) =>
        prev.map((step, idx) =>
          idx === currentStepIndex ? { ...step, status: "failed" } : step
        )
      );
      setBatchFlowState("failed");
      setIsExecuting(false);
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

  // Auto-execute next step when previous is completed
  useEffect(() => {
    if (batchFlowState !== "executing") return;

    const executeNextStep = async () => {
      if (currentStepIndex >= batchSteps.length) return;

      const currentStep = batchSteps[currentStepIndex];
      if (currentStep.status !== "pending") return;

      const chainName =
        currentStep.chainId === 11155111 ? "Sepolia" : "Sei Testnet";

      try {
        // Switch network if needed
        if (currentChainId !== currentStep.chainId) {
          toast.loading(`Switching to ${chainName}...`, {
            id: "network-switch",
          });
          await switchChain({ chainId: currentStep.chainId });
          await new Promise((resolve) => setTimeout(resolve, 1000));
          toast.dismiss("network-switch");
        }

        // Update overall progress (but don't show transaction-specific toasts yet)
        toast.loading(
          `Processing ${chainName} (${currentStepIndex + 1}/${
            batchSteps.length
          })...`,
          {
            id: "batch-progress",
          }
        );

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

        // Call writeContract - this will trigger wallet popup
        if (currentStep.type === "approval") {
          await writeBatchContract({
            chainId: currentStep.chainId,
            address: contracts.usdc,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [contracts.vault, amountWei],
          });
        } else {
          await writeBatchContract({
            chainId: currentStep.chainId,
            address: contracts.vault,
            abi: SimpleVaultABI,
            functionName: "deposit",
            args: [contracts.usdc, amountWei],
          });
        }

        toast.dismiss("batch-progress");
      } catch (error) {
        console.error("Step execution error:", error);
        toast.dismiss("batch-progress");
        setBatchSteps((prev) =>
          prev.map((step, idx) =>
            idx === currentStepIndex ? { ...step, status: "failed" } : step
          )
        );
        setBatchFlowState("failed");
        setIsExecuting(false);
      }
    };

    executeNextStep();
  }, [
    batchFlowState,
    currentStepIndex,
    batchSteps,
    currentChainId,
    switchChain,
    writeBatchContract,
  ]);

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
      setCurrentStepIndex(0);
      setBatchFlowState("executing");
      setIsExecuting(true);

      toast.loading("Starting batch deposit...", { id: "batch-start" });
      setTimeout(() => toast.dismiss("batch-start"), 1000);
    },
    [address, batchFlowState, createBatchSteps]
  );

  // Reset batch operation
  const resetBatchOperation = useCallback(() => {
    setBatchFlowState("idle");
    setBatchSteps([]);
    setCurrentStepIndex(0);
    setIsExecuting(false);
    resetWriteContract();
  }, [resetWriteContract]);

  // Cancel batch operation
  const cancelBatch = useCallback(() => {
    resetBatchOperation();
    toast("Batch operation cancelled");
  }, [resetBatchOperation]);

  return {
    // State
    isExecuting,
    batchFlowState,
    batchSteps,
    currentStepIndex,

    // Actions
    executeBatchOperation,
    cancelBatch,
    resetBatchOperation,
  };
}
