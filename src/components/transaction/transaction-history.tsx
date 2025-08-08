'use client'

import { useMemo } from 'react'
import { useTransactionStore } from '@/store/transactionStore'
import { formatNumber } from '@/lib/utils'
import { supportedChains } from '@/lib/config/chains'
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export function TransactionHistory() {
  const { history, isLoading } = useTransactionStore()
  
  const recentTransactions = useMemo(() => {
    return history.slice(0, 10) // Show last 10 transactions
  }, [history])

  const getChainName = (chainId: number) => {
    const chain = supportedChains.find(c => c.id === chainId)
    return chain?.name || `Chain ${chainId}`
  }

  const getExplorerUrl = (chainId: number, hash: string) => {
    const chain = supportedChains.find(c => c.id === chainId)
    return chain ? `${chain.blockExplorers?.default.url}/tx/${hash}` : '#'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'approval':
        return 'Approval'
      case 'deposit':
        return 'Deposit'
      case 'withdraw':
        return 'Withdraw'
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Transaction History
        </h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Transaction History
        </h2>
        {history.length > 10 && (
          <button className="text-sm text-blue-600 hover:text-blue-700">
            View All ({history.length})
          </button>
        )}
      </div>

      {recentTransactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            No transactions yet. Start by making a deposit!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div 
              key={tx.id} 
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(tx.status)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {getTypeDisplay(tx.type)}
                    </p>
                    <span className="text-gray-400">•</span>
                    <p className="text-sm text-gray-500">
                      {getChainName(tx.chainId)}
                    </p>
                    {tx.amount && tx.amount !== '0' && (
                      <>
                        <span className="text-gray-400">•</span>
                        <p className="text-sm text-gray-900">
                          {formatNumber(Number(tx.amount) / 1e6)} USDC
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              
              {tx.hash && (
                <div className="flex-shrink-0">
                  <a
                    href={getExplorerUrl(tx.chainId, tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="View on explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
