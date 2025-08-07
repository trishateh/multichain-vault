"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckCircle, XCircle, Clock, AlertCircle, X, RotateCcw } from "lucide-react";
import { BatchOperation, TransactionStatus } from "@/types";
import { formatNumber } from "@/lib/utils";

interface BatchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchOperation: BatchOperation | null;
  onRetryTransaction: (chainId: number, type: string) => void;
  onCancelBatch: () => void;
}

export function BatchProgressModal({
  isOpen,
  onClose,
  batchOperation,
  onRetryTransaction,
  onCancelBatch,
}: BatchProgressModalProps) {
  if (!batchOperation) return null;

  const getStatusIcon = (status: TransactionStatus["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "in_progress":
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        );
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TransactionStatus["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-700 bg-green-50";
      case "failed":
        return "text-red-700 bg-red-50";
      case "in_progress":
        return "text-blue-700 bg-blue-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  const getChainName = (chainId: number) => {
    return chainId === 11155111 ? "Sepolia" : "Sei Testnet";
  };

  const getProgressPercentage = () => {
    const completedSteps = batchOperation.transactions.filter(
      (tx) => tx.status === "completed"
    ).length;
    return (completedSteps / batchOperation.totalSteps) * 100;
  };

  const canClose = batchOperation.status === "completed" || batchOperation.status === "failed";
  const canCancel = batchOperation.status === "in_progress";

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => canClose && onClose()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Batch Deposit Progress
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">
                      Step {batchOperation.currentStep} of {batchOperation.totalSteps}
                    </p>
                  </div>
                  {canClose && (
                    <button
                      onClick={onClose}
                      className="rounded-md p-1 hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>

                {/* Transaction List */}
                <div className="space-y-3 mb-6">
                  {batchOperation.transactions.map((transaction) => (
                    <div
                      key={`${transaction.chainId}-${transaction.type}`}
                      className={`p-4 rounded-lg border ${getStatusColor(transaction.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(transaction.status)}
                          <div>
                            <div className="font-medium">
                              {transaction.type === "approval" ? "Approve" : "Deposit"} USDC on{" "}
                              {getChainName(transaction.chainId)}
                            </div>
                            {transaction.amount && (
                              <div className="text-sm opacity-75">
                                Amount: {formatNumber(parseFloat(transaction.amount))} USDC
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Retry Button */}
                          {transaction.status === "failed" && (
                            <button
                              onClick={() => onRetryTransaction(transaction.chainId, transaction.type)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Retry
                            </button>
                          )}
                          
                          {/* Transaction Hash Link */}
                          {transaction.hash && (
                            <a
                              href={`${
                                transaction.chainId === 11155111
                                  ? "https://sepolia.etherscan.io"
                                  : "https://seitrace.com/?chain=testnet"
                              }/tx/${transaction.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              View on Explorer
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Error Message */}
                      {transaction.error && (
                        <div className="mt-2 flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <p className="text-sm text-red-700">{transaction.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Status Messages */}
                {batchOperation.status === "completed" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <h4 className="font-medium text-green-800">Batch Operation Completed!</h4>
                        <p className="text-sm text-green-700 mt-1">
                          All deposits have been successfully processed. Your vault balances will update shortly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {batchOperation.status === "failed" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-500 mr-3" />
                      <div>
                        <h4 className="font-medium text-red-800">Batch Operation Failed</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Some transactions failed. You can retry individual transactions or cancel the operation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  {canCancel && (
                    <button
                      onClick={onCancelBatch}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel Remaining
                    </button>
                  )}
                  
                  {canClose && (
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
                    >
                      Close
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
