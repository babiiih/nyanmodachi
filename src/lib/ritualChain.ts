import { defineChain, createPublicClient, createWalletClient, http, custom } from "viem";

// Ritual Chain config
export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual",
  nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.ritualfoundation.org"] } },
  blockExplorers: { default: { name: "Ritual Explorer", url: "https://explorer.ritualfoundation.org" } },
  testnet: true,
});

// Contract addresses (deployed)
export const CONTRACTS = {
  ITEMS: "0x7ce5C75197a7cd8094d672439Fb8fCBd40134db1" as const,
  CATS: "0xe593f166A3e26F8BF90223784817aa76169e890c" as const,
  SHOP: "0xC699558883fe5500bB2Dc6AC33f4230fd79Eb858" as const,
};

// Public client for reads
export const publicClient = createPublicClient({
  chain: ritualChain,
  transport: http("https://rpc.ritualfoundation.org"),
});

// Wallet client (requires provider)
export function createWallet(transport: any) {
  return createWalletClient({
    chain: ritualChain,
    transport,
  });
}
