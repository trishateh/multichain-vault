'use client'

import { useState, useEffect } from 'react'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <VaultDashboardSkeleton />
  }

  return <VaultDashboardContent />
}

function VaultDashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Wallet Connection Section */}
      <div className="glass-effect rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-medium text-white">
              Wallet Connection
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Connect your wallet to interact with the vault
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="h-10 w-40 bg-white/10 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      <div className="text-center py-8 sm:py-12">
        <div className="glass-effect rounded-xl p-6 sm:p-8">
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">👛</span>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Loading Wallet Connection
          </h3>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            Please wait while we initialize the wallet connection...
          </p>
        </div>
      </div>
    </div>
  )
}

function VaultDashboardContent() {
  const { isConnected } = useAccount()
  const { balances, totalWalletBalance, totalVaultBalance, totalPortfolioValue, isLoading } = useBalances()
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [showBatchDeposit, setShowBatchDeposit] = useState(false)

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Wallet Connection Section */}
      <div className="glass-effect rounded-xl p-4 sm:p-6 glow-effect">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-medium text-white">
              Wallet Connection
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
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
            <div className="glass-effect rounded-xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">
                Portfolio Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 transition-all duration-200 hover:bg-white/10 border border-white/10">
                  <p className="text-xs sm:text-sm font-medium text-slate-400">Total Portfolio Value</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    ${formatNumber(totalPortfolioValue)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 transition-all duration-200 hover:bg-white/10 border border-white/10">
                  <p className="text-xs sm:text-sm font-medium text-slate-400">Total in Wallet</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    ${formatNumber(totalWalletBalance)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 transition-all duration-200 hover:bg-white/10 border border-white/10">
                  <p className="text-xs sm:text-sm font-medium text-slate-400">Total in Vault</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    ${formatNumber(totalVaultBalance)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chain Balances */}
          <div className="glass-effect rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">
              Chain Balances
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {balances.map((balance, index) => (
                balance.isLoading ? (
                  <BalanceCardSkeleton key={balance.chainId} />
                ) : (
                  <div key={balance.chainId} className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all duration-200 hover:bg-white/10 hover:border-[var(--accent-primary)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white">{balance.chainName}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        index === 0 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        Testnet
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Wallet:</span>
                        <span className="text-sm font-medium text-white">
                          {formatNumber(balance.walletBalance)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Vault:</span>
                        <span className="text-sm font-medium text-white">
                          {formatNumber(balance.vaultBalance)} USDC
                        </span>
                      </div>
                    </div>
                    {balance.error && (
                      <p className="text-xs text-red-400 mt-2 animate-pulse">
                        Failed to load balance
                      </p>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-effect rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <button 
                onClick={() => setShowBatchDeposit(true)}
                disabled={isLoading}
                className="w-full sm:col-span-2 lg:col-span-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:from-[var(--accent-primary)]/80 hover:to-[var(--accent-secondary)]/80 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl btn-animate disabled:transform-none disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span className="text-sm sm:text-base">Multi-Chain Batch Deposit</span>
                </span>
              </button>
              <button 
                onClick={() => setIsDepositModalOpen(true)}
                disabled={isLoading}
                className="w-full bg-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/80 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 btn-animate disabled:transform-none disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Single Deposit
              </button>
              <button 
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={isLoading}
                className="w-full border border-white/20 hover:bg-white/5 hover:border-white/30 disabled:bg-gray-700 disabled:border-gray-600 disabled:text-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 btn-animate disabled:transform-none disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Withdraw Funds
              </button>
            </div>
          </div>

          {/* Batch Deposit Section */}
          {showBatchDeposit && (
            <div className="glass-effect rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-medium text-white">
                  Multi-Chain Batch Operations
                </h2>
                <button
                  onClick={() => setShowBatchDeposit(false)}
                  className="text-slate-400 hover:text-white p-1 -m-1 transition-colors"
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
          <div className="glass-effect rounded-xl p-6 sm:p-8">
            <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">👛</span>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
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