import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyDecay,
  defaultStatuses,
  feed as feedFn,
  load,
  pet as petFn,
  save,
  type CatStatus,
} from "@/lib/catState";
import type { FoodId } from "@/lib/foods";

export function useCatStatuses() {
  const [cats, setCats] = useState<CatStatus[]>(() => defaultStatuses());
  const [isNight, setIsNight] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const isNightRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const { cats: loaded, isNight: nightLoaded } = load();
    setCats(loaded);
    setIsNight(nightLoaded);
    isNightRef.current = nightLoaded;
    setHydrated(true);
  }, []);

  useEffect(() => {
    isNightRef.current = isNight;
  }, [isNight]);

  useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(() => {
      setCats((prev) => applyDecay(prev, 5000, isNightRef.current));
    }, 5000);
    return () => clearInterval(id);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(cats, isNight), 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [cats, isNight, hydrated]);

  const feed = useCallback((id: string, foodId: FoodId) => {
    let reaction: "favorite" | "dislike" | "normal" = "normal";
    setCats((prev) => {
      const res = feedFn(prev, id, foodId);
      reaction = res.reaction;
      return res.list;
    });
    return reaction as "favorite" | "dislike" | "normal";
  }, []);


  const pet = useCallback((id: string) => {
    setCats((prev) => petFn(prev, id));
  }, []);

  const toggleNight = useCallback(() => {
    setIsNight((n) => !n);
  }, []);

  return { cats, feed, pet, hydrated, isNight, toggleNight };
}
