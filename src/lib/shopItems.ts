export type ShopKind = "food" | "accessory" | "toy";

export type ShopItem = {
  id: string;
  name: string;
  emoji: string;
  kind: ShopKind;
  price: number;
  effect: { hunger?: number; mood?: number; affection?: number };
  rarity: "common" | "rare" | "legendary";
};

export const RARITY_STYLES: Record<ShopItem["rarity"], string> = {
  common: "ring-border",
  rare: "ring-accent/70 bg-accent/10",
  legendary: "ring-destructive/60 bg-destructive/10",
};

// Per-cat food preferences reused by feed flow.
export const CAT_FOOD_PREFERENCES: Record<
  string,
  { favorite: string; dislike: string }
> = {
  kuro: { favorite: "fish", dislike: "milk" },
  hana: { favorite: "milk", dislike: "cookie" },
  sora: { favorite: "sushi", dislike: "fish" },
  miko: { favorite: "cookie", dislike: "sushi" },
  yuki: { favorite: "shrimp", dislike: "treat" },
};

export function reactionForItem(
  catId: string,
  itemId: string,
): "favorite" | "dislike" | "normal" {
  const p = CAT_FOOD_PREFERENCES[catId];
  if (!p) return "normal";
  if (p.favorite === itemId) return "favorite";
  if (p.dislike === itemId) return "dislike";
  return "normal";
}
