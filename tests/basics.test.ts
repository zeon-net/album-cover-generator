import { describe, expect, it } from 'vitest';
import { contrast, jitter, mix, parseHex, toHex } from '../src/color';
import { designLabel } from '../src/design';
import { INK_DARK, INK_LIGHT, PALETTES } from '../src/palettes';
import { Random, hashString } from '../src/random';

describe('Random', () => {
  it('repeats the same numbers for the same seed', () => {
    const a = new Random(42);
    const b = new Random(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()));
  });

  it('gives each fork its own stream, decided by the seed alone', () => {
    const random = new Random(7);
    const first = random.fork('emblem').next();
    random.next();
    expect(random.fork('emblem').next()).toBe(first);
    expect(random.fork('scene').next()).not.toBe(first);
  });

  it('keeps integers inside their bounds', () => {
    const random = new Random(1);
    const values = Array.from({ length: 2000 }, () => random.int(3, 6));
    expect(Math.min(...values)).toBe(3);
    expect(Math.max(...values)).toBe(6);
  });

  it('hashes strings as FNV-1a', () => {
    expect(hashString('')).toBe(0x811c9dc5);
    expect(hashString('a')).toBe(0xe40c292c);
  });
});

describe('colours', () => {
  it('round-trips hex', () => {
    expect(toHex(parseHex('#0dc0b6'))).toBe('#0dc0b6');
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
  });

  it('measures WCAG contrast', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('jitters a colour only a little', () => {
    const random = new Random(3);
    for (const palette of PALETTES) expect(contrast(jitter(palette.background, random, 5, 0.03), palette.background)).toBeLessThan(1.35);
  });
});

describe('palettes', () => {
  it('has 25 palettes', () => {
    expect(PALETTES).toHaveLength(25);
    expect(new Set(PALETTES.map((p) => p.id)).size).toBe(25);
  });

  it('prints each logo in an ink that reads on its label', () => {
    for (const palette of PALETTES.filter((p) => !p.spectrum)) {
      expect(contrast(palette.ink, palette.background), palette.id).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('swaps the spectrum palette\'s navy ink (2.7:1 on its blue) for one that reads', () => {
    const spectrum = PALETTES.find((p) => p.spectrum)!;
    expect(contrast(spectrum.ink, spectrum.background)).toBeLessThan(4.5);
    const design = designLabel({ seed: 1, palette: 'spectrum', background: 'flat' });
    expect(contrast(design.colors.ink, design.colors.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('uses the two main inks everywhere but the spectrum palette', () => {
    expect(PALETTES.filter((p) => p.ink !== INK_DARK && p.ink !== INK_LIGHT).map((p) => p.id)).toEqual(['spectrum']);
  });
});
