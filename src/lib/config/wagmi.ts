import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { supportedChains } from "./chains";

// Get project ID from environment or use a placeholder for development
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

export const wagmiConfig = getDefaultConfig({
  appName: "Multi-Chain Vault",
  projectId,
  chains: supportedChains,
  ssr: true, // Enable for Next.js SSR
});
