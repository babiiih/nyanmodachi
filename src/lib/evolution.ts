export type Stage = {
  index: number;
  key: "baby" | "young" | "adult" | "bonded" | "legend";
  label: string;
  scale: number;
  accessory: string | null; // emoji
  glow: boolean;
  sparkle: boolean;
};

export const STAGES: Stage[] = [
  { index: 0, key: "baby", label: "Bayi", scale: 0.85, accessory: null, glow: false, sparkle: false },
  { index: 1, key: "young", label: "Muda", scale: 0.95, accessory: "🎀", glow: false, sparkle: false },
  { index: 2, key: "adult", label: "Dewasa", scale: 1.0, accessory: "👑", glow: false, sparkle: false },
  { index: 3, key: "bonded", label: "Terhubung", scale: 1.05, accessory: "👑", glow: true, sparkle: false },
  { index: 4, key: "legend", label: "Legend", scale: 1.1, accessory: "👑", glow: true, sparkle: true },
];

export function stageFor(affection: number): Stage {
  const a = Math.max(0, Math.min(100, affection));
  if (a >= 90) return STAGES[4];
  if (a >= 75) return STAGES[3];
  if (a >= 50) return STAGES[2];
  if (a >= 25) return STAGES[1];
  return STAGES[0];
}
