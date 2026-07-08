import { PrivyProvider } from "@privy-io/react-auth";
import { mainnet } from "viem/chains";
import { ritualChain } from "@/lib/ritualChain";
import type { ReactNode } from "react";

const APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string | undefined;

export function PrivyAppProvider({ children }: { children: ReactNode }) {
  if (!APP_ID) {
    // Render children unwrapped so app doesn't crash if env is missing during SSR/build.
    return <>{children}</>;
  }
  return (
    <PrivyProvider
      appId={APP_ID}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#f472b6",
          logo: undefined,
          walletChainType: "ethereum-only",
          showWalletLoginFirst: true,
        },
        defaultChain: ritualChain,
        supportedChains: [ritualChain, mainnet],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
