import { getFood, reactionFor, type FoodId } from "@/lib/foods";

export type CatStatus = {
  id: string;
  hunger: number;
  mood: number;
  affection: number;
  lastFedAt: number;
};

export const CAT_IDS = ["kuro", "miko", "sora", "hana", "yuki"] as const;

const STORAGE_KEY = "nyanmodachi:v2";
const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000;

// Decay per second
const HUNGER_PER_SEC = 1 / 5;
const MOOD_PER_SEC = 0.5 / 5;
// Sleep multiplier — decay slows to a quarter, and mood recovers if fed.
const SLEEP_DECAY_MULT = 0.25;
const SLEEP_MOOD_RECOVER_PER_SEC = 0.2 / 5;

export function defaultStatuses(): CatStatus[] {
  const now = Date.now();
  return CAT_IDS.map((id) => ({
    id,
    hunger: 80,
    mood: 80,
    affection: 10,
    lastFedAt: now,
  }));
}

export function applyDecay(
  list: CatStatus[],
  elapsedMs: number,
  isNight = false,
): CatStatus[] {
  const secs = Math.max(0, Math.min(MAX_OFFLINE_MS, elapsedMs) / 1000);
  if (secs <= 0) return list;
  const mult = isNight ? SLEEP_DECAY_MULT : 1;
  return list.map((c) => {
    const hunger = Math.max(0, c.hunger - HUNGER_PER_SEC * mult * secs);
    const moodRate = MOOD_PER_SEC * mult * (hunger < 20 ? 2 : 1);
    let mood = Math.max(0, c.mood - moodRate * secs);
    if (isNight && hunger > 30) {
      mood = Math.min(100, mood + SLEEP_MOOD_RECOVER_PER_SEC * secs);
    }
    return { ...c, hunger, mood };
  });
}

export function feed(
  list: CatStatus[],
  id: string,
  foodId: FoodId,
): { list: CatStatus[]; reaction: "favorite" | "dislike" | "normal" } {
  const now = Date.now();
  const food = getFood(foodId);
  const reaction = reactionFor(id, foodId);
  const nextList = list.map((c) => {
    if (c.id !== id) return c;
    let moodDelta = food.mood;
    if (reaction === "favorite") moodDelta = food.mood * 2;
    else if (reaction === "dislike") moodDelta = -5;
    return {
      ...c,
      hunger: Math.min(100, c.hunger + food.hunger),
      mood: Math.max(0, Math.min(100, c.mood + moodDelta)),
      affection: Math.min(100, c.affection + 0.5),
      lastFedAt: now,
    };
  });
  return { list: nextList, reaction };
}

export function pet(list: CatStatus[], id: string): CatStatus[] {
  return list.map((c) =>
    c.id === id
      ? {
          ...c,
          mood: Math.min(100, c.mood + 8),
          affection: Math.min(100, c.affection + 1),
        }
      : c,
  );
}

type Saved = { savedAt: number; isNight?: boolean; cats: CatStatus[] };

export function load(): { cats: CatStatus[]; isNight: boolean } {
  if (typeof window === "undefined")
    return { cats: defaultStatuses(), isNight: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { cats: defaultStatuses(), isNight: false };
    const parsed = JSON.parse(raw) as Saved;
    if (!parsed?.cats?.length)
      return { cats: defaultStatuses(), isNight: false };
    const byId = new Map(parsed.cats.map((c) => [c.id, c]));
    const merged = defaultStatuses().map((d) => {
      const saved = byId.get(d.id);
      return saved ? { ...d, ...saved } : d;
    });
    const elapsed = Date.now() - (parsed.savedAt ?? Date.now());
    const isNight = !!parsed.isNight;
    return { cats: applyDecay(merged, elapsed, isNight), isNight };
  } catch {
    return { cats: defaultStatuses(), isNight: false };
  }
}

export function save(list: CatStatus[], isNight: boolean) {
  if (typeof window === "undefined") return;
  try {
    const payload: Saved = { savedAt: Date.now(), isNight, cats: list };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function relativeTime(from: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - from) / 1000));
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}
