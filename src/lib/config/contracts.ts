import { sepolia, seiTestnet } from "./chains";

export const VAULT_ADDRESS =
  "0xaaaac415c0719cff6BAe3816FE244589442db46C" as const;

export const USDC_ADDRESSES = {
  [sepolia.id]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const,
  [seiTestnet.id]: "0x4fCF1784B31630811181f670Aea7A7bEF803eaED" as const,
} as const;

export const CONTRACT_ADDRESSES = {
  [sepolia.id]: {
    vault: VAULT_ADDRESS,
    usdc: USDC_ADDRESSES[sepolia.id],
  },
  [seiTestnet.id]: {
    vault: VAULT_ADDRESS,
    usdc: USDC_ADDRESSES[seiTestnet.id],
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;
