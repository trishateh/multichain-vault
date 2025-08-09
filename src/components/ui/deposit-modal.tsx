'use client'

import { useState } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { Modal } from './modal'
import { useVaultOperations } from '@/hooks/useVaultOperations'
import { useBalances } from '@/hooks/useBalances'
import { supportedChains } from '@/lib/config/chains'
import { SupportedChainId } from '@/lib/config/contracts'
import { formatNumber } from '@/lib/utils'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { isConnected } = useAccount()
  const currentChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { balances } = useBalances()
  const { depositWithApproval, isLoading } = useVaultOperations()
  
  const [selectedChainId, setSelectedChainId] = useState<SupportedChainId>(
    supportedChains[0].id as SupportedChainId
  )
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'input' | 'processing' | 'completed'>('input')

  const selectedChain = supportedChains.find(chain => chain.id === selectedChainId)
  const selectedBalance = balances.find(balance => balance.chainId === selectedChainId)
  const maxAmount = selectedBalance?.walletBalance || '0'

  const handleMaxClick = () => {
    setAmount(maxAmount)
  }

  const handleDepositFlow = async () => {
    if (currentChainId !== selectedChainId) {
      try {
        await switchChain({ chainId: selectedChainId })
      } catch (error) {
        console.error('Failed to switch chain:', error)
        return
      }
    }

    setStep('processing')
    const result = await depositWithApproval(selectedChainId, amount)
    
    if (result.success) {
      setStep('completed')
      // Close modal after a short delay to show success
      setTimeout(() => {
        onClose()
        setStep('input')
        setAmount('')
      }, 2000)
    } else {
      // Reset to input on failure
      setStep('input')
    }
  }

  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(maxAmount)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deposit USDC">
      <div className="space-y-4">
        {/* Chain Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Chain
          </label>
          <select
            value={selectedChainId}
            onChange={(e) => setSelectedChainId(Number(e.target.value) as SupportedChainId)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-500"
            disabled={isLoading}
          >
            {supportedChains.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (USDC)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-16 text-gray-700"
              disabled={isLoading}
              step="0.01"
              min="0"
              max={maxAmount}
            />
            <button
              type="button"
              onClick={handleMaxClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700"
              disabled={isLoading}
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Available: {formatNumber(maxAmount)} USDC
          </p>
        </div>

        {/* Current Network Warning */}
        {currentChainId !== selectedChainId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              You&apos;ll be prompted to switch to {selectedChain?.name} network.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          {step === 'input' && (
            <button
              type="button"
              onClick={handleDepositFlow}
              disabled={!isValidAmount || isLoading || !isConnected}
              className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? 'Processing...' : 'Approve & Deposit'}
            </button>
          )}
          
          {step === 'processing' && (
            <button
              type="button"
              disabled
              className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 opacity-50 cursor-not-allowed"
            >
              Processing...
            </button>
          )}
          
          {step === 'completed' && (
            <button
              type="button"
              disabled
              className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 opacity-50 cursor-not-allowed"
            >
              ✅ Completed
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
