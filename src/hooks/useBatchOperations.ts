"use client";

import { useState, useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
// Remove unused import
import { useVaultOperations } from "./useVaultOperations";
import { useTransactionStore } from "@/store/transactionStore";
// import { useBalances } from "./useBalances"; // Not needed, balances auto-refresh
import { BatchOperation, TransactionStatus } from "@/types";
import { SupportedChainId } from "@/lib/config/contracts";
import toast from "react-hot-toast";

interface BatchDepositInput {
  chainId: SupportedChainId;
  amount: string;
}

export function useBatchOperations() {
  const { address, chainId: currentChainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { approve, deposit } = useVaultOperations();
  // const balancesHook = useBalances(); // Not needed, balances auto-refresh

  const {
    pendingBatch,
    startBatchOperation,
    updateBatchOperation,
    updateTransactionStatus,
    completeBatchOperation,
    cancelBatchOperation,
  } = useTransactionStore();

  const [isExecuting, setIsExecuting] = useState(false);

  // Create batch operation from deposit inputs
  const createBatchOperation = useCallback(
    (deposits: BatchDepositInput[]): BatchOperation => {
      const transactions: TransactionStatus[] = [];

      deposits.forEach((deposit) => {
        // Add approval transaction
        transactions.push({
          chainId: deposit.chainId,
          type: "approval",
          status: "pending",
          amount: deposit.amount,
        });

        // Add deposit transaction
        transactions.push({
          chainId: deposit.chainId,
          type: "deposit",
          status: "pending",
          amount: deposit.amount,
        });
      });

      return {
        id: `batch-${Date.now()}`,
        deposits,
        status: "pending",
        currentStep: 0,
        totalSteps: transactions.length,
        transactions,
      };
    },
    []
  );

  // Execute a single transaction with network switching
  const executeTransaction = useCallback(
    async (
      chainId: SupportedChainId,
      type: "approval" | "deposit",
      amount: string
    ): Promise<boolean> => {
      try {
        // Switch network if needed
        if (currentChainId !== chainId) {
          await switchChain({ chainId });
          // Wait a bit for network switch to complete
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Update status to in progress
        updateTransactionStatus(chainId, type, { status: "in_progress" });

        let success = false;
        if (type === "approval") {
          success = await approve(chainId, amount);
        } else if (type === "deposit") {
          success = await deposit(chainId, amount);
        }

        if (success) {
          updateTransactionStatus(chainId, type, { status: "completed" });
          return true;
        } else {
          updateTransactionStatus(chainId, type, {
            status: "failed",
            error: "Transaction failed",
          });
          return false;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        updateTransactionStatus(chainId, type, {
          status: "failed",
          error: errorMessage,
        });
        console.error(`Transaction failed:`, error);
        return false;
      }
    },
    [currentChainId, switchChain, approve, deposit, updateTransactionStatus]
  );

  // Execute batch operation sequentially
  const executeBatchOperation = useCallback(
    async (deposits: BatchDepositInput[]) => {
      if (!address) {
        toast.error("Please connect your wallet");
        return;
      }

      const batchOp = createBatchOperation(deposits);
      startBatchOperation(batchOp);
      setIsExecuting(true);

      try {
        let currentStep = 1;
        updateBatchOperation({ status: "in_progress", currentStep });

        // Execute each chain's transactions sequentially
        for (const deposit of deposits) {
          const { chainId, amount } = deposit;

          // Step 1: Approval
          updateBatchOperation({ currentStep });
          const approvalSuccess = await executeTransaction(
            chainId,
            "approval",
            amount
          );

          if (!approvalSuccess) {
            updateBatchOperation({ status: "failed" });
            toast.error(
              `Approval failed on ${
                chainId === 11155111 ? "Sepolia" : "Sei Testnet"
              }`
            );
            setIsExecuting(false);
            return;
          }

          currentStep++;

          // Step 2: Deposit
          updateBatchOperation({ currentStep });
          const depositSuccess = await executeTransaction(
            chainId,
            "deposit",
            amount
          );

          if (!depositSuccess) {
            updateBatchOperation({ status: "failed" });
            toast.error(
              `Deposit failed on ${
                chainId === 11155111 ? "Sepolia" : "Sei Testnet"
              }`
            );
            setIsExecuting(false);
            return;
          }

          currentStep++;
        }

        // All transactions completed successfully
        updateBatchOperation({
          status: "completed",
          currentStep: batchOp.totalSteps,
        });
        completeBatchOperation();

        // Note: Balances will auto-refresh due to react-query

        toast.success("Batch deposit completed successfully!");
      } catch (error) {
        console.error("Batch operation failed:", error);
        updateBatchOperation({ status: "failed" });
        toast.error("Batch operation failed");
      } finally {
        setIsExecuting(false);
      }
    },
    [
      address,
      createBatchOperation,
      startBatchOperation,
      updateBatchOperation,
      executeTransaction,
      completeBatchOperation,
    ]
  );

  // Retry a specific failed transaction
  const retryTransaction = useCallback(
    async (chainId: number, type: string) => {
      if (!pendingBatch) return;

      const transaction = pendingBatch.transactions.find(
        (tx) => tx.chainId === chainId && tx.type === type
      );

      if (!transaction || !transaction.amount) return;

      const success = await executeTransaction(
        chainId as SupportedChainId,
        type as "approval" | "deposit",
        transaction.amount
      );

      if (success) {
        // Check if all transactions are now completed
        const allCompleted = pendingBatch.transactions.every(
          (tx) =>
            tx.chainId !== chainId ||
            tx.type !== type ||
            tx.status === "completed"
        );

        if (allCompleted) {
          updateBatchOperation({ status: "completed" });
          completeBatchOperation();
          // Note: Balances will auto-refresh due to react-query
          toast.success("Batch operation completed!");
        }
      }
    },
    [
      pendingBatch,
      executeTransaction,
      updateBatchOperation,
      completeBatchOperation,
    ]
  );

  // Cancel the current batch operation
  const cancelBatch = useCallback(() => {
    cancelBatchOperation();
    setIsExecuting(false);
    toast("Batch operation cancelled");
  }, [cancelBatchOperation]);

  return {
    // State
    pendingBatch,
    isExecuting,

    // Actions
    executeBatchOperation,
    retryTransaction,
    cancelBatch,
  };
}
