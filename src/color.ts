import type { Random } from './random';

export type Rgb = readonly [number, number, number];

export function parseHex(hex: string): Rgb {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map((ch) => ch + ch).join('') : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Not a colour: ${hex}`);
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

export function toHex([r, g, b]: Rgb): string {
  const part = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** `t` of the way from `a` to `b`, in sRGB. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

export const shade = (hex: string, amount: number): string => mix(hex, '#000000', amount);
export const tint = (hex: string, amount: number): string => mix(hex, '#ffffff', amount);

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 to 21. Large bold text reads from about 3. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function isDark(hex: string): boolean {
  return luminance(hex) < 0.18;
}

function toHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function fromHsl(h: number, s: number, l: number): Rgb {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/** A colour nudged a little in hue and lightness, so two labels on the same palette aren't identical. */
export function jitter(hex: string, random: Random, hueDegrees: number, lightness: number): string {
  const [h, s, l] = toHsl(parseHex(hex));
  const hue = (h + random.range(-hueDegrees, hueDegrees) + 360) % 360;
  const light = Math.min(0.97, Math.max(0.03, l + random.range(-lightness, lightness)));
  return toHex(fromHsl(hue, s, light));
}

/** The candidate with the best contrast against every colour in `against` (its worst case). */
export function bestContrast(candidates: readonly string[], against: readonly string[]): { color: string; ratio: number } {
  let best = { color: candidates[0], ratio: -1 };
  for (const color of candidates) {
    const ratio = Math.min(...against.map((other) => contrast(color, other)));
    if (ratio > best.ratio) best = { color, ratio };
  }
  return best;
}
