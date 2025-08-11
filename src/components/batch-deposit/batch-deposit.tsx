"use client";

import { useState } from "react";
import { BatchDepositForm } from "./batch-deposit-form";
import { BatchProgressModal } from "./batch-progress-modal";
import { useUnifiedOperations } from "@/hooks/useUnifiedOperations";
import { SupportedChainId } from "@/lib/config/contracts";
import { buildBatchOperationFromSteps } from "./utils";

interface BatchDepositInput {
  chainId: SupportedChainId;
  amount: string;
}

export function BatchDeposit() {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const {
    isExecuting,
    batchFlowState,
    batchSteps,
    currentStepIndex,
    executeBatchDeposit,
    cancelBatch,
    retryStep,
    forceReset,
  } = useUnifiedOperations();

  const handleSubmit = async (deposits: BatchDepositInput[]) => {
    setShowProgressModal(true);
    await executeBatchDeposit(deposits);
  };

  const handleCloseModal = () => {
    // Only allow closing if batch is completed or failed
    if (batchFlowState === "completed" || batchFlowState === "failed" || batchFlowState === "idle") {
      setShowProgressModal(false);
      // Reset the batch operation state to allow fresh start
      forceReset();
    }
  };

  const handleCancelBatch = () => {
    cancelBatch();
    setShowProgressModal(false);
  };

  const mockBatchOperation = buildBatchOperationFromSteps(
    batchSteps as any,
    batchFlowState as any,
    currentStepIndex
  );

  return (
    <>
      <BatchDepositForm 
        onSubmit={handleSubmit} 
        isLoading={isExecuting}
      />
      
      <BatchProgressModal
        isOpen={showProgressModal}
        onClose={handleCloseModal}
        batchOperation={mockBatchOperation}
        onRetryTransaction={(chainId, type) => {
          retryStep(chainId as SupportedChainId, type as 'approval' | 'deposit')
        }}
        onCancelBatch={handleCancelBatch}
      />
    </>
  );
}
