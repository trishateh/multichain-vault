# Multi-Chain Vault Frontend

A modern Web3 frontend application that interacts with SimpleVault smart contracts deployed across multiple EVM chains, featuring multi-chain batch operations.

## 🚀 Features

- **Multi-Wallet Support**: Connect with MetaMask, WalletConnect, and other popular wallets via RainbowKit
- **Multi-Chain Dashboard**: View USDC balances across Sepolia and Sei Testnet
- **Batch Operations**: Deposit funds across multiple chains in a single guided flow
- **Transaction History**: View recent transactions with status indicators and explorer links
- **Real-time Updates**: Live transaction status and balance updates
- **Loading States**: Skeleton loaders and smooth animations throughout the app
- **Mobile Responsive**: Optimized for mobile, tablet, and desktop devices
- **Error Boundaries**: Graceful error handling with user-friendly error messages
- **Modern UI**: Clean, professional interface with hover effects and transitions

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Web3**: wagmi + viem for blockchain interactions
- **Wallet Connection**: RainbowKit
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod validation
- **Notifications**: react-hot-toast

## 📦 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd vault-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp env.example .env.local
```

4. Update `.env.local` with your configuration:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 🌐 Supported Networks

### Sepolia (Ethereum Testnet)

- **Chain ID**: 11155111
- **RPC**: https://ethereum-sepolia-rpc.publicnode.com
- **Vault Contract**: `0xaaaac415c0719cff6BAe3816FE244589442db46C`
- **USDC Contract**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

### Sei Testnet

- **Chain ID**: 1328
- **RPC**: https://evm-rpc-testnet.sei-apis.com
- **Vault Contract**: `0xaaaac415c0719cff6BAe3816FE244589442db46C`
- **USDC Contract**: `0x4fCF1784B31630811181f670Aea7A7bEF803eaED`

## 🔧 Configuration

### WalletConnect Setup

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Add it to your `.env.local` file

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components (modals, skeleton, error boundary)
│   ├── wallet/           # Wallet connection components
│   ├── dashboard/        # Dashboard components
│   ├── batch-deposit/    # Batch operation components
│   ├── transaction/      # Transaction history components
│   └── providers.tsx     # Web3 providers setup
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── contracts/        # Contract ABIs and addresses
│   ├── config/           # App configuration
│   └── utils/            # Helper functions
├── store/                # Zustand stores
└── types/                # TypeScript type definitions
```

## 🧪 Testing

### Get Test Tokens

1. **Sepolia ETH**: https://sepoliafaucet.com/
2. **Sei Testnet**: https://atlantic-2.app.sei.io/faucet
3. **Test USDC**: https://faucet.circle.com/
4. **Transfer Testnet USDC Crosschain**: https://github.com/trishateh/cctp-v2-transfer

### Test the Application

1. Connect your wallet
2. Switch to Sepolia or Sei Testnet
3. Get test tokens from faucets
4. Try depositing and withdrawing from the vault
