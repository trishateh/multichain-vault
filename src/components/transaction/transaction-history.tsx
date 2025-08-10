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
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border border-green-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-300 border border-red-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
      default:
        return 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
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
      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">
          Transaction History
        </h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white">
          Transaction History
        </h2>
        {history.length > 10 && (
          <button className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors">
            View All ({history.length})
          </button>
        )}
      </div>

      {recentTransactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm">
            No transactions yet. Start by making a deposit!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div 
              key={tx.id} 
              className="flex items-center justify-between p-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(tx.status)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-white">
                      {getTypeDisplay(tx.type)}
                    </p>
                    <span className="text-slate-400">•</span>
                    <p className="text-sm text-slate-400">
                      {getChainName(tx.chainId)}
                    </p>
                    {tx.amount && tx.amount !== '0' && (
                      <>
                        <span className="text-slate-400">•</span>
                        <p className="text-sm text-white">
                          {formatNumber(Number(tx.amount))} USDC
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                    <span className="text-xs text-slate-400">
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
                    className="text-slate-400 hover:text-white transition-colors"
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
