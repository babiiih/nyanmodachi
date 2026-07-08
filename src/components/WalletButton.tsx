import { usePlayer } from "@/hooks/usePlayer";

function truncate(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletButton() {
  const { ready, authenticated, wallet, login, logout } = usePlayer();
  if (!ready) {
    return (
      <button
        disabled
        className="pin flex h-10 items-center rounded-full px-3.5 text-xs text-muted-foreground"
      >
        …
      </button>
    );
  }
  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="pin pin-hover flex h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-primary-foreground"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.55 0.05 65), oklch(0.48 0.05 55))",
        }}
      >
        <span aria-hidden>🔗</span>
        <span className="font-display uppercase tracking-wider">Connect</span>
      </button>
    );
  }
  return (
    <button
      onClick={logout}
      title="Disconnect wallet"
      className="pin pin-hover flex h-10 items-center gap-1.5 rounded-full px-3.5 text-xs"
    >
      <span aria-hidden>👛</span>
      <span className="font-display text-foreground">{truncate(wallet)}</span>
    </button>
  );
}
