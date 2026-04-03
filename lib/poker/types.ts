export type Suit = "spades" | "hearts" | "diamonds" | "clubs";

export interface Card {
  suit: Suit;
  value: string;
}

export const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
export const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
] as const;

export type RankChar = (typeof RANKS)[number];

/** Internal 0–12 index, 2=0 … A=12 */
export function rankToIndex(value: string): number {
  const i = RANKS.indexOf(value as RankChar);
  if (i < 0) throw new Error(`Bad rank: ${value}`);
  return i;
}

export function indexToRank(i: number): string {
  return RANKS[i] ?? "2";
}

export function cardKey(c: Card): string {
  const s =
    c.suit === "spades"
      ? "s"
      : c.suit === "hearts"
        ? "h"
        : c.suit === "diamonds"
          ? "d"
          : "c";
  const r = c.value === "10" ? "T" : c.value[0]!.toUpperCase();
  return `${r}${s}`;
}

export function parseKey(key: string): Card {
  const r0 = key[0]!.toUpperCase();
  const rank =
    r0 === "T"
      ? "10"
      : r0 === "J" || r0 === "Q" || r0 === "K" || r0 === "A"
        ? r0
        : r0;
  const s = key[1]!.toLowerCase();
  const suit: Suit =
    s === "h"
      ? "hearts"
      : s === "d"
        ? "diamonds"
        : s === "c"
          ? "clubs"
          : "spades";
  return { suit, value: rank };
}

export function cardToUi(c: Card): Card {
  return c;
}
