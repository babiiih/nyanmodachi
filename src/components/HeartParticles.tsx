import { useEffect, useState } from "react";

type Heart = { key: string; dx: number; delay: number; rot: number };

export function HeartParticles({ trigger }: { trigger: number }) {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const batch: Heart[] = Array.from({ length: 5 }, (_, i) => ({
      key: `${trigger}-${i}`,
      dx: (Math.random() - 0.5) * 40,
      delay: Math.random() * 120,
      rot: (Math.random() - 0.5) * 40,
    }));
    setHearts((prev) => [...prev, ...batch]);
    const t = setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !batch.find((b) => b.key === h.key)));
    }, 1200);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {hearts.map((h) => (
        <span
          key={h.key}
          className="absolute left-1/2 top-2 -translate-x-1/2 text-lg text-pink-500"
          style={{
            marginLeft: h.dx,
            animation: `heart-float 900ms ease-out ${h.delay}ms forwards`,
            transform: `translateX(-50%) rotate(${h.rot}deg)`,
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}
