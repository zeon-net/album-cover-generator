/** 32-bit FNV-1a hash of a string's UTF-8 bytes. */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return hash >>> 0;
}

/**
 * A seeded random stream (sfc32). The same seed always gives the same numbers, so a song keeps its label.
 * `fork` gives each part of the label its own stream: a change to how the scene draws doesn't reshuffle the emblem.
 */
export class Random {
  readonly seed: number;
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    // splitmix32 spreads one 32-bit seed over sfc32's four words.
    let s = this.seed;
    const split = () => {
      s = (s + 0x9e3779b9) >>> 0;
      let z = s;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
      return (z ^ (z >>> 16)) >>> 0;
    };
    this.a = split();
    this.b = split();
    this.c = split();
    this.d = split();
    for (let i = 0; i < 12; i++) this.next();
  }

  /** A number in [0, 1). */
  next(): number {
    const t = (((this.a + this.b) >>> 0) + this.d) >>> 0;
    this.d = (this.d + 1) >>> 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = ((this.c << 21) | (this.c >>> 11)) >>> 0;
    this.c = (this.c + t) >>> 0;
    return t / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** An integer from `min` to `max`, both included. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Random.pick: no items');
    return items[Math.floor(this.next() * items.length)];
  }

  /** Picks by weight; entries with weight 0 are never picked. */
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
    if (total <= 0) throw new Error('Random.weighted: no positive weights');
    let roll = this.next() * total;
    for (const [item, weight] of entries) {
      roll -= Math.max(0, weight);
      if (roll < 0) return item;
    }
    return entries[entries.length - 1][0];
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** An independent stream for one part of the design, decided by this stream's seed and the part's name. */
  fork(label: string): Random {
    return new Random((this.seed ^ hashString(label)) >>> 0);
  }
}
