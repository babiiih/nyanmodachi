import { useState, useEffect } from "react";
import { toast } from "sonner";
import { usePlayer } from "@/hooks/usePlayer";
import { useOnChainShop } from "@/hooks/useOnChainShop";
import { RARITY_STYLES, type ShopKind } from "@/lib/shopItems";

const TABS: { id: ShopKind; label: string; icon: string }[] = [
  { id: "food", label: "Makanan", icon: "🍽️" },
  { id: "accessory", label: "Aksesoris", icon: "🎩" },
  { id: "toy", label: "Mainan", icon: "🧶" },
];

// Map Supabase item IDs to on-chain item IDs
const ON_CHAIN_MAP: Record<string, number> = {
  fish: 1, milk: 2, sushi: 3, cookie: 4, shrimp: 5, treat: 6,
  hat: 13, scarf: 12, crown: 11, ribbon: 10, glasses: 14, pumpkin: 13,
  yarn: 21, yoyo: 20, lure: 24,
};

export function Shop({ onClose }: { onClose: () => void }) {
  const { authenticated, coins, shopItems, buyItem, login } = usePlayer();
  const { buyItem: buyOnChain, loading: chainLoading } = useOnChainShop();
  const [tab, setTab] = useState<ShopKind>("food");
  const [chainItems, setChainItems] = useState<any[]>([]);
  const items = shopItems.filter((i) => i.kind === tab);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: "rgba(58, 46, 34, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-accent/50 bg-card text-card-foreground shadow-2xl sm:rounded-3xl"
        style={{ boxShadow: "0 20px 60px -20px rgba(80,55,30,0.55)" }}
      >
        <div
          className="flex items-center justify-between border-b border-border px-5 py-4"
          style={{ background: "linear-gradient(180deg, oklch(0.94 0.014 82), oklch(0.90 0.018 82))" }}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/15 text-lg">
              🛒
            </span>
            <div className="leading-tight">
              <div className="font-display text-base font-bold uppercase tracking-wider text-foreground">
                Toko
              </div>
              <div className="text-[10px] text-muted-foreground">
                barang cozy untuk kucingmu
              </div>
            </div>
            <span className="ml-2 flex items-center gap-1 rounded-full border border-accent/50 bg-background px-2.5 py-1 text-xs font-bold">
              <span aria-hidden>🪙</span>
              <span className="font-display tabular-nums">{coins}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1.5 border-b border-border bg-background/60 px-3 py-2.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wider transition font-display ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {!authenticated && (
          <div className="p-8 text-center">
            <div className="mb-3 text-4xl">🔒</div>
            <p className="mb-4 text-sm text-muted-foreground">
              Hubungkan wallet dulu untuk berbelanja.
            </p>
            <button
              onClick={login}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-md transition hover:brightness-110 font-display"
            >
              🔗 Connect Wallet
            </button>
          </div>
        )}

        {authenticated && (
          <div className="max-h-[60vh] overflow-y-auto bg-background/40 p-3">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {items.map((item) => {
                const cantAfford = coins < item.price;
                const chainId = ON_CHAIN_MAP[item.id];
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col items-center rounded-2xl border border-border bg-card p-3 text-center shadow-sm ring-1 ${RARITY_STYLES[item.rarity]}`}
                  >
                    <div className="text-4xl leading-none">{item.emoji}</div>
                    <div className="mt-2 text-xs font-semibold text-foreground">
                      {item.name}
                    </div>
                    <div className="mt-0.5 min-h-[14px] text-[10px] text-muted-foreground">
                      {item.effect.hunger ? `+${item.effect.hunger} 🍽️ ` : ""}
                      {item.effect.mood ? `+${item.effect.mood} 😺 ` : ""}
                      {item.effect.affection ? `+${item.effect.affection} 💖` : ""}
                      {item.kind === "accessory" ? "kosmetik" : ""}
                    </div>

                    {/* Coins buy */}
                    <button
                      disabled={cantAfford}
                      onClick={async () => {
                        try {
                          await buyItem(item);
                          toast.success(`Beli ${item.emoji} ${item.name}`);
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-primary px-2 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                    >
                      <span aria-hidden>🪙</span>
                      <span className="font-display tabular-nums">{item.price}</span>
                    </button>

                    {/* On-chain buy with RITUAL */}
                    {chainId && (
                      <button
                        disabled={chainLoading}
                        onClick={async () => {
                          try {
                            const priceWei = BigInt(
                              Math.round(
                                { fish: 0.001, milk: 0.0005, sushi: 0.002, cookie: 0.0008, shrimp: 0.0015, treat: 0.003,
                                  ribbon: 0.005, crown: 0.05, scarf: 0.003, hat: 0.01, glasses: 0.008,
                                  yarn: 0.001, yoyo: 0.002, lure: 0.005,
                                  pumpkin: 0.01, bowtie: 0.008 }[item.id] * 1e18
                              ).toString()
                            );
                            const hash = await buyOnChain(chainId, 1, priceWei);
                            toast.success(`On-chain: ${item.emoji} ${item.name}`);
                          } catch (e) {
                            toast.error((e as Error).message);
                          }
                        }}
                        className="mt-1 flex w-full items-center justify-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
                      >
                        <span aria-hidden>⛓️</span>
                        <span className="font-display">RITUAL</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
