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
    pendingBatch,
    isExecuting,
    executeBatchOperation,
    retryTransaction,
    cancelBatch,
  } = useBatchOperations();

  const handleSubmit = async (deposits: BatchDepositInput[]) => {
    setShowProgressModal(true);
    await executeBatchOperation(deposits);
  };

  const handleCloseModal = () => {
    setShowProgressModal(false);
  };

  const handleRetryTransaction = (chainId: number, type: string) => {
    retryTransaction(chainId, type);
  };

  const handleCancelBatch = () => {
    cancelBatch();
    setShowProgressModal(false);
  };

  return (
    <>
      <BatchDepositForm 
        onSubmit={handleSubmit} 
        isLoading={isExecuting}
      />
      
      <BatchProgressModal
        isOpen={showProgressModal}
        onClose={handleCloseModal}
        batchOperation={pendingBatch}
        onRetryTransaction={handleRetryTransaction}
        onCancelBatch={handleCancelBatch}
      />
    </>
  );
}
