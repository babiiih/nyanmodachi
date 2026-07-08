import { useCallback, useState, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth";
import { publicClient, createWallet, CONTRACTS } from "@/lib/ritualChain";
import NyanmodachiCatsABI from "@/lib/abi/NyanmodachiCats.json";

export type OnChainCat = {
  hunger: number;
  mood: number;
  affection: number;
  stage: number; // 0=baby, 1=young, 2=adult, 3=bonded, 4=legend
  lastFed: bigint;
  lastPetted: bigint;
  exists: boolean;
};

export function useOnChainCats() {
  const { wallets } = useWallets();
  const [cats, setCats] = useState<OnChainCat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = wallets[0];

  // Initialize cats
  const initCats = useCallback(async () => {
    if (!wallet) throw new Error("No wallet connected");
    setLoading(true);
    try {
      const provider = await wallet.getEthereumProvider();
      const client = createWallet({ request: provider.request.bind(provider) as any });

      const hash = await client.writeContract({
        address: CONTRACTS.CATS,
        abi: NyanmodachiCatsABI,
        functionName: "initCats",
      });

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // Get all cats for player
  const getPlayerCats = useCallback(async (address: string) => {
    const result = await publicClient.readContract({
      address: CONTRACTS.CATS,
      abi: NyanmodachiCatsABI,
      functionName: "getPlayerCats",
      args: [address],
    });

    const rawCats = result as any[];
    const parsed: OnChainCat[] = rawCats.map(c => ({
      hunger: Number(c.hunger),
      mood: Number(c.mood),
      affection: Number(c.affection),
      stage: Number(c.stage),
      lastFed: c.lastFed,
      lastPetted: c.lastPetted,
      exists: c.exists,
    }));

    setCats(parsed);
    return parsed;
  }, []);

  // Feed cat
  const feedCat = useCallback(async (catId: number, itemId: number, hungerEffect: number, moodEffect: number, affectionEffect: number) => {
    if (!wallet) throw new Error("No wallet connected");
    setLoading(true);
    setError(null);
    try {
      const provider = await wallet.getEthereumProvider();
      const client = createWallet({ request: provider.request.bind(provider) as any });

      const hash = await client.writeContract({
        address: CONTRACTS.CATS,
        abi: NyanmodachiCatsABI,
        functionName: "feedCat",
        args: [catId, BigInt(itemId), hungerEffect, moodEffect, affectionEffect],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // Pet cat
  const petCat = useCallback(async (catId: number) => {
    if (!wallet) throw new Error("No wallet connected");
    setLoading(true);
    setError(null);
    try {
      const provider = await wallet.getEthereumProvider();
      const client = createWallet({ request: provider.request.bind(provider) as any });

      const hash = await client.writeContract({
        address: CONTRACTS.CATS,
        abi: NyanmodachiCatsABI,
        functionName: "petCat",
        args: [catId],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  return { cats, initCats, getPlayerCats, feedCat, petCat, loading, error };
}
