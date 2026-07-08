import { useCallback, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";

const ALL_CATS = ["kuro", "miko", "sora", "hana", "yuki"] as const;

// Coin cost to unlock each additional cat
const CAT_COSTS: Record<string, number> = {
  miko: 50,
  sora: 100,
  hana: 150,
  yuki: 200,
};

export function useUnlockedCats(coins: number, setCoins: (n: number) => void) {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const wallet = (wallets[0]?.address ?? user?.wallet?.address ?? "").toLowerCase();

  const [unlocked, setUnlocked] = useState<string[]>(() => {
    if (typeof window === "u") return ["kuro"];
    try {
      const stored = localStorage.getItem("nyanmodachi:unlocked");
      return stored ? JSON.parse(stored) : ["kuro"];
    } catch {
      return ["kuro"];
    }
  });

  // Load from Supabase on login
  useEffect(() => {
    if (!authenticated || !wallet) return;
    (async () => {
      const { data } = await supabase
        .from("unlocked_cats")
        .select("cat_id")
        .eq("wallet_address", wallet);

      if (data && data.length > 0) {
        const ids = data.map((r: any) => r.cat_id);
        setUnlocked(ids);
        localStorage.setItem("nyanmodachi:unlocked", JSON.stringify(ids));
      } else {
        // First time user — unlock kuro
        await supabase.from("unlocked_cats").upsert(
          { wallet_address: wallet, cat_id: "kuro", unlocked_at: new Date().toISOString() },
          { onConflict: "wallet_address,cat_id" },
        );
        setUnlocked(["kuro"]);
        localStorage.setItem("nyanmodachi:unlocked", JSON.stringify(["kuro"]));
      }
    })();
  }, [authenticated, wallet]);

  const buyCat = useCallback(
    async (catId: string) => {
      const cost = CAT_COSTS[catId];
      if (!cost) throw new Error("Kucing tidak tersedia");
      if (unlocked.includes(catId)) throw new Error("Sudah punya kucing ini");
      if (coins < cost) throw new Error(`Butuh ${cost} koin (punya ${coins})`);

      const newCoins = coins - cost;

      // Update coins in Supabase
      if (wallet) {
        await supabase.from("players").update({ coins: newCoins }).eq("wallet_address", wallet);
        await supabase.from("unlocked_cats").upsert(
          { wallet_address: wallet, cat_id: catId, unlocked_at: new Date().toISOString() },
          { onConflict: "wallet_address,cat_id" },
        );
      }

      setCoins(newCoins);
      const next = [...unlocked, catId];
      setUnlocked(next);
      localStorage.setItem("nyanmodachi:unlocked", JSON.stringify(next));
    },
    [wallet, coins, unlocked, setCoins],
  );

  const lockedCats = ALL_CATS.filter((c) => !unlocked.includes(c));

  return { unlocked, lockedCats, buyCat, catCosts: CAT_COSTS };
}
