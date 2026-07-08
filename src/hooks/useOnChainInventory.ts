import { useEffect, useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { createPublicClient, http, type Address } from "viem";

const ITEMS_ADDRESS = "0x7ce5C75197a7cd8094d672439Fb8fCBd40134db1" as Address;
const RITUAL_CHAIN = {
  id: 1979,
  name: "Ritual",
  nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.ritualfoundation.org"] } },
};

const ERC1155_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const ALL_ITEM_IDS = [1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 14, 20, 21, 22, 23, 24];

export type OnChainItem = { itemId: number; quantity: number };

export function useOnChainInventory() {
  const { wallets } = useWallets();
  const wallet = wallets[0]?.address as Address | undefined;
  const [items, setItems] = useState<OnChainItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!wallet) { setItems([]); return; }
    setLoading(true);
    try {
      const client = createPublicClient({ chain: RITUAL_CHAIN, transport: http() });
      const balances = await Promise.all(
        ALL_ITEM_IDS.map(async (id) => {
          const bal = await client.readContract({
            address: ITEMS_ADDRESS,
            abi: ERC1155_ABI,
            functionName: "balanceOf",
            args: [wallet, BigInt(id)],
          });
          return { itemId: id, quantity: Number(bal) };
        })
      );
      setItems(balances.filter((b) => b.quantity > 0));
    } catch (e) {
      console.error("[on-chain] Failed to read inventory:", e);
    }
    setLoading(false);
  }, [wallet]);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, refresh };
}
