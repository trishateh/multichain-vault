"use client";

import { useState } from "react";
import { BatchDepositForm } from "./batch-deposit-form";
import { BatchProgressModal } from "./batch-progress-modal";
import { useBatchOperations } from "@/hooks/useBatchOperations";
import { SupportedChainId } from "@/lib/config/contracts";

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
    executeBatchOperation,
    cancelBatch,
    retryStep,
  } = useBatchOperations();

  const handleSubmit = async (deposits: BatchDepositInput[]) => {
    setShowProgressModal(true);
    await executeBatchOperation(deposits);
  };

  const handleCloseModal = () => {
    // Only allow closing if batch is completed or failed
    if (batchFlowState === "completed" || batchFlowState === "failed" || batchFlowState === "idle") {
      setShowProgressModal(false);
    }
  };

  const handleCancelBatch = () => {
    cancelBatch();
    setShowProgressModal(false);
  };

  // Create a mock BatchOperation for the modal (temporary until we update the modal)
  const mockBatchOperation = batchSteps.length > 0 ? {
    id: `batch-${Date.now()}`,
    deposits: [],
    status: (batchFlowState === 'executing' ? 'in_progress' : batchFlowState) as any,
    currentStep: currentStepIndex + 1,
    totalSteps: batchSteps.length,
    transactions: batchSteps.map(step => ({
      chainId: step.chainId,
      type: step.type,
      status: (step.status === 'wallet-pending' || step.status === 'confirming') ? 'in_progress' : step.status as any,
      amount: step.amount,
    })),
  } : null;

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
