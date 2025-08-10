'use client'

import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { Modal } from './modal'
import { useBalances } from '@/hooks/useBalances'
import { supportedChains } from '@/lib/config/chains'
import { SupportedChainId } from '@/lib/config/contracts'
import { formatNumber } from '@/lib/utils'
import { BatchProgressModal } from '@/components/batch-deposit/batch-progress-modal'
import { useBatchOperations } from '@/hooks/useBatchOperations'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { isConnected } = useAccount()
  const currentChainId = useChainId()
  const { balances } = useBalances()
  const {
    isExecuting,
    batchFlowState,
    batchSteps,
    currentStepIndex,
    executeWithdrawOperation,
    cancelBatch,
    retryStep,
  } = useBatchOperations()
  
  const [selectedChainId, setSelectedChainId] = useState<SupportedChainId>(
    supportedChains[0].id as SupportedChainId
  )
  const [amount, setAmount] = useState('')
  const [showProgressModal, setShowProgressModal] = useState(false)

  const selectedChain = supportedChains.find(chain => chain.id === selectedChainId)
  const selectedBalance = balances.find(balance => balance.chainId === selectedChainId)
  const maxAmount = selectedBalance?.vaultBalance || '0'

  const handleMaxClick = () => {
    setAmount(maxAmount)
  }

  const handleStart = async () => {
    setShowProgressModal(true)
    onClose()
    await executeWithdrawOperation({ chainId: selectedChainId, amount })
  }

  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(maxAmount)

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw USDC">
      <div className="space-y-4">
        {/* Chain Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Select Chain
          </label>
          <select
            value={selectedChainId}
            onChange={(e) => setSelectedChainId(Number(e.target.value) as SupportedChainId)}
            className="w-full rounded-xl bg-white/5 border border-white/10 text-white focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)] focus:ring-1 focus:outline-none transition-colors"
            disabled={isExecuting}
          >
            {supportedChains.map((chain) => (
              <option key={chain.id} value={chain.id} className="bg-slate-800 text-white">
                {chain.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Amount (USDC)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)] focus:ring-1 focus:outline-none pr-16 transition-colors"
              disabled={isExecuting}
              step="0.01"
              min="0"
              max={maxAmount}
            />
            <button
              type="button"
              onClick={handleMaxClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors"
              disabled={isExecuting}
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Available in vault: {formatNumber(maxAmount)} USDC
          </p>
        </div>

        {/* Current Network Warning */}
        {currentChainId !== selectedChainId && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
            <p className="text-sm text-orange-300">
              You&apos;ll be prompted to switch to {selectedChain?.name} network.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-white/20 rounded-xl text-sm font-medium text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer transition-colors"
            disabled={isExecuting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={!isValidAmount || isExecuting || !isConnected}
            className="flex-1 py-2 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all btn-animate"
          >
            {isExecuting ? 'Processing...' : 'Withdraw'}
          </button>
        </div>
      </div>
    </Modal>
    <BatchProgressModal
      title="Withdraw Progress"
      isOpen={showProgressModal}
      onClose={() => {
        // allow close only when done/failed inside the modal
        setShowProgressModal(false)
        setAmount('')
      }}
      batchOperation={{
        id: 'withdraw-single',
        deposits: [],
        status: (batchFlowState === 'executing' ? 'in_progress' : batchFlowState) as any,
        currentStep: currentStepIndex + 1,
        totalSteps: batchSteps.length,
        transactions: batchSteps.map((s) => ({
          chainId: s.chainId,
          type: s.type,
          status: s.status === 'wallet-pending' || s.status === 'confirming' ? 'in_progress' : (s.status as any),
          amount: s.amount,
        }))
      }}
      onRetryTransaction={(chainId, type) => {
        retryStep(chainId as SupportedChainId, type as any)
      }}
      onCancelBatch={() => {
        cancelBatch()
        setShowProgressModal(false)
      }}
    />
    </>
  )
}
