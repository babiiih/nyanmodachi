import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import kuroUrl from "@/assets/cat-kuro.png";
import mikoUrl from "@/assets/cat-miko.png";
import soraUrl from "@/assets/cat-sora.png";
import hanaUrl from "@/assets/cat-hana.png";
import yukiUrl from "@/assets/cat-yuki.png";
import roomBgUrl from "@/assets/room-bg.png";
import { useCatStatuses } from "@/hooks/useCatStatuses";
import { CatStatusPanel } from "@/components/CatStatusPanel";
import { HeartParticles } from "@/components/HeartParticles";
import { FeedParticles } from "@/components/FeedParticles";
import { CatAccessory } from "@/components/CatAccessory";
import { WalletButton } from "@/components/WalletButton";
import { CoinBadge } from "@/components/CoinBadge";
import { Shop } from "@/components/Shop";
import { usePlayer } from "@/hooks/usePlayer";
import { useUnlockedCats } from "@/hooks/useUnlockedCats";
import { playFeed, playPet, playAlert } from "@/lib/sounds";
import { stageFor } from "@/lib/evolution";
import { getFood, type FoodId } from "@/lib/foods";

type CatDef = { id: string; name: string; url: string };

const CATS: CatDef[] = [
  { id: "kuro", name: "Kuro", url: kuroUrl },
  { id: "miko", name: "Miko", url: mikoUrl },
  { id: "sora", name: "Sora", url: soraUrl },
  { id: "hana", name: "Hana", url: hanaUrl },
  { id: "yuki", name: "Yuki", url: yukiUrl },
];

const SPRITE = 128;
const SPEED = 45;
const PANEL_RESERVE = 190;

type CatState = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  facing: 1 | -1;
  waitUntil: number;
};

function randTarget(w: number, h: number) {
  const pad = SPRITE / 2 + 12;
  const usableH = Math.max(pad * 2 + 1, h - PANEL_RESERVE);
  return {
    x: pad + Math.random() * Math.max(1, w - pad * 2),
    y: pad + Math.random() * Math.max(1, usableH - pad * 2),
  };
}

export function CatRoom() {
  const roomRef = useRef<HTMLDivElement>(null);
  const spriteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const statesRef = useRef<CatState[]>([]);
  const [ready, setReady] = useState(false);
  const { cats, feed, pet, isNight, toggleNight } = useCatStatuses();
  const { earnCoins, authenticated, coins } = usePlayer();
  const { unlocked, lockedCats, buyCat, catCosts } = useUnlockedCats(coins, (n: number) => {});
  const [shopOpen, setShopOpen] = useState(false);
  const [catShopOpen, setCatShopOpen] = useState(false);
  const isNightRef = useRef(isNight);
  useEffect(() => {
    isNightRef.current = isNight;
  }, [isNight]);

  const [petTrigger, setPetTrigger] = useState<Record<string, number>>({});
  const [bounceTrigger, setBounceTrigger] = useState<Record<string, number>>({});
  const [shakeTrigger, setShakeTrigger] = useState<Record<string, number>>({});
  const petCooldown = useRef<Record<string, number>>({});
  const [feedTrigger, setFeedTrigger] = useState<Record<string, number>>({});
  const alertCooldown = useRef<Record<string, number>>({});
  const prevStageRef = useRef<Record<string, number>>({});

  const nameOf = (id: string) => CATS.find((c) => c.id === id)?.name ?? id;

  const handlePet = (id: string) => {
    if (isNight) return;
    const now = performance.now();
    if ((petCooldown.current[id] ?? 0) > now) return;
    petCooldown.current[id] = now + 800;
    pet(id);
    playPet();
    if (authenticated) void earnCoins(1);
    setPetTrigger((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
    setBounceTrigger((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  };

  const handleFeed = (id: string, foodId: FoodId) => {
    const reaction = feed(id, foodId);
    playFeed();
    const food = getFood(foodId);
    setBounceTrigger((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
    if (reaction === "dislike") {
      setShakeTrigger((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
      toast(`${nameOf(id)} tidak suka ${food.emoji} 😾`, { duration: 2000 });
    } else if (reaction === "favorite") {
      setFeedTrigger((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
      setPetTrigger((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
      toast.success(`${nameOf(id)} suka banget ${food.emoji}! 💖`, { duration: 2000 });
    } else {
      setFeedTrigger((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
      toast.success(`${nameOf(id)} makan ${food.emoji}`, { duration: 1600 });
    }
  };

  // Low hunger/mood alerts (throttled).
  useEffect(() => {
    const now = Date.now();
    cats.forEach((c) => {
      const check = (key: string, cond: boolean, msg: string, emoji: string) => {
        if (!cond) return;
        const k = `${c.id}:${key}`;
        if ((alertCooldown.current[k] ?? 0) > now) return;
        alertCooldown.current[k] = now + 90_000;
        playAlert();
        toast(`${emoji} ${nameOf(c.id)} ${msg}`, { duration: 3500 });
      };
      check("hunger", c.hunger < 25, "mulai lapar!", "🍽️");
      check("mood", c.mood < 25, "sedang murung...", "😿");
    });
  }, [cats]);

  // Evolution stage-up alerts.
  useEffect(() => {
    cats.forEach((c) => {
      const stage = stageFor(c.affection);
      const prev = prevStageRef.current[c.id];
      if (prev !== undefined && stage.index > prev) {
        toast(`${nameOf(c.id)} naik jadi ${stage.label}! ${stage.accessory ?? "✨"}`, {
          duration: 2600,
        });
        setBounceTrigger((p) => ({ ...p, [c.id]: (p[c.id] ?? 0) + 1 }));
      }
      prevStageRef.current[c.id] = stage.index;
    });
  }, [cats]);

  const handleToggleNight = () => {
    toggleNight();
    toast(
      !isNight
        ? "🌙 Lampu dimatikan, kucing tidur 😴"
        : "☀️ Selamat pagi! Kucing bangun",
      { duration: 1800 },
    );
  };

  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;
    const rect = room.getBoundingClientRect();
    statesRef.current = CATS.map(() => {
      const p = randTarget(rect.width, rect.height);
      const t = randTarget(rect.width, rect.height);
      return {
        x: p.x,
        y: p.y,
        tx: t.x,
        ty: t.y,
        facing: t.x >= p.x ? 1 : -1,
        waitUntil: 0,
      };
    });
    setReady(true);

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r = room.getBoundingClientRect();
      const sleeping = isNightRef.current;

      statesRef.current.forEach((s, i) => {
        if (!sleeping && now >= s.waitUntil) {
          const dx = s.tx - s.x;
          const dy = s.ty - s.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 2) {
            s.waitUntil = now + 800 + Math.random() * 2200;
            const t = randTarget(r.width, r.height);
            s.tx = t.x;
            s.ty = t.y;
            s.facing = s.tx >= s.x ? 1 : -1;
          } else {
            const step = SPEED * dt;
            s.x += (dx / dist) * step;
            s.y += (dy / dist) * step;
          }
        }

        const el = spriteRefs.current[i];
        if (el) {
          const bob = sleeping ? 0 : now < s.waitUntil ? 0 : Math.sin(now / 120) * 3;
          el.style.transform = `translate3d(${s.x - SPRITE / 2}px, ${
            s.y - SPRITE / 2 + bob
          }px, 0)`;
          el.style.zIndex = String(Math.floor(s.y));
        }
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={roomRef}
      className="relative w-full h-[100dvh] overflow-hidden"
      style={{
        backgroundColor: "#000",
        backgroundImage: `url(${roomBgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: isNight
            ? "linear-gradient(180deg, rgba(30,25,55,0.55), rgba(20,15,40,0.75))"
            : "linear-gradient(180deg, rgba(58,46,34,0.05), rgba(58,46,34,0.18))",
        }}
      />
      {isNight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-fade-in"
          style={{ background: "rgba(30, 25, 55, 0.35)" }}
        />
      )}

      <div className="pin absolute top-4 left-4 z-[9999] flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-sm" aria-hidden>
          🐾
        </span>
        <div className="leading-tight">
          <div className="font-display text-xs font-bold uppercase tracking-[0.14em] text-foreground">
            Nyanmodachi
          </div>
          <div className="text-[10px] text-muted-foreground">
            {isNight ? "shhh, kucing tidur" : "klik kucing untuk mengelus"}
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-[9999] flex flex-wrap items-center justify-end gap-2">
        <CoinBadge />
        <WalletButton />
        <button
          type="button"
          onClick={() => setShopOpen(true)}
          aria-label="Buka toko"
          className="pin pin-hover flex h-10 w-10 items-center justify-center rounded-full text-lg"
        >
          🛒
        </button>
        {lockedCats.length > 0 && (
          <button
            type="button"
            onClick={() => setCatShopOpen(true)}
            aria-label="Beli kucing baru"
            className="pin pin-hover flex h-10 items-center gap-1 rounded-full px-3 text-sm"
          >
            🐱+
          </button>
        )}
        <button
          type="button"
          onClick={handleToggleNight}
          aria-label={isNight ? "Nyalakan lampu" : "Matikan lampu"}
          className="pin pin-hover flex h-10 w-10 items-center justify-center rounded-full text-lg"
        >
          {isNight ? "🌙" : "☀️"}
        </button>
      </div>

      {shopOpen && <Shop onClose={() => setShopOpen(false)} />}

      {/* Cat Shop Modal */}
      {catShopOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{ background: "rgba(58, 46, 34, 0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setCatShopOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-accent/50 bg-card text-card-foreground shadow-2xl"
          >
            <div
              className="flex items-center justify-between border-b border-border px-5 py-4"
              style={{ background: "linear-gradient(180deg, oklch(0.94 0.014 82), oklch(0.90 0.018 82))" }}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/15 text-lg">🐱</span>
                <div>
                  <div className="font-display text-base font-bold uppercase tracking-wider text-foreground">Adopsi Kucing</div>
                  <div className="text-[10px] text-muted-foreground">tambah teman baru untuk kucingmu</div>
                </div>
              </div>
              <button
                onClick={() => setCatShopOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2">
              {lockedCats.map((catId) => {
                const cat = CATS.find((c) => c.id === catId);
                const cost = catCosts[catId] ?? 0;
                const canAfford = coins >= cost;
                if (!cat) return null;

                return (
                  <div key={catId} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                    <img src={cat.url} alt={cat.name} className="h-12 w-12 rounded-full bg-accent/30 object-cover" draggable={false} />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-foreground font-display">{cat.name}</div>
                      <div className="text-[10px] text-muted-foreground">kucing baru siap diadopsi</div>
                    </div>
                    <button
                      disabled={!canAfford || !authenticated}
                      onClick={async () => {
                        try {
                          await buyCat(catId);
                          toast.success(`🐱 ${cat.name} berhasil diadopsi!`);
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                      className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:bg-muted disabled:text-muted-foreground"
                    >
                      🪙 {cost}
                    </button>
                  </div>
                );
              })}

              {!authenticated && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">Login dulu untuk adopsi kucing</p>
                </div>
              )}

              {lockedCats.length === 0 && (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-sm text-muted-foreground">Semua kucing sudah diadopsi!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {CATS.filter((cat) => unlocked.includes(cat.id)).map((cat, i) => {
        const bounceKey = bounceTrigger[cat.id] ?? 0;
        const shakeKey = shakeTrigger[cat.id] ?? 0;
        const status = cats.find((c) => c.id === cat.id);
        const stage = stageFor(status?.affection ?? 0);
        const facing = statesRef.current[i]?.facing ?? 1;
        return (
          <div
            key={cat.id}
            ref={(el) => {
              spriteRefs.current[i] = el;
            }}
            className="absolute top-0 left-0 will-change-transform"
            style={{
              width: SPRITE,
              height: SPRITE,
              visibility: ready ? "visible" : "hidden",
            }}
          >
            <div
              className="relative h-full w-full transition-transform duration-700"
              style={{ transform: `scale(${stage.scale})` }}
            >
              <button
                type="button"
                onClick={() => handlePet(cat.id)}
                aria-label={`Elus ${cat.name}`}
                disabled={isNight}
                key={`btn-${bounceKey}-${shakeKey}`}
                className="relative block h-full w-full cursor-pointer bg-transparent p-0 disabled:cursor-not-allowed"
                style={{
                  animation: shakeKey
                    ? "cat-shake 500ms ease-in-out"
                    : bounceKey
                    ? "cat-bounce 500ms ease-out"
                    : undefined,
                }}
              >
                <img
                  src={cat.url}
                  alt={cat.name}
                  width={SPRITE}
                  height={SPRITE}
                  draggable={false}
                  className="h-full w-full select-none drop-shadow-[0_6px_4px_rgba(0,0,0,0.25)]"
                  style={{
                    transform: `scaleX(${facing}) ${isNight ? "rotate(-8deg)" : ""}`,
                    transition: "transform 500ms ease",
                    filter: isNight ? "brightness(0.7)" : undefined,
                  }}
                />
              </button>
              <CatAccessory stage={stage} sleeping={isNight} />
            </div>
            <div className="pointer-events-none absolute left-1/2 -top-5 -translate-x-1/2 whitespace-nowrap rounded-full border border-accent/50 bg-card/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm font-display">
              {cat.name}
            </div>
            <HeartParticles trigger={petTrigger[cat.id] ?? 0} />
            <FeedParticles trigger={feedTrigger[cat.id] ?? 0} />
          </div>
        );
      })}

      <CatStatusPanel cats={cats} meta={CATS} onFeed={handleFeed} />
    </div>
  );
}
