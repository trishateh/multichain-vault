"use client";

import { useBatchOperations } from "./useBatchOperations";
import { SupportedChainId } from "@/lib/config/contracts";

export function useUnifiedOperations() {
  const batchOps = useBatchOperations();

  // Single deposit - converts to a single-step batch operation
  const executeSingleDeposit = async (
    chainId: SupportedChainId,
    amount: string
  ) => {
    return batchOps.executeBatchOperation([{ chainId, amount }]);
  };

  // Single withdrawal - converts to a single-step batch operation
  const executeSingleWithdrawal = async (
    chainId: SupportedChainId,
    amount: string
  ) => {
    return batchOps.executeWithdrawOperation({ chainId, amount });
  };

  // Multi-chain batch deposit - direct pass-through
  const executeBatchDeposit = batchOps.executeBatchOperation;

  return {
    // Unified operations
    executeSingleDeposit,
    executeSingleWithdrawal,
    executeBatchDeposit,

    // Shared state and controls
    isExecuting: batchOps.isExecuting,
    batchFlowState: batchOps.batchFlowState,
    batchSteps: batchOps.batchSteps,
    currentStepIndex: batchOps.currentStepIndex,

    // Shared actions
    cancelBatch: batchOps.cancelBatch,
    resetBatchOperation: batchOps.resetBatchOperation,
    forceReset: batchOps.forceReset,
    retryStep: batchOps.retryStep,
  };
}
