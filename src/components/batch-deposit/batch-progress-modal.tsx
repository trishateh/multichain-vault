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
  title?: string;
}

export function BatchProgressModal({
  isOpen,
  onClose,
  batchOperation,
  onRetryTransaction,
  onCancelBatch,
  title,
}: BatchProgressModalProps) {
  if (!batchOperation) return null;

  const getStatusIcon = (status: TransactionStatus["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-400" />;
      case "in_progress":
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--accent-primary)]"></div>
        );
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: TransactionStatus["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-300 bg-green-500/10 border-green-500/20";
      case "failed":
        return "text-red-300 bg-red-500/10 border-red-500/20";
      case "in_progress":
        return "text-blue-300 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-slate-300 bg-white/5 border-white/10";
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl glass-effect p-6 text-left align-middle shadow-xl transition-all border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-white">
                      {title || "Operation Progress"}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-400">
                      Step {Math.min(batchOperation.currentStep, batchOperation.totalSteps)} of {batchOperation.totalSteps}
                    </p>
                  </div>
                  {canClose && (
                    <button
                      onClick={onClose}
                      className="rounded-md p-1 hover:bg-white/10 transition-colors"
                    >
                      <X className="h-5 w-5 text-slate-400 hover:text-white" />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>

                {/* Transaction List */}
                <div className="space-y-3 mb-6">
                  {batchOperation.transactions.map((transaction) => (
                    <div
                      key={`${transaction.chainId}-${transaction.type}`}
                      className={`p-4 rounded-xl border ${getStatusColor(transaction.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(transaction.status)}
                          <div>
                            <div className="font-medium text-white">
                              {transaction.type === "approval"
                                ? "Approve"
                                : transaction.type === "deposit"
                                ? "Deposit"
                                : "Withdraw"} USDC on{" "}
                              {getChainName(transaction.chainId)}
                            </div>
                            {transaction.amount && (
                              <div className="text-sm text-slate-400">
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
                              className="inline-flex items-center px-3 py-1 border border-white/20 shadow-sm text-xs font-medium rounded-lg text-white bg-white/5 hover:bg-white/10 transition-colors"
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
                              className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors"
                            >
                              View on Explorer
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Error Message */}
                      {transaction.error && (
                        <div className="mt-2 flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                          <p className="text-sm text-red-300">{transaction.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Status Messages */}
                {batchOperation.status === "completed" && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                      <div>
                        <h4 className="font-medium text-green-300">Operation Completed!</h4>
                        <p className="text-sm text-green-400 mt-1">
                          All transactions have been successfully processed. Your vault balances will update shortly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {batchOperation.status === "failed" && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-400 mr-3" />
                      <div>
                        <h4 className="font-medium text-red-300">Operation Failed</h4>
                        <p className="text-sm text-red-400 mt-1">
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
                      className="px-4 py-2 border border-white/20 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel Remaining
                    </button>
                  )}
                  
                  {canClose && (
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:from-[var(--accent-primary)]/80 hover:to-[var(--accent-secondary)]/80 text-white text-sm font-medium rounded-xl btn-animate"
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
