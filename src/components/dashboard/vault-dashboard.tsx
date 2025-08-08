'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useBalances } from '@/hooks/useBalances'
import { formatNumber } from '@/lib/utils'
import { DepositModal } from '@/components/ui/deposit-modal'
import { WithdrawModal } from '@/components/ui/withdraw-modal'
import { BatchDeposit } from '@/components/batch-deposit/batch-deposit'
import { TransactionHistory } from '@/components/transaction'
import { PortfolioSummarySkeleton, BalanceCardSkeleton } from '@/components/ui/skeleton'

export function VaultDashboard() {
  const { isConnected } = useAccount()
  const { balances, totalWalletBalance, totalVaultBalance, totalPortfolioValue, isLoading } = useBalances()
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [showBatchDeposit, setShowBatchDeposit] = useState(false)

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Wallet Connection Section */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">
              Wallet Connection
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Connect your wallet to interact with the vault
            </p>
          </div>
          <div className="flex-shrink-0">
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      {isConnected ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Portfolio Summary */}
          {isLoading ? (
            <PortfolioSummarySkeleton />
          ) : (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                Portfolio Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 transition-all duration-200 hover:bg-gray-100">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Portfolio Value</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    ${formatNumber(totalPortfolioValue)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 transition-all duration-200 hover:bg-gray-100">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total in Wallet</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    ${formatNumber(totalWalletBalance)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 transition-all duration-200 hover:bg-gray-100">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total in Vault</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    ${formatNumber(totalVaultBalance)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chain Balances */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
              Chain Balances
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {balances.map((balance, index) => (
                balance.isLoading ? (
                  <BalanceCardSkeleton key={balance.chainId} />
                ) : (
                  <div key={balance.chainId} className="border rounded-lg p-4 transition-all duration-200 hover:shadow-md hover:border-gray-300">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{balance.chainName}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        index === 0 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        Testnet
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Wallet:</span>
                        <span className="text-sm font-medium text-gray-500">
                          {formatNumber(balance.walletBalance)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Vault:</span>
                        <span className="text-sm font-medium text-gray-500">
                          {formatNumber(balance.vaultBalance)} USDC
                        </span>
                      </div>
                    </div>
                    {balance.error && (
                      <p className="text-xs text-red-600 mt-2 animate-pulse">
                        Failed to load balance
                      </p>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <button 
                onClick={() => setShowBatchDeposit(true)}
                disabled={isLoading}
                className="w-full sm:col-span-2 lg:col-span-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span className="text-sm sm:text-base">Multi-Chain Batch Deposit</span>
                </span>
              </button>
              <button 
                onClick={() => setIsDepositModalOpen(true)}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Single Deposit
              </button>
              <button 
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={isLoading}
                className="w-full border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Withdraw Funds
              </button>
            </div>
          </div>

          {/* Batch Deposit Section */}
          {showBatchDeposit && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">
                  Multi-Chain Batch Operations
                </h2>
                <button
                  onClick={() => setShowBatchDeposit(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 -m-1"
                  aria-label="Close batch deposit"
                >
                  ✕
                </button>
              </div>
              <BatchDeposit />
            </div>
          )}

          {/* Transaction History */}
          <TransactionHistory />
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <div className="bg-white rounded-lg shadow p-6 sm:p-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">👛</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
              Please connect your wallet to view your portfolio and interact with the vault across multiple chains.
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
      />
      <WithdrawModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setIsWithdrawModalOpen(false)} 
      />
    </div>
  )
}