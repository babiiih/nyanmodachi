import { useEffect, useState } from "react";

type Particle = { key: string; dx: number; delay: number; emoji: string };

const FOODS = ["🐟", "🍣", "🍤", "🥩"];

export function FeedParticles({ trigger }: { trigger: number }) {
  const [items, setItems] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const batch: Particle[] = Array.from({ length: 3 }, (_, i) => ({
      key: `${trigger}-${i}`,
      dx: (Math.random() - 0.5) * 36,
      delay: i * 90,
      emoji: FOODS[Math.floor(Math.random() * FOODS.length)],
    }));
    setItems((prev) => [...prev, ...batch]);
    const t = setTimeout(() => {
      setItems((prev) => prev.filter((h) => !batch.find((b) => b.key === h.key)));
    }, 1400);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {trigger > 0 && (
        <span
          key={`ring-${trigger}`}
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400"
          style={{ animation: "ring-pulse 500ms ease-out forwards" }}
        />
      )}
      {items.map((h) => (
        <span
          key={h.key}
          className="absolute left-1/2 top-4 text-xl"
          style={{
            marginLeft: h.dx,
            animation: `food-float 1s ease-out ${h.delay}ms forwards`,
            transform: "translateX(-50%)",
          }}
        >
          {h.emoji}
        </span>
      ))}
      {trigger > 0 &&
        Array.from({ length: 4 }, (_, i) => (
          <span
            key={`spk-${trigger}-${i}`}
            className="absolute text-sm text-amber-300"
            style={{
              left: `${20 + i * 20}%`,
              top: `${10 + (i % 2) * 30}%`,
              animation: `sparkle-burst 700ms ease-out ${i * 60}ms forwards`,
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            ✨
          </span>
        ))}
    </div>
  );
}
