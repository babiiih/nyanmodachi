import { useEffect, useState } from "react";
import type { CatStatus } from "@/lib/catState";
import { relativeTime } from "@/lib/catState";
import { FoodMenu } from "@/components/FoodMenu";
import { PREFERENCES, getFood, type FoodId } from "@/lib/foods";
import { stageFor } from "@/lib/evolution";

type CatMeta = { id: string; name: string; url: string };

function Bar({ value, tone }: { value: number; tone: "hunger" | "mood" | "affection" }) {
  const pct = Math.max(0, Math.min(100, value));
  const low = pct < 30;
  const color =
    tone === "hunger"
      ? low
        ? "bg-destructive"
        : "bg-[oklch(0.72_0.13_65)]"
      : tone === "mood"
      ? low
        ? "bg-muted-foreground/70"
        : "bg-success"
      : "bg-primary";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
      <div
        className={`h-full ${color} transition-[width] duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function CatStatusPanel({
  cats,
  meta,
  onFeed,
}: {
  cats: CatStatus[];
  meta: CatMeta[];
  onFeed: (id: string, foodId: FoodId) => void;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-[9999] px-3 pb-3 pt-2"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, color-mix(in oklab, var(--color-background) 55%, transparent) 30%, color-mix(in oklab, var(--color-background) 88%, transparent) 100%)",
      }}
    >
      <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {meta.map((m, idx) => {
          const c = cats.find((x) => x.id === m.id);
          if (!c) return null;
          const pref = PREFERENCES[m.id];
          const favFood = pref ? getFood(pref.favorite) : null;
          const stage = stageFor(c.affection);
          return (
            <div
              key={m.id}
              className="pin min-w-[190px] flex-1 animate-fade-in rounded-2xl p-2.5"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-center gap-2">
                <img
                  src={m.url}
                  alt={m.name}
                  className="h-9 w-9 rounded-full bg-accent/30 object-cover ring-1 ring-accent/50"
                  draggable={false}
                />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1 text-xs font-bold text-foreground font-display uppercase tracking-wide">
                    {m.name}
                    <span className="rounded-full border border-accent/50 bg-accent/25 px-1.5 py-0.5 text-[9px] font-semibold normal-case tracking-normal text-foreground/80">
                      {stage.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    🍽️ {relativeTime(c.lastFedAt)}
                    {favFood && (
                      <span className="ml-1">· suka {favFood.emoji}</span>
                    )}
                  </div>
                </div>
                {pref && (
                  <FoodMenu
                    favorite={pref.favorite}
                    onPick={(fid) => onFeed(m.id, fid)}
                  />
                )}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-10 text-[10px] uppercase tracking-wider text-muted-foreground font-display">Kny</span>
                  <Bar value={c.hunger} tone="hunger" />
                  <span className="w-6 text-right text-[10px] tabular-nums text-foreground font-display">
                    {Math.round(c.hunger)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-10 text-[10px] uppercase tracking-wider text-muted-foreground font-display">Mod</span>
                  <Bar value={c.mood} tone="mood" />
                  <span className="w-6 text-right text-[10px] tabular-nums text-foreground font-display">
                    {Math.round(c.mood)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-10 text-[10px] uppercase tracking-wider text-muted-foreground font-display">Sya</span>
                  <Bar value={c.affection} tone="affection" />
                  <span className="w-6 text-right text-[10px] tabular-nums text-foreground font-display">
                    {Math.round(c.affection)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
