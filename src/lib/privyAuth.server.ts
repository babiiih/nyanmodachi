// Verify Privy access tokens server-side using JWKS.
// Docs: https://docs.privy.io/guide/server/authorization/verification
import { createRemoteJWKSet, jwtVerify } from "jose";

const APP_ID = process.env.VITE_PRIVY_APP_ID ?? process.env.PRIVY_APP_ID;

if (!APP_ID) {
  // Fail loudly at first use — avoids silently accepting unverified tokens.
  console.warn("[privy] PRIVY_APP_ID / VITE_PRIVY_APP_ID missing at boot");
}

const JWKS = APP_ID
  ? createRemoteJWKSet(
      new URL(`https://auth.privy.io/api/v1/apps/${APP_ID}/jwks.json`),
    )
  : null;

export type PrivyClaims = {
  sub: string; // Privy user id (did:privy:...)
  wallet?: string; // convenience: lowercased primary wallet
};

export async function verifyPrivyToken(token: string): Promise<PrivyClaims> {
  if (!JWKS || !APP_ID) throw new Error("Privy not configured");
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: "privy.io",
    audience: APP_ID,
  });
  return { sub: String(payload.sub ?? "") };
}

/**
 * Verifies the Privy access token AND that the wallet the client claims to act
 * as is actually linked to that Privy user. This closes the "client sends
 * someone else's wallet address" hole.
 */
export async function verifyPrivyWallet(
  token: string,
  claimedWallet: string,
): Promise<{ sub: string; wallet: string }> {
  const { sub } = await verifyPrivyToken(token);
  const wallet = claimedWallet.trim().toLowerCase();
  if (!wallet || !/^0x[a-f0-9]{40}$/.test(wallet)) {
    throw new Error("Invalid wallet address");
  }
  // Fetch the Privy user profile with the app's secret via basic auth.
  // App secret is required by Privy REST API.
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appSecret) {
    // Without the app secret we can only trust the JWT signature.
    // Fail closed for state-changing calls rather than trust a client-supplied wallet.
    throw new Error("PRIVY_APP_SECRET missing — cannot verify wallet ownership");
  }
  const res = await fetch(`https://auth.privy.io/api/v1/users/${sub}`, {
    headers: {
      Authorization:
        "Basic " + btoa(`${APP_ID}:${appSecret}`),
      "privy-app-id": APP_ID!,
    },
  });
  if (!res.ok) throw new Error(`Privy user lookup failed: ${res.status}`);
  const user = (await res.json()) as {
    linked_accounts?: Array<{ type: string; address?: string }>;
  };
  const linked = (user.linked_accounts ?? [])
    .filter((a) => a.type === "wallet" && a.address)
    .map((a) => a.address!.toLowerCase());
  if (!linked.includes(wallet)) {
    throw new Error("Wallet is not linked to this Privy account");
  }
  return { sub, wallet };
}
