import { VaultDashboard } from '@/components/dashboard/vault-dashboard'

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="glass-effect sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">
                Multi-Chain Vault
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <VaultDashboard />
      </main>
    </div>
  );
}
