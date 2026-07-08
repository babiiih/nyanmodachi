import type { Stage } from "@/lib/evolution";
import knotLogoUrl from "@/assets/knot-logo.png";

/** Overlays for a cat sprite: accessory emoji, aura glow, sparkle particles. */
export function CatAccessory({ stage, sleeping }: { stage: Stage; sleeping: boolean }) {
  return (
    <>
      <img
        src={knotLogoUrl}
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 select-none"
        style={{
          top: "28%",
          width: 22,
          height: 22,
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))",
          mixBlendMode: "screen",
          opacity: sleeping ? 0.55 : 0.95,
        }}
      />
      {stage.accessory && (
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 select-none transition-all duration-700"
          style={{ fontSize: 20, transform: `translateX(-50%) translateY(-6px)` }}
          aria-hidden
        >
          {stage.accessory}
        </div>
      )}
      {stage.glow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-700"
          style={{
            boxShadow: "0 0 30px 6px rgba(255, 220, 120, 0.55)",
            opacity: sleeping ? 0.3 : 0.9,
          }}
          aria-hidden
        />
      )}
      {stage.sparkle && !sleeping && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ animation: "aura-spin 6s linear infinite" }}
          aria-hidden
        >
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm">✨</span>
          <span className="absolute top-1/2 -right-2 -translate-y-1/2 text-sm">✨</span>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-sm">✨</span>
          <span className="absolute top-1/2 -left-2 -translate-y-1/2 text-sm">✨</span>
        </div>
      )}
      {sleeping && (
        <div
          className="pointer-events-none absolute -top-3 right-1 select-none text-lg"
          style={{ animation: "zzz-float 2.4s ease-in-out infinite" }}
          aria-hidden
        >
          💤
        </div>
      )}
    </>
  );
}
