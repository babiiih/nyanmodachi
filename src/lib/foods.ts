export type FoodId = "fish" | "milk" | "sushi" | "snack";

export type Food = {
  id: FoodId;
  name: string;
  emoji: string;
  hunger: number;
  mood: number;
};

export const FOODS: Food[] = [
  { id: "fish", name: "Ikan", emoji: "🐟", hunger: 35, mood: 8 },
  { id: "milk", name: "Susu", emoji: "🥛", hunger: 15, mood: 12 },
  { id: "sushi", name: "Sushi", emoji: "🍣", hunger: 40, mood: 15 },
  { id: "snack", name: "Snack", emoji: "🍪", hunger: 10, mood: 6 },
];

export function getFood(id: FoodId): Food {
  return FOODS.find((f) => f.id === id) ?? FOODS[0];
}

// Per-cat preferences: favorite (mood x2) and dislike (mood -5 net).
export const PREFERENCES: Record<
  string,
  { favorite: FoodId; dislike: FoodId }
> = {
  kuro: { favorite: "fish", dislike: "milk" },
  hana: { favorite: "milk", dislike: "snack" },
  sora: { favorite: "sushi", dislike: "fish" },
  miko: { favorite: "snack", dislike: "sushi" },
  yuki: { favorite: "fish", dislike: "snack" },
};

export type FoodReaction = "favorite" | "dislike" | "normal";

export function reactionFor(catId: string, foodId: FoodId): FoodReaction {
  const p = PREFERENCES[catId];
  if (!p) return "normal";
  if (p.favorite === foodId) return "favorite";
  if (p.dislike === foodId) return "dislike";
  return "normal";
}
