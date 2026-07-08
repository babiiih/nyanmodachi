import { usePlayer } from "@/hooks/usePlayer";

export function CoinBadge() {
  const { authenticated, coins } = usePlayer();
  if (!authenticated) return null;
  return (
    <div className="pin flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold">
      <span aria-hidden className="text-base leading-none">🪙</span>
      <span className="font-display tabular-nums tracking-tight text-foreground">
        {coins}
      </span>
    </div>
  );
}
