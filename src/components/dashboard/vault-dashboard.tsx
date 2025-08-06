'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

export function VaultDashboard() {
  const { isConnected } = useAccount()

  return (
    <div className="space-y-8">
      {/* Wallet Connection Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Wallet Connection
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Connect your wallet to interact with the vault
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>

      {/* Main Dashboard Content */}
      {isConnected ? (
        <div className="space-y-6">
          {/* Portfolio Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Portfolio Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">$0.00</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">Total in Wallet</p>
                <p className="text-2xl font-bold text-gray-900">$0.00</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">Total in Vault</p>
                <p className="text-2xl font-bold text-gray-900">$0.00</p>
              </div>
            </div>
          </div>

          {/* Chain Balances */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Chain Balances
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sepolia */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Sepolia</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Testnet
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Wallet:</span>
                    <span className="text-sm font-medium">0 USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Vault:</span>
                    <span className="text-sm font-medium">0 USDC</span>
                  </div>
                </div>
              </div>

              {/* Sei Testnet */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Sei Testnet</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Testnet
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Wallet:</span>
                    <span className="text-sm font-medium">0 USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Vault:</span>
                    <span className="text-sm font-medium">0 USDC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Multi-Chain Batch Deposit
              </button>
              <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors">
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Please connect your wallet to view your portfolio and interact with the vault.
          </p>
        </div>
      )}
    </div>
  )
}