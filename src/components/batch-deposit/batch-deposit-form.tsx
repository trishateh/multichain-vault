"use client";

import { useState, useMemo } from "react";
// formatUnits not needed since balance is already formatted
import { useAccount } from "wagmi";
import { useBalances } from "@/hooks/useBalances";
import { SupportedChainId } from "@/lib/config/contracts";
import { formatNumber } from "@/lib/utils";
import { ArrowRight, DollarSign } from "lucide-react";

interface BatchDepositInput {
  chainId: SupportedChainId;
  amount: string;
}

interface BatchDepositFormProps {
  onSubmit: (deposits: BatchDepositInput[]) => void;
  isLoading?: boolean;
}

export function BatchDepositForm({ onSubmit, isLoading = false }: BatchDepositFormProps) {
  const { isConnected } = useAccount();
  const { balances } = useBalances();
  
  const [deposits, setDeposits] = useState<BatchDepositInput[]>([
    { chainId: 11155111, amount: "" }, // Sepolia
    { chainId: 1328, amount: "" }, // Sei Testnet
  ]);

  const [errors, setErrors] = useState<Record<number, string>>({});

  // Calculate totals and validation
  const { totalAmount, hasValidAmounts, chainBalances } = useMemo(() => {
    let total = 0;
    let hasValid = false;
    const balanceMap: Record<number, { wallet: number; max: number }> = {};

    // Build balance map
    balances.forEach((balance) => {
      const walletBalance = parseFloat(balance.walletBalance);
      balanceMap[balance.chainId] = {
        wallet: walletBalance,
        max: walletBalance,
      };
    });

    // Calculate totals and validate
    deposits.forEach((deposit) => {
      const amount = parseFloat(deposit.amount || "0");
      if (amount > 0) {
        total += amount;
        hasValid = true;
      }
    });

    return {
      totalAmount: total,
      hasValidAmounts: hasValid,
      chainBalances: balanceMap,
    };
  }, [deposits, balances]);

  const updateAmount = (chainId: SupportedChainId, amount: string) => {
    // Allow only numbers and decimal point
    if (amount && !/^\d*\.?\d*$/.test(amount)) return;

    setDeposits((prev) =>
      prev.map((deposit) =>
        deposit.chainId === chainId ? { ...deposit, amount } : deposit
      )
    );

    // Clear error when user starts typing
    if (errors[chainId]) {
      setErrors((prev) => ({ ...prev, [chainId]: "" }));
    }
  };

  const setMaxAmount = (chainId: SupportedChainId) => {
    const balance = chainBalances[chainId];
    if (balance) {
      updateAmount(chainId, balance.max.toString());
    }
  };

  const validateAndSubmit = () => {
    const newErrors: Record<number, string> = {};
    const validDeposits: BatchDepositInput[] = [];

    deposits.forEach((deposit) => {
      const amount = parseFloat(deposit.amount || "0");
      const balance = chainBalances[deposit.chainId];

      if (amount <= 0) {
        return; // Skip empty amounts
      }

      if (!balance) {
        newErrors[deposit.chainId] = "Balance data not available";
        return;
      }

      if (amount > balance.max) {
        newErrors[deposit.chainId] = `Insufficient balance. Max: ${balance.max} USDC`;
        return;
      }

      validDeposits.push(deposit);
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && validDeposits.length > 0) {
      onSubmit(validDeposits);
    }
  };

  const getChainName = (chainId: SupportedChainId) => {
    return chainId === 11155111 ? "Sepolia" : "Sei Testnet";
  };

  const getChainColor = (chainId: SupportedChainId) => {
    return chainId === 11155111 ? "blue" : "purple";
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please connect your wallet to use batch deposit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Multi-Chain Batch Deposit
        </h2>
        <p className="text-gray-600">
          Deposit USDC across multiple chains in a single transaction flow
        </p>
      </div>

      {/* Deposit Inputs */}
      <div className="space-y-4">
        {deposits.map((deposit) => {
          const chainName = getChainName(deposit.chainId);
          const chainColor = getChainColor(deposit.chainId);
          const balance = chainBalances[deposit.chainId];
          const error = errors[deposit.chainId];

          return (
            <div
              key={deposit.chainId}
              className={`border-2 rounded-lg p-4 transition-colors ${
                error
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Chain Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      chainColor === "blue"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {chainName}
                  </span>
                  <span className="text-sm text-gray-500">Testnet</span>
                </div>
                {balance && (
                  <div className="text-sm text-gray-600">
                    Available: {formatNumber(balance.wallet)} USDC
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={deposit.amount}
                    onChange={(e) => updateAmount(deposit.chainId, e.target.value)}
                    placeholder="0.00"
                    className={`block w-full pl-9 pr-16 py-2 border rounded-md shadow-sm focus:ring-2 focus:border-transparent ${
                      error
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-sm text-gray-500">USDC</span>
                  </div>
                </div>

                {/* Max Button */}
                {balance && balance.max > 0 && (
                  <button
                    type="button"
                    onClick={() => setMaxAmount(deposit.chainId)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Max: {formatNumber(balance.max)} USDC
                  </button>
                )}

                {/* Error Message */}
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {totalAmount > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Total Deposit:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatNumber(totalAmount)} USDC
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            This will require{" "}
            {deposits.filter((d) => parseFloat(d.amount || "0") > 0).length * 2}{" "}
            transactions (approval + deposit for each chain)
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={validateAndSubmit}
        disabled={!hasValidAmounts || isLoading}
        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
          hasValidAmounts && !isLoading
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>Execute Batch Deposit</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
