import { useState } from "react";
import { FOODS, type FoodId } from "@/lib/foods";

export function FoodMenu({
  favorite,
  onPick,
}: {
  favorite: FoodId;
  onPick: (id: FoodId) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-accent/60 bg-accent/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm transition hover:bg-accent/60 active:scale-95 font-display"
      >
        Feed
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Tutup menu"
            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div className="pin absolute bottom-full right-0 z-[9999] mb-1.5 flex gap-1 rounded-2xl p-1.5 animate-fade-in">
            {FOODS.map((f) => {
              const isFav = f.id === favorite;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    onPick(f.id);
                    setOpen(false);
                  }}
                  title={`${f.name}${isFav ? " (favorit)" : ""}`}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-xl text-lg transition hover:scale-110 active:scale-95 ${
                    isFav
                      ? "bg-destructive/15 ring-1 ring-destructive/40"
                      : "bg-secondary hover:bg-accent/40"
                  }`}
                >
                  <span>{f.emoji}</span>
                  {isFav && (
                    <span className="absolute -top-1 -right-1 text-[10px]">💖</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
