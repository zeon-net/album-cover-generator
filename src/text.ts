import { DEFAULT_BRAND_FONT, DEFAULT_TEXT_FONT, fontSpec } from './fonts';
import { EMBLEM_BOX, LABEL } from './parts';
import { escapeXml, n } from './svg';

const { cx, cy, r: R, hole } = LABEL;

export interface FontSpec {
  /** A CSS font-family list. */
  readonly family: string;
  readonly weight: number;
  /** Average glyph width against the default condensed text font, for estimating without a browser. */
  readonly width?: number;
  /** The font's file, for fonts that aren't installed: the family name it declares, and where it is. */
  readonly face?: { readonly name: string; readonly src: string };
}

export interface Fonts {
  /** The logo: a heavy geometric sans. */
  readonly brand: FontSpec;
  /** "STEREO", "Side A" and the title: a condensed bold. */
  readonly label: FontSpec;
}

/**
 * System fonts, so an SVG drawn into a canvas (which can't fetch fonts) still finds them. Other fonts
 * come from `fonts.ts`, embedded with `embedFonts`.
 */
export const DEFAULT_FONTS: Fonts = { brand: fontSpec(DEFAULT_BRAND_FONT), label: fontSpec(DEFAULT_TEXT_FONT) };

export type MeasureText = (text: string, font: FontSpec & { readonly size: number }) => number;

/**
 * A slightly generous width estimate for a condensed bold, for use without a browser.
 * The browser demo measures with a canvas instead; see `canvasMeasure` in raster.ts.
 */
export const estimateWidth: MeasureText = (text, font) => {
  const { size } = font;
  let em = 0;
  for (const ch of text) {
    if (/[Il1!|.,:;'’]/.test(ch)) em += 0.27;
    else if (ch === ' ') em += 0.25;
    else if (/[MW]/.test(ch)) em += 0.74;
    else if (/[mw]/.test(ch)) em += 0.7;
    else if (/[ijlft]/.test(ch)) em += 0.3;
    else if (/[A-Z]/.test(ch)) em += 0.54;
    else if (/[0-9]/.test(ch)) em += 0.5;
    else if (/[a-z]/.test(ch)) em += 0.48;
    else if (ch.codePointAt(0)! >= 0x2e80) em += 1;
    else em += 0.55;
  }
  return em * size * 1.06 * (font.width ?? 1);
};

/** The largest size up to `max` at which `text`, with its letter spacing (in ems), fits in `room`. */
function fitSize(text: string, spec: FontSpec, measure: MeasureText, max: number, room: number, spacing: number): number {
  const perPixel = measure(text, { ...spec, size: 100 }) / 100 + Math.max(0, [...text].length - 1) * spacing;
  return perPixel > 0 ? Math.min(max, room / perPixel) : max;
}

export interface TitleLine {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  /** When set, the line is squeezed to this width (SVG textLength) because nothing smaller fitted. */
  readonly squeeze?: number;
}

const TITLE_CENTRE = cy + hole + (R - hole) * 0.48;
const TITLE_SPACING = 0.02;
const MARGIN = 36;
const MAX_TITLE = 60;

/** The width available between the label's edges for text spanning `top` to `bottom`. */
function widthBetween(top: number, bottom: number): number {
  const far = Math.max(Math.abs(top - cy), Math.abs(bottom - cy));
  if (far >= R) return 0;
  return 2 * (Math.sqrt(R * R - far * far) - MARGIN);
}

/** Where a title goes: its block's centre, the room a line has, and the sizes to try for one line and for two. */
export interface TitleFrame {
  readonly centre: number;
  readonly room: (top: number, bottom: number) => number;
  readonly single: readonly [number, number];
  readonly double: readonly [number, number];
}

/** Below the label's hole, between its curved edges. */
export const LABEL_TITLE: TitleFrame = { centre: TITLE_CENTRE, room: widthBetween, single: [66, 40], double: [54, 32] };

/** Across the bottom of a square cover. */
export const COVER_TITLE: TitleFrame = { centre: 868, room: () => 860, single: [100, 48], double: [76, 40] };

/**
 * Fits the title: one line as large as it fits, else two balanced lines, else squeezed. Long titles
 * are cut with an ellipsis.
 */
export function layoutTitle(title: string, measure: MeasureText, font: FontSpec, frame: TitleFrame = LABEL_TITLE): TitleLine[] {
  const text = [...title].length > MAX_TITLE ? [...title].slice(0, MAX_TITLE - 1).join('').trimEnd() + '…' : title;
  if (!text.trim()) return [];
  const descender = /[a-z]/.test(text) ? 0.22 : 0.04;
  const width = (line: string, size: number) => measure(line, { ...font, size }) + Math.max(0, [...line].length - 1) * TITLE_SPACING * size;
  const [singleMax, singleMin] = frame.single;
  const [doubleMax, doubleMin] = frame.double;

  for (let size = singleMax; size >= singleMin; size -= 2) {
    const cap = size * 0.72;
    const baseline = frame.centre + cap / 2;
    if (width(text, size) <= frame.room(baseline - cap, baseline + size * descender)) return [{ text, x: cx, y: baseline, size }];
  }

  const words = text.split(' ');
  if (words.length > 1) {
    // The split that makes the longer line shortest.
    let best = { first: text, second: '', longest: Infinity };
    for (let i = 1; i < words.length; i++) {
      const first = words.slice(0, i).join(' ');
      const second = words.slice(i).join(' ');
      const longest = Math.max(width(first, doubleMin), width(second, doubleMin));
      if (longest < best.longest) best = { first, second, longest };
    }
    const place = (size: number) => {
      const cap = size * 0.72;
      const leading = size * 1.08;
      const first = frame.centre - (leading + cap) / 2 + cap;
      return [first, first + leading] as const;
    };
    for (let size = doubleMax; size >= doubleMin; size -= 2) {
      const cap = size * 0.72;
      const [y1, y2] = place(size);
      if (width(best.first, size) <= frame.room(y1 - cap, y1 + size * descender) && width(best.second, size) <= frame.room(y2 - cap, y2 + size * descender)) {
        return [
          { text: best.first, x: cx, y: y1, size },
          { text: best.second, x: cx, y: y2, size },
        ];
      }
    }
    const size = doubleMin;
    const cap = size * 0.72;
    const [y1, y2] = place(size);
    return [best.first, best.second].map((line, i) => {
      const y = i === 0 ? y1 : y2;
      const room = frame.room(y - cap, y + size * descender);
      return { text: line, x: cx, y, size, ...(width(line, size) > room ? { squeeze: room } : {}) };
    });
  }

  const size = singleMin;
  const cap = size * 0.72;
  const baseline = frame.centre + cap / 2;
  return [{ text, x: cx, y: baseline, size, squeeze: frame.room(baseline - cap, baseline + size * descender) }];
}

export interface LabelText {
  readonly brand: string;
  readonly stereo: string;
  readonly side: string;
  readonly title: string;
}

/** The label's printing: the brand at the top, "STEREO" over the emblem, the side right of the hole, the title below. */
export function drawText(text: LabelText, ink: string, fonts: Fonts, measure: MeasureText): string {
  const font = (spec: FontSpec, size: number, spacing: number) =>
    `font-family="${escapeXml(spec.family)}" font-weight="${spec.weight}" font-size="${n(size)}" letter-spacing="${n(spacing)}" fill="${ink}" text-anchor="middle"`;
  let out = '';
  if (text.brand) {
    const size = fitSize(text.brand, fonts.brand, measure, 120, widthBetween(cy - R * 0.79, cy - R * 0.6) * 0.92, 0.02);
    out += `<text x="${cx}" y="${n(cy - R * 0.6)}" ${font(fonts.brand, size, size * 0.02)}>${escapeXml(text.brand)}</text>`;
  }
  // Each sized to its room: "STEREO" above the emblem, the side between the hole and the edge.
  if (text.stereo) {
    const size = fitSize(text.stereo, fonts.label, measure, 44, 200, 0.07);
    out += `<text x="${n(EMBLEM_BOX.cx)}" y="${n(cy - R * 0.25)}" ${font(fonts.label, size, size * 0.07)}>${escapeXml(text.stereo)}</text>`;
  }
  if (text.side) {
    const size = fitSize(text.side, fonts.label, measure, 56, R - hole - 44, 0.02);
    out += `<text x="${n(cx + R * 0.69)}" y="${n(cy + size * 0.34)}" ${font(fonts.label, size, size * 0.02)}>${escapeXml(text.side)}</text>`;
  }
  for (const line of layoutTitle(text.title, measure, fonts.label)) {
    const squeeze = line.squeeze ? ` textLength="${n(line.squeeze)}" lengthAdjust="spacingAndGlyphs"` : '';
    out += `<text x="${n(line.x)}" y="${n(line.y)}"${squeeze} ${font(fonts.label, line.size, line.size * TITLE_SPACING)}>${escapeXml(line.text)}</text>`;
  }
  return out;
}

/** A square cover's printing: the brand across the top, "STEREO" and the side in the top corners like a sleeve badge, the title across the bottom. */
export function drawCoverText(text: LabelText, ink: string, fonts: Fonts, measure: MeasureText): string {
  const attributes = (spec: FontSpec, size: number, spacing: number, anchor: 'start' | 'middle' | 'end') =>
    `font-family="${escapeXml(spec.family)}" font-weight="${spec.weight}" font-size="${n(size)}" letter-spacing="${n(spacing)}" fill="${ink}" text-anchor="${anchor}"`;
  let out = '';
  if (text.brand) {
    const size = fitSize(text.brand, fonts.brand, measure, 150, 820, 0.02);
    out += `<text x="${cx}" y="190" ${attributes(fonts.brand, size, size * 0.02, 'middle')}>${escapeXml(text.brand)}</text>`;
  }
  if (text.stereo) {
    const size = fitSize(text.stereo, fonts.label, measure, 38, 260, 0.1);
    out += `<text x="56" y="84" ${attributes(fonts.label, size, size * 0.1, 'start')}>${escapeXml(text.stereo)}</text>`;
  }
  if (text.side) {
    const size = fitSize(text.side, fonts.label, measure, 38, 260, 0.02);
    out += `<text x="944" y="84" ${attributes(fonts.label, size, size * 0.02, 'end')}>${escapeXml(text.side)}</text>`;
  }
  for (const line of layoutTitle(text.title, measure, fonts.label, COVER_TITLE)) {
    const squeeze = line.squeeze ? ` textLength="${n(line.squeeze)}" lengthAdjust="spacingAndGlyphs"` : '';
    out += `<text x="${n(line.x)}" y="${n(line.y)}"${squeeze} ${attributes(fonts.label, line.size, line.size * TITLE_SPACING, 'middle')}>${escapeXml(line.text)}</text>`;
  }
  return out;
}
