"use client";

import { create } from "zustand";
import { type Address } from "viem";
import {
  Transaction,
  BatchOperation,
  TransactionHistoryState,
  TransactionStatus,
} from "@/types";

interface TransactionStore extends TransactionHistoryState {
  // Actions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  clearHistory: () => void;

  // Batch operations
  startBatchOperation: (operation: BatchOperation) => void;
  updateBatchOperation: (updates: Partial<BatchOperation>) => void;
  updateTransactionStatus: (
    chainId: number,
    type: string,
    updates: Partial<TransactionStatus>
  ) => void;
  completeBatchOperation: () => void;
  cancelBatchOperation: () => void;

  // Getters
  getPendingTransactions: () => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  // Initial state
  history: [],
  pendingBatch: null,
  isLoading: false,

  // Actions
  addTransaction: (transaction) =>
    set((state) => ({
      history: [transaction, ...state.history].slice(0, 50), // Keep last 50 transactions
    })),

  updateTransaction: (id, updates) =>
    set((state) => ({
      history: state.history.map((tx) =>
        tx.id === id ? { ...tx, ...updates } : tx
      ),
    })),

  clearHistory: () =>
    set({
      history: [],
    }),

  // Batch operations
  startBatchOperation: (operation) =>
    set({
      pendingBatch: operation,
      isLoading: true,
    }),

  updateBatchOperation: (updates) =>
    set((state) => ({
      pendingBatch: state.pendingBatch
        ? { ...state.pendingBatch, ...updates }
        : null,
    })),

  updateTransactionStatus: (chainId, type, updates) =>
    set((state) => {
      if (!state.pendingBatch) return state;

      const updatedTransactions = state.pendingBatch.transactions.map((tx) =>
        tx.chainId === chainId && tx.type === type ? { ...tx, ...updates } : tx
      );

      return {
        pendingBatch: {
          ...state.pendingBatch,
          transactions: updatedTransactions,
        },
      };
    }),

  completeBatchOperation: () =>
    set((state) => {
      // Add completed transactions to history
      if (state.pendingBatch) {
        const completedTransactions: Transaction[] =
          state.pendingBatch.transactions
            .filter((tx) => tx.status === "completed" && tx.hash)
            .map((tx) => ({
              id: `${tx.chainId}-${tx.type}-${Date.now()}`,
              chainId: tx.chainId,
              type: tx.type as "approval" | "deposit" | "withdraw",
              hash: tx.hash!,
              amount: tx.amount || "0",
              token: "0x" as Address, // Will be set properly when creating transaction
              timestamp: Date.now(),
              status: "completed" as const,
            }));

        return {
          pendingBatch: null,
          isLoading: false,
          history: [...completedTransactions, ...state.history].slice(0, 50),
        };
      }

      return {
        pendingBatch: null,
        isLoading: false,
      };
    }),

  cancelBatchOperation: () =>
    set({
      pendingBatch: null,
      isLoading: false,
    }),

  // Getters
  getPendingTransactions: () =>
    get().history.filter((tx) => tx.status === "pending"),

  getRecentTransactions: (limit = 10) => get().history.slice(0, limit),
}));
