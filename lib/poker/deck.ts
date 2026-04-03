import type { Card } from "./types";
import { SUITS, RANKS } from "./types";

export function freshDeck(): Card[] {
  const d: Card[] = [];
  for (const suit of SUITS) {
    for (const value of RANKS) {
      d.push({ suit, value });
    }
  }
  return d;
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
