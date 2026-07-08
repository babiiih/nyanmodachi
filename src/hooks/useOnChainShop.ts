import { useCallback, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { parseEther, formatEther } from "viem";
import { publicClient, createWallet, CONTRACTS } from "@/lib/ritualChain";
import NyanmodachiShopABI from "@/lib/abi/NyanmodachiShop.json";
import NyanmodachiItemsABI from "@/lib/abi/NyanmodachiItems.json";
import NyanmodachiCatsABI from "@/lib/abi/NyanmodachiCats.json";
import type { ShopItem } from "@/lib/shopItems";

export function useOnChainShop() {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = wallets[0];

  // Buy item with RITUAL
  const buyItem = useCallback(async (itemId: number, quantity: number, priceWei: bigint) => {
    if (!wallet) throw new Error("No wallet connected");
    setLoading(true);
    setError(null);
    try {
      const provider = await wallet.getEthereumProvider();
      const client = createWallet({ request: provider.request.bind(provider) as any });

      const totalCost = priceWei * BigInt(quantity);

      const hash = await client.writeContract({
        address: CONTRACTS.SHOP,
        abi: NyanmodachiShopABI,
        functionName: "buyItem",
        args: [BigInt(itemId), BigInt(quantity)],
        value: totalCost,
      });

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Item purchased!", receipt);
      return hash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // Buy with coins
  const buyWithCoins = useCallback(async (itemId: number, quantity: number) => {
    if (!wallet) throw new Error("No wallet connected");
    setLoading(true);
    setError(null);
    try {
      const provider = await wallet.getEthereumProvider();
      const client = createWallet({ request: provider.request.bind(provider) as any });

      const hash = await client.writeContract({
        address: CONTRACTS.SHOP,
        abi: NyanmodachiShopABI,
        functionName: "buyWithCoins",
        args: [BigInt(itemId), BigInt(quantity)],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // Get player balance (coins)
  const getBalance = useCallback(async (address: string) => {
    const result = await publicClient.readContract({
      address: CONTRACTS.SHOP,
      abi: NyanmodachiShopABI,
      functionName: "getPlayerBalance",
      args: [address],
    });
    const [coins, totalSpent, totalEarned] = result as [bigint, bigint, bigint];
    return { coins: Number(coins), totalSpent, totalEarned };
  }, []);

  // Get all items
  const getAllItems = useCallback(async () => {
    const itemIds = await publicClient.readContract({
      address: CONTRACTS.ITEMS,
      abi: NyanmodachiItemsABI,
      functionName: "getAllItemIds",
    }) as bigint[];

    const items: ShopItem[] = [];
    for (const id of itemIds) {
      const item = await publicClient.readContract({
        address: CONTRACTS.ITEMS,
        abi: NyanmodachiItemsABI,
        functionName: "getItem",
        args: [id],
      }) as any;

      items.push({
        id: String(id),
        name: item.name,
        emoji: item.emoji,
        kind: ["food", "accessory", "toy"][item.kind] as any,
        price: Number(formatEther(item.price)),
        effect: {
          hunger: Number(item.hungerEffect),
          mood: Number(item.moodEffect),
          affection: Number(item.affectionEffect),
        },
        rarity: ["common", "rare", "legendary"][item.rarity] as any,
      });
    }
    return items;
  }, []);

  // Get item price in wei
  const getItemPrice = useCallback(async (itemId: number) => {
    const price = await publicClient.readContract({
      address: CONTRACTS.SHOP,
      abi: NyanmodachiShopABI,
      functionName: "getItemPrice",
      args: [BigInt(itemId)],
    });
    return price as bigint;
  }, []);

  return { buyItem, buyWithCoins, getBalance, getAllItems, getItemPrice, loading, error };
}
