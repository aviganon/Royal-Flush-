import { freshDeck, shuffle } from "./deck";
import { bestHoldemScore, type HandScore } from "./evaluate";
import type { Card } from "./types";

export type Street = "preflop" | "flop" | "turn" | "river";

export interface SeatPlayer {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  hole: Card[];
  folded: boolean;
  streetBet: number;
  allIn: boolean;
  seat: number;
}

export interface HoldemConfig {
  smallBlind: number;
  bigBlind: number;
  maxSeats: number;
  turnSeconds: number;
}

const DEFAULT_CONFIG: HoldemConfig = {
  smallBlind: 1,
  bigBlind: 2,
  maxSeats: 9,
  turnSeconds: 30,
};

function seatWrap(i: number, n: number): number {
  return ((i % n) + n) % n;
}

export class HoldemEngine {
  config: HoldemConfig;
  seats: (SeatPlayer | null)[];
  board: Card[] = [];
  pot = 0;
  street: Street = "preflop";
  dealer = 0;
  actionSeat = -1;
  currentMaxBet = 0;
  minRaise = 0;
  lastRaiseSize = 0;
  deck: Card[] = [];
  handNumber = 0;
  rng: () => number;
  actionLog: string[] = [];
  turnDeadline: number | null = null;
  handFinished = true;
  /** Seats that finished their action for current street (check or call/raise closure) */
  private seatsActed = new Set<number>();
  private bigBlindSeatThisHand = -1;
  /** After everyone limps, BB still needs check/raise option */
  private bbPreflopOptionDone = false;

  constructor(config: Partial<HoldemConfig> = {}, rng: () => number = Math.random) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.seats = Array.from({ length: this.config.maxSeats }, () => null);
    this.rng = rng;
  }

  private log(msg: string) {
    this.actionLog.push(msg);
    if (this.actionLog.length > 80) this.actionLog.shift();
  }

  private playersInHand(): SeatPlayer[] {
    return this.seats.filter((p): p is SeatPlayer => !!p && !p.folded);
  }

  private nextSeat(from: number): number {
    const n = this.config.maxSeats;
    for (let k = 1; k <= n; k++) {
      const i = seatWrap(from + k, n);
      if (this.seats[i]) return i;
    }
    return -1;
  }

  addPlayer(id: string, name: string, buyIn: number, avatar = "🎭"): { ok: boolean; error?: string; seat?: number } {
    if (buyIn < this.config.bigBlind * 40) {
      return { ok: false, error: "קנייה מינימלית נמוכה מדי" };
    }
    const empty = this.seats.findIndex((s) => s === null);
    if (empty < 0) return { ok: false, error: "אין מקום פנוי" };
    this.seats[empty] = {
      id,
      name,
      avatar,
      chips: buyIn,
      hole: [],
      folded: false,
      streetBet: 0,
      allIn: false,
      seat: empty,
    };
    this.log(`${name} הצטרף לשולחן`);
    return { ok: true, seat: empty };
  }

  removePlayer(playerId: string) {
    const i = this.seats.findIndex((p) => p?.id === playerId);
    if (i < 0) return;
    const name = this.seats[i]?.name;
    if (!this.handFinished) {
      const p = this.seats[i];
      if (p) {
        p.folded = true;
        this.log(`${p.name} עזב (פורש)`);
        this.afterAction();
      }
    }
    this.seats[i] = null;
    if (name) this.log(`${name} יצא מהשולחן`);
  }

  private setTimer() {
    this.turnDeadline = Date.now() + this.config.turnSeconds * 1000;
  }

  private clearTimer() {
    this.turnDeadline = null;
  }

  private collectStreetToPot() {
    let add = 0;
    for (const p of this.seats) {
      if (!p) continue;
      add += p.streetBet;
      p.streetBet = 0;
    }
    this.pot += add;
    this.currentMaxBet = 0;
    this.lastRaiseSize = 0;
    this.minRaise = this.config.bigBlind;
    this.seatsActed.clear();
  }

  private eligibleActors(): SeatPlayer[] {
    return this.playersInHand().filter((p) => !p.allIn && p.chips > 0);
  }

  private bettingRoundDone(): boolean {
    const elig = this.eligibleActors();
    if (elig.length === 0) return true;
    if (this.currentMaxBet === 0) {
      return elig.every((p) => this.seatsActed.has(p.seat));
    }
    return elig.every((p) => p.streetBet >= this.currentMaxBet);
  }

  private nextActorFrom(from: number): number {
    const n = this.config.maxSeats;
    for (let k = 1; k <= n; k++) {
      const i = seatWrap(from + k, n);
      const p = this.seats[i];
      if (!p || p.folded || p.allIn || p.chips === 0) continue;
      if (this.currentMaxBet === 0 && !this.seatsActed.has(i)) return i;
      if (this.currentMaxBet > 0 && p.streetBet < this.currentMaxBet) return i;
    }
    return -1;
  }

  private startHand() {
    const withChips = this.seats.filter((p): p is SeatPlayer => !!p && p.chips > 0);
    if (withChips.length < 2) {
      this.handFinished = true;
      this.clearTimer();
      return;
    }
    this.handNumber++;
    this.handFinished = false;
    this.board = [];
    this.pot = 0;
    this.street = "preflop";
    this.seatsActed.clear();
    this.bbPreflopOptionDone = false;
    this.deck = shuffle(freshDeck(), this.rng);
    for (const p of this.seats) {
      if (!p) continue;
      p.hole = [];
      p.folded = p.chips <= 0;
      p.streetBet = 0;
      p.allIn = false;
    }

    const d = this.dealer;
    const inHand = this.playersInHand();
    const isHu = inHand.length === 2;

    let sbSeat: number;
    let bbSeat: number;
    if (isHu) {
      sbSeat = d;
      bbSeat = this.nextSeat(d);
    } else {
      sbSeat = this.nextSeat(d);
      bbSeat = this.nextSeat(sbSeat);
    }

    const post = (seat: number, amt: number) => {
      const pl = this.seats[seat];
      if (!pl) return;
      const pay = Math.min(amt, pl.chips);
      pl.chips -= pay;
      pl.streetBet += pay;
      if (pl.chips === 0) pl.allIn = true;
    };

    post(sbSeat, this.config.smallBlind);
    post(bbSeat, this.config.bigBlind);
    this.bigBlindSeatThisHand = bbSeat;
    this.currentMaxBet = this.config.bigBlind;
    this.minRaise = this.config.bigBlind;
    this.lastRaiseSize = this.config.bigBlind;

    for (const p of this.seats) {
      if (!p || p.folded) continue;
      p.hole.push(this.deck.pop()!, this.deck.pop()!);
    }

    if (isHu) {
      this.actionSeat = d;
    } else {
      this.actionSeat = this.nextSeat(bbSeat);
    }
    this.setTimer();
    this.log(`יד #${this.handNumber}`);
  }

  private advanceStreet() {
    this.collectStreetToPot();
    const alive = this.playersInHand();
    if (alive.length === 1) {
      this.awardPotSingle();
      return;
    }

    const canVoluntaryBet = alive.filter((p) => !p.allIn && p.chips > 0);
    if (canVoluntaryBet.length === 0) {
      while (this.board.length < 5 && this.deck.length > 2) {
        this.deck.pop();
        this.board.push(this.deck.pop()!);
      }
      this.showdown();
      return;
    }

    if (this.street === "preflop") {
      if (this.deck.length > 4) {
        this.deck.pop();
        this.board.push(this.deck.pop()!, this.deck.pop()!, this.deck.pop()!);
      }
      this.street = "flop";
    } else if (this.street === "flop") {
      if (this.deck.length > 2) {
        this.deck.pop();
        this.board.push(this.deck.pop()!);
      }
      this.street = "turn";
    } else if (this.street === "turn") {
      if (this.deck.length > 2) {
        this.deck.pop();
        this.board.push(this.deck.pop()!);
      }
      this.street = "river";
    } else {
      this.showdown();
      return;
    }

    this.currentMaxBet = 0;
    this.minRaise = this.config.bigBlind;
    this.lastRaiseSize = 0;
    this.seatsActed.clear();

    const first = this.nextSeat(this.dealer);
    this.actionSeat = this.nextActorFrom(first - 1);
    if (this.actionSeat < 0) this.advanceStreet();
    else this.setTimer();
  }

  private markBettingChange() {
    this.seatsActed.clear();
    const raiser = this.seats[this.actionSeat];
    if (raiser) this.seatsActed.add(this.actionSeat);
  }

  act(
    playerId: string,
    kind: "fold" | "check" | "call" | "raise",
    raiseTo?: number,
  ): { ok: boolean; error?: string } {
    const seat = this.seats.findIndex((p) => p?.id === playerId);
    if (seat < 0) return { ok: false, error: "לא בשולחן" };
    if (this.handFinished) return { ok: false, error: "אין יד פעילה" };
    if (seat !== this.actionSeat) return { ok: false, error: "לא התור שלך" };
    const p = this.seats[seat]!;
    const toCall = this.currentMaxBet - p.streetBet;

    if (kind === "fold") {
      p.folded = true;
      this.seatsActed.add(seat);
      this.log(`${p.name} פורש`);
      this.afterAction();
      return { ok: true };
    }
    if (kind === "check") {
      if (toCall > 0) return { ok: false, error: "לא ניתן לצ'ק" };
      this.seatsActed.add(seat);
      this.log(`${p.name} צ'ק`);
      this.afterAction();
      return { ok: true };
    }
    if (kind === "call") {
      const pay = Math.min(toCall, p.chips);
      p.chips -= pay;
      p.streetBet += pay;
      if (p.chips === 0) p.allIn = true;
      this.seatsActed.add(seat);
      this.log(`${p.name} קול ${pay}`);
      this.afterAction();
      return { ok: true };
    }
    if (kind === "raise") {
      const target = raiseTo ?? this.currentMaxBet + this.minRaise;
      const add = target - p.streetBet;
      if (add > p.chips) return { ok: false, error: "אין מספיק צ'יפים" };
      if (add < p.chips && target < this.currentMaxBet + this.minRaise) {
        return { ok: false, error: "רייז קטן מדי" };
      }
      p.chips -= add;
      p.streetBet += add;
      if (p.chips === 0) p.allIn = true;
      const newMax = p.streetBet;
      const inc = newMax - this.currentMaxBet;
      if (inc > 0) {
        this.lastRaiseSize = inc;
        this.minRaise = Math.max(this.config.bigBlind, inc);
      }
      this.currentMaxBet = newMax;
      this.markBettingChange();
      this.seatsActed.add(seat);
      this.log(`${p.name} מעלה ל-${p.streetBet}`);
      this.afterAction();
      return { ok: true };
    }
    return { ok: false, error: "פעולה לא ידועה" };
  }

  private afterAction() {
    const alive = this.playersInHand();
    if (alive.length === 1) {
      this.collectStreetToPot();
      this.awardPotSingle();
      return;
    }
    if (this.bettingRoundDone()) {
      if (
        this.street === "preflop" &&
        !this.bbPreflopOptionDone &&
        this.currentMaxBet === this.config.bigBlind
      ) {
        const bb = this.bigBlindSeatThisHand;
        const bbp = this.seats[bb];
        if (bbp && !bbp.folded && !bbp.allIn && bbp.chips > 0) {
          this.bbPreflopOptionDone = true;
          this.actionSeat = bb;
          this.setTimer();
          return;
        }
      }
      this.clearTimer();
      this.advanceStreet();
      return;
    }
    const next = this.nextActorFrom(this.actionSeat);
    if (next < 0) {
      this.clearTimer();
      this.advanceStreet();
      return;
    }
    this.actionSeat = next;
    this.setTimer();
  }

  private awardPotSingle() {
    const w = this.playersInHand()[0];
    if (w) {
      w.chips += this.pot;
      this.log(`${w.name} זוכה בפוט ($${this.pot})`);
    }
    this.pot = 0;
    this.handFinished = true;
    this.actionSeat = -1;
    this.clearTimer();
    this.dealer = this.nextSeat(this.dealer);
  }

  private showdown() {
    this.collectStreetToPot();
    const alive = this.playersInHand();
    let best: HandScore | null = null;
    const winners: SeatPlayer[] = [];
    for (const pl of alive) {
      const sc = bestHoldemScore(pl.hole, this.board);
      if (!best || this.cmpScore(sc, best) > 0) {
        best = sc;
        winners.length = 0;
        winners.push(pl);
      } else if (best && this.cmpScore(sc, best) === 0) {
        winners.push(pl);
      }
    }
    const share = Math.floor(this.pot / winners.length);
    for (const w of winners) {
      w.chips += share;
    }
    const rem = this.pot - share * winners.length;
    if (rem > 0 && winners[0]) winners[0]!.chips += rem;
    this.log(`שודאון: ${winners.map((w) => w.name).join(", ")} — $${this.pot}`);
    this.pot = 0;
    this.handFinished = true;
    this.actionSeat = -1;
    this.clearTimer();
    this.dealer = this.nextSeat(this.dealer);
  }

  private cmpScore(a: HandScore, b: HandScore): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] ?? -1;
      const y = b[i] ?? -1;
      if (x !== y) return x - y;
    }
    return 0;
  }

  timeoutSeat(seat: number) {
    const pl = this.seats[seat];
    if (!pl || this.actionSeat !== seat || this.handFinished) return;
    pl.folded = true;
    this.seatsActed.add(seat);
    this.log(`${pl.name} נפל בזמן`);
    this.afterAction();
  }

  tryStartHand() {
    const ready = this.seats.filter((p): p is SeatPlayer => !!p && p.chips > 0);
    if (ready.length >= 2 && this.handFinished) {
      this.startHand();
    }
  }

  toPublicView(forPlayerId?: string) {
    const players = this.seats.map((p, i) => {
      if (!p)
        return {
          seat: i,
          empty: true as const,
        };
      const isSelf = forPlayerId === p.id;
      const showHole = isSelf || (this.handFinished && !p.folded);
      return {
        seat: i,
        empty: false as const,
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        chips: p.chips,
        streetBet: p.streetBet,
        folded: p.folded,
        allIn: p.allIn,
        isDealer: i === this.dealer,
        isTurn: i === this.actionSeat,
        cards: showHole ? p.hole : p.hole.map(() => ({ suit: "spades" as const, value: "?" })),
      };
    });
    const me = forPlayerId ? this.seats.find((x) => x?.id === forPlayerId) : null;
    const toCall = me ? Math.max(0, this.currentMaxBet - me.streetBet) : 0;
    return {
      players,
      board: this.board,
      pot: this.pot,
      street: this.street,
      handNumber: this.handNumber,
      handFinished: this.handFinished,
      actionSeat: this.actionSeat,
      currentMaxBet: this.currentMaxBet,
      minRaise: this.minRaise,
      smallBlind: this.config.smallBlind,
      bigBlind: this.config.bigBlind,
      actionLog: [...this.actionLog],
      turnDeadline: this.turnDeadline,
      toCall,
    };
  }
}

export type TablePublicView = ReturnType<HoldemEngine["toPublicView"]>;
