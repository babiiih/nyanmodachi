import { useCallback, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import type { ShopItem, ShopKind } from "@/lib/shopItems";
import { useOnChainInventory } from "./useOnChainInventory";

export type InventoryRow = {
  item_id: string;
  quantity: number;
};

export function usePlayer() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const wallet = (wallets[0]?.address ?? user?.wallet?.address ?? "").toLowerCase();
  const { items: onChainItems, refresh: refreshOnChain } = useOnChainInventory();

  const [coins, setCoins] = useState<number>(0);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load shop catalog once.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("shop_items")
        .select("id,name,emoji,kind,price,effect,rarity")
        .order("kind")
        .order("price");
      if (data) setShopItems(data as unknown as ShopItem[]);
    })();
  }, []);

  const refreshPlayer = useCallback(async (addr: string) => {
    const { data: player } = await supabase
      .from("players")
      .select("coins")
      .eq("wallet_address", addr)
      .maybeSingle();
    setCoins(player?.coins ?? 0);
    const { data: inv } = await supabase
      .from("inventory")
      .select("item_id,quantity")
      .eq("wallet_address", addr);
    setInventory((inv ?? []) as InventoryRow[]);
  }, []);

  // On wallet connect: upsert player then load state.
  useEffect(() => {
    if (!authenticated || !wallet) return;
    (async () => {
      setLoading(true);
      await supabase
        .from("players")
        .upsert(
          { wallet_address: wallet, last_seen: new Date().toISOString() },
          { onConflict: "wallet_address", ignoreDuplicates: false },
        );
      await refreshPlayer(wallet);
      setLoading(false);
    })();
  }, [authenticated, wallet, refreshPlayer]);

  const buyItem = useCallback(
    async (item: ShopItem) => {
      if (!wallet) throw new Error("Wallet belum terhubung");
      if (coins < item.price) throw new Error("Koin tidak cukup");
      const newCoins = coins - item.price;
      const { error: uerr } = await supabase
        .from("players")
        .update({ coins: newCoins })
        .eq("wallet_address", wallet);
      if (uerr) throw uerr;
      const existing = inventory.find((i) => i.item_id === item.id);
      const nextQty = (existing?.quantity ?? 0) + 1;
      const { error: ierr } = await supabase
        .from("inventory")
        .upsert(
          {
            wallet_address: wallet,
            item_id: item.id,
            quantity: nextQty,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "wallet_address,item_id" },
        );
      if (ierr) throw ierr;
      setCoins(newCoins);
      setInventory((prev) => {
        const others = prev.filter((i) => i.item_id !== item.id);
        return [...others, { item_id: item.id, quantity: nextQty }];
      });
    },
    [wallet, coins, inventory],
  );

  const consumeItem = useCallback(
    async (itemId: string) => {
      if (!wallet) return;
      const existing = inventory.find((i) => i.item_id === itemId);
      if (!existing || existing.quantity <= 0) return;
      const nextQty = existing.quantity - 1;
      await supabase
        .from("inventory")
        .upsert(
          {
            wallet_address: wallet,
            item_id: itemId,
            quantity: nextQty,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "wallet_address,item_id" },
        );
      setInventory((prev) =>
        prev.map((i) => (i.item_id === itemId ? { ...i, quantity: nextQty } : i)),
      );
    },
    [wallet, inventory],
  );

  const earnCoins = useCallback(
    async (amount: number) => {
      if (!wallet || amount <= 0) return;
      const next = coins + amount;
      setCoins(next);
      await supabase
        .from("players")
        .update({ coins: next })
        .eq("wallet_address", wallet);
    },
    [wallet, coins],
  );

  // Map on-chain item IDs to Supabase item IDs
  const CHAIN_TO_SUPABASE: Record<number, string> = {
    1: "fish", 2: "milk", 3: "sushi", 4: "cookie", 5: "shrimp", 6: "treat",
    10: "ribbon", 11: "crown", 12: "scarf", 13: "hat", 14: "glasses",
    20: "yarn", 21: "yarn", 22: "yarn", 23: "feather", 24: "laser",
  };

  // Merge Supabase inventory + on-chain inventory
  const mergedInventory: InventoryRow[] = [...inventory];
  for (const oci of onChainItems) {
    const sbId = CHAIN_TO_SUPABASE[oci.itemId];
    if (!sbId) continue;
    const existing = mergedInventory.find((i) => i.item_id === sbId);
    if (existing) {
      existing.quantity += oci.quantity;
    } else {
      mergedInventory.push({ item_id: sbId, quantity: oci.quantity });
    }
  }

  const inventoryByKind = (kind: ShopKind) =>
    mergedInventory
      .filter((i) => i.quantity > 0)
      .map((i) => ({
        row: i,
        item: shopItems.find((s) => s.id === i.item_id),
      }))
      .filter((x) => x.item?.kind === kind);

  return {
    ready,
    authenticated,
    wallet,
    coins,
    inventory: mergedInventory,
    shopItems,
    loading,
    login,
    logout,
    buyItem,
    consumeItem,
    earnCoins,
    inventoryByKind,
    refreshOnChain,
  };
}
