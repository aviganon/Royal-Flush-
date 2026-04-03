import type { Card } from "./types";
import { rankToIndex } from "./types";

/** Higher = better. Comparable with standard poker rules. */
export type HandScore = readonly number[];

const CAT_HIGH = 0;
const CAT_PAIR = 1;
const CAT_TWO_PAIR = 2;
const CAT_TRIPS = 3;
const CAT_STRAIGHT = 4;
const CAT_FLUSH = 5;
const CAT_FULL = 6;
const CAT_QUADS = 7;
const CAT_STRAIGHT_FLUSH = 8;

function rankIdx(c: Card): number {
  return rankToIndex(c.value);
}

function isFlush(cards: Card[]): boolean {
  const s = cards[0]!.suit;
  return cards.every((c) => c.suit === s);
}

/** Returns high card of straight (wheel uses 5 as high for ranking) or -1 */
function straightHigh(cards: Card[]): number {
  const idx = [...new Set(cards.map(rankIdx))].sort((a, b) => a - b);
  if (idx.length !== 5) return -1;
  // wheel A-2-3-4-5
  if (idx.join(",") === "0,1,2,3,12") return 3; // 5-high straight, rank index of '5' is 3
  for (let i = 1; i < idx.length; i++) {
    if (idx[i] !== idx[i - 1]! + 1) return -1;
  }
  return idx[4]!;
}

function countRanks(cards: Card[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of cards) {
    const r = rankIdx(c);
    m.set(r, (m.get(r) ?? 0) + 1);
  }
  return m;
}

/** Best 5-card score from exactly 5 cards */
function scoreFive(cards: Card[]): HandScore {
  const flush = isFlush(cards);
  const sh = straightHigh(cards);
  const counts = countRanks(cards);
  const byCount = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1]! - a[1]!;
    return b[0]! - a[0]!;
  });

  if (flush && sh >= 0) {
    return [CAT_STRAIGHT_FLUSH, sh];
  }

  if (byCount[0]![1] === 4) {
    const quad = byCount[0]![0];
    const kicker = byCount.find(([r, n]) => n === 1)?.[0] ?? 0;
    return [CAT_QUADS, quad, kicker];
  }

  if (byCount[0]![1] === 3 && byCount[1]![1] === 2) {
    return [CAT_FULL, byCount[0]![0], byCount[1]![0]];
  }

  if (flush) {
    const rs = cards.map(rankIdx).sort((a, b) => b - a);
    return [CAT_FLUSH, ...rs];
  }

  if (sh >= 0) {
    return [CAT_STRAIGHT, sh];
  }

  if (byCount[0]![1] === 3) {
    const trip = byCount[0]![0];
    const kickers = byCount
      .filter(([, n]) => n === 1)
      .map(([r]) => r)
      .sort((a, b) => b - a);
    return [CAT_TRIPS, trip, ...kickers];
  }

  if (byCount[0]![1] === 2 && byCount[1]![1] === 2) {
    const p1 = Math.max(byCount[0]![0], byCount[1]![0]);
    const p2 = Math.min(byCount[0]![0], byCount[1]![0]);
    const kicker = byCount.find(([, n]) => n === 1)?.[0] ?? 0;
    return [CAT_TWO_PAIR, p1, p2, kicker];
  }

  if (byCount[0]![1] === 2) {
    const pair = byCount[0]![0];
    const kickers = byCount
      .filter(([, n]) => n === 1)
      .map(([r]) => r)
      .sort((a, b) => b - a);
    return [CAT_PAIR, pair, ...kickers];
  }

  const rs = cards.map(rankIdx).sort((a, b) => b - a);
  return [CAT_HIGH, ...rs];
}

function combinations<T>(arr: T[], k: number): T[][] {
  const res: T[][] = [];
  function dfs(start: number, cur: T[]) {
    if (cur.length === k) {
      res.push([...cur]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      cur.push(arr[i]!);
      dfs(i + 1, cur);
      cur.pop();
    }
  }
  dfs(0, []);
  return res;
}

function compareScores(a: HandScore, b: HandScore): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? -1;
    const y = b[i] ?? -1;
    if (x !== y) return x - y;
  }
  return 0;
}

/** Best Hold'em score from 2 hole + up to 5 board cards */
export function bestHoldemScore(hole: Card[], board: Card[]): HandScore {
  const all = [...hole, ...board];
  if (all.length < 5) return [CAT_HIGH, 0];
  let best: HandScore | null = null;
  for (const five of combinations(all, 5)) {
    const s = scoreFive(five);
    if (!best || compareScores(s, best) > 0) best = s;
  }
  return best!;
}

/**
 * Pot-Limit Omaha style: בדיוק 2 קלפים מהיד (4) + 3 מהבורד (5).
 */
export function bestOmahaScore(hole: Card[], board: Card[]): HandScore {
  if (hole.length !== 4 || board.length < 3) return [CAT_HIGH, 0];
  const b3 = combinations(board, 3);
  const h2 = combinations(hole, 2);
  let best: HandScore | null = null;
  for (const ho of h2) {
    for (const brd of b3) {
      const five = [...ho, ...brd];
      const s = scoreFive(five);
      if (!best || compareScores(s, best) > 0) best = s;
    }
  }
  return best!;
}

export function compareHoldemHands(
  holeA: Card[],
  board: Card[],
  holeB: Card[],
): number {
  return compareScores(bestHoldemScore(holeA, board), bestHoldemScore(holeB, board));
}
