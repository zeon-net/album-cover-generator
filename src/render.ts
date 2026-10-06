import { drawBackground } from './backgrounds';
import { designLabel, type LabelDesign, type LabelOptions } from './design';
import { drawEmblem } from './emblems';
import { LABEL, type DrawContext, type Layout } from './parts';
import { Random, hashString } from './random';
import { drawScene } from './scenes';
import { isDark } from './color';
import { escapeXml, ringPath } from './svg';
import { DEFAULT_FONTS, drawCoverText, drawText, estimateWidth, type FontSpec, type Fonts, type MeasureText } from './text';
import { coverDefs, drawCoverWear, drawWear, labelMask, textureDefs } from './texture';
import { SPINDLE, drawVinyl } from './vinyl';
import { fontFaceCss } from './fonts';

/** The record's radius in the 1000×1000 drawing, and the label's radius on it. */
const RECORD = 497;
const LABEL_ON_RECORD = 320;

export type Shape = 'record' | 'label' | 'cover' | 'sleeve';

export interface RenderOptions {
  /**
   * 'record' (the default): the label on an old black record, transparent outside the record and in
   * the centre hole. 'label': the label alone, transparent outside it. 'cover': the same design as a
   * square sleeve, with no record and no hole. 'sleeve': the cover with the record half out of it, 3:2.
   */
  readonly shape?: Shape;
  /**
   * For a record or a label, the big centre hole: 'open' (the default), through label and record as on
   * a real single, or 'vinyl', filled with black record down to a small spindle hole.
   */
  readonly centre?: 'vinyl' | 'open';
  /** The SVG's height in pixels (and width, except a sleeve's, which is 1.5 times it). It scales cleanly. Defaults to 1000. */
  readonly size?: number;
  readonly fonts?: { readonly brand?: Partial<FontSpec>; readonly label?: Partial<FontSpec> };
  /** @font-face rules (with data: URLs) to embed, so the fonts survive drawing the SVG into a canvas. */
  readonly fontCss?: string;
  /**
   * Embed the chosen fonts' files in the SVG, so a downloaded SVG or an exported PNG shows them on
   * any machine. Their sources must be data: URLs for that (`loadFont` and `readFont` make them).
   * Leave it off for drawing on a page that has loaded the fonts already: it keeps the SVG small.
   */
  readonly embedFonts?: boolean;
  /** Measures text for fitting the title. Without it, widths are estimated. */
  readonly measure?: MeasureText;
}

interface Drawing {
  readonly design: LabelDesign;
  readonly defs: string[];
  readonly fonts: Fonts;
  readonly measure: MeasureText;
  readonly centre: 'vinyl' | 'open';
}

/** Draws a designed label as an SVG string. The same design and options always give the same text. */
export function renderLabel(design: LabelDesign, options: RenderOptions = {}): string {
  const shape = options.shape ?? 'record';
  const centre = options.centre ?? 'open';
  const size = options.size ?? 1000;
  const fonts: Fonts = {
    brand: { ...DEFAULT_FONTS.brand, ...options.fonts?.brand },
    label: { ...DEFAULT_FONTS.label, ...options.fonts?.label },
  };
  // Ids depend on everything drawn, so two different labels inline on one page never share a gradient.
  // Embedded files (a font, an image) count by their length: hashing a whole file on every draw would be slow.
  const byLength = (key: string, value: unknown) => ((key === 'src' || key === 'href') && typeof value === 'string' ? value.length : value);
  const id = `ac${hashString(JSON.stringify(design, byLength) + shape + centre + JSON.stringify(fonts, byLength)).toString(36)}`;
  const drawing: Drawing = { design, defs: [], fonts, measure: options.measure ?? estimateWidth, centre };

  let content: string;
  let width = 1000;
  switch (shape) {
    case 'label':
      content = drawLabel(drawing, id, true);
      break;
    case 'record':
      content = drawRecord(drawing, id);
      break;
    case 'cover':
      content = drawCover(drawing, id);
      break;
    case 'sleeve':
      // The cover and the record draw the same parts in different layouts, so each gets its own ids.
      content = drawSleeve(drawing, `${id}r`, `${id}c`);
      width = 1500;
      break;
  }
  const css = (options.embedFonts ? fontFaceCss([fonts.brand, fonts.label]) : '') + (options.fontCss ?? '');
  const style = css ? `<style>${css}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 1000" width="${Math.round((size * width) / 1000)}" height="${size}"><defs>${style}${drawing.defs.join('')}</defs>${content}</svg>`;
}

/** Sizes worth offering for export, from an icon to the 3000 × 3000 that stores and distributors ask for. */
export const EXPORT_SIZES = [64, 128, 256, 512, 640, 1000, 1400, 2000, 3000] as const;
export const MIN_EXPORT_SIZE = 16;
export const MAX_EXPORT_SIZE = 4096;

/**
 * The pixel size of an exported image. `size` is its height, and its width too, except a sleeve's,
 * which is 1.5 times as wide. It's kept between MIN_EXPORT_SIZE and MAX_EXPORT_SIZE.
 */
export function exportDimensions(shape: Shape, size: number): { width: number; height: number } {
  const height = Math.round(Math.min(MAX_EXPORT_SIZE, Math.max(MIN_EXPORT_SIZE, size)));
  return { width: shape === 'sleeve' ? Math.round(height * 1.5) : height, height };
}

/** Designs and draws a label in one call. */
export function generateLabel(options: LabelOptions & RenderOptions = {}): { design: LabelDesign; svg: string } {
  const design = designLabel(options);
  return { design, svg: renderLabel(design, options) };
}

/**
 * The background, scene and emblem for one layout. Every layout draws from the same random streams,
 * so a song's cover and label share their shapes, only laid out differently.
 */
function drawArt(drawing: Drawing, id: string, layout: Layout): { art: string; random: Random } {
  const { design, defs } = drawing;
  const random = new Random(design.seed);
  const context = (part: string): DrawContext => ({ layout, random: random.fork(part), id, defs, colors: design.colors });
  const art = design.image
    ? drawImage(design.image, design.colors.ink, id, layout, defs)
    : drawBackground(design.background, context('background')) + drawScene(design.scene, context('scene')) + drawEmblem(design.emblem, context('emblem'));
  defs.push(textureDefs(id, random.fork('texture'), design.texture));
  return { art, random };
}

/**
 * Given artwork, filling the square (cropped to fit, never stretched), with a soft fade behind the
 * brand at the top and the title at the bottom, so they read on any picture.
 */
function drawImage(image: NonNullable<LabelDesign['image']>, ink: string, id: string, layout: Layout, defs: string[]): string {
  // The fade is the ink's opposite: dark behind light text, light behind dark text.
  const lightFade = isDark(ink);
  const fade = lightFade ? '#fff' : '#000';
  const strength = lightFade ? 0.55 : 0.62;
  const [clearFrom, clearTo] = layout === 'cover' ? [0.34, 0.65] : [0.33, 0.69];
  defs.push(
    `<linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${fade}" stop-opacity="${strength}"/><stop offset="${clearFrom}" stop-color="${fade}" stop-opacity="0"/>` +
      `<stop offset="${clearTo}" stop-color="${fade}" stop-opacity="0"/><stop offset="1" stop-color="${fade}" stop-opacity="${strength}"/></linearGradient>`,
  );
  return (
    `<image href="${escapeXml(image.href)}" x="0" y="0" width="1000" height="1000" preserveAspectRatio="xMidYMid slice"/>` +
    `<rect width="1000" height="1000" fill="url(#${id}-fade)"/>`
  );
}

function printed(id: string, strength: number, body: string): string {
  return strength > 0 ? `<g filter="url(#${id}-print)">${body}</g>` : body;
}

/** The round label, with its own vinyl centre if `alone` and the centre is filled. */
function drawLabel(drawing: Drawing, id: string, alone: boolean): string {
  const { design, defs, fonts, measure } = drawing;
  const strength = design.texture;
  const { art, random } = drawArt(drawing, id, 'label');
  defs.push(labelMask(id, strength));
  const wear = strength > 0 ? drawWear(id, random.fork('wear'), strength) : '';
  const label = `<g mask="url(#${id}-label)">${printed(id, strength, art + drawText(design.text, design.colors.ink, fonts, measure) + wear)}</g>`;
  if (!alone || drawing.centre !== 'vinyl') return label;
  return drawVinyl(id, random.fork('vinyl'), defs, { outer: LABEL.hole + 24, spindle: SPINDLE, holeEdge: LABEL.hole, wear: strength }) + label;
}

/** The label on an old black record, centred in a 1000×1000 square. */
function drawRecord(drawing: Drawing, id: string): string {
  const scale = LABEL_ON_RECORD / LABEL.r;
  const record = drawVinyl(id, new Random(drawing.design.seed).fork('vinyl'), drawing.defs, {
    outer: RECORD,
    ...(drawing.centre === 'vinyl' ? { spindle: SPINDLE * scale } : {}),
    holeEdge: LABEL.hole * scale,
    labelEdge: LABEL_ON_RECORD,
    wear: drawing.design.texture,
  });
  return record + `<g transform="translate(500 500) scale(${Math.round(scale * 1000) / 1000}) translate(-500 -500)">${drawLabel(drawing, id, false)}</g>`;
}

/** The design as a square sleeve. */
function drawCover(drawing: Drawing, id: string): string {
  const { design, defs, fonts, measure } = drawing;
  const strength = design.texture;
  const { art, random } = drawArt(drawing, id, 'cover');
  defs.push(coverDefs(id, strength));
  // Designs saved before these switches existed draw both marks.
  const wear = strength > 0 ? drawCoverWear(id, random.fork('wear'), strength, design.coverWear ?? { ring: true, edges: true }) : '';
  return printed(id, strength, art + drawCoverText(design.text, design.colors.ink, fonts, measure) + wear);
}

/**
 * The cover with the record half out of it, to the right: the record's centre sits on the sleeve's
 * edge, and the sleeve casts a soft shadow across it.
 */
function drawSleeve(drawing: Drawing, recordId: string, coverId: string): string {
  const { defs } = drawing;
  const hole = drawing.centre === 'vinyl' ? SPINDLE * (LABEL_ON_RECORD / LABEL.r) : LABEL.hole * (LABEL_ON_RECORD / LABEL.r);
  defs.push(
    `<linearGradient id="${coverId}-edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`,
    // The shadow falls on the record only, never into its open centre.
    `<clipPath id="${coverId}-disc"><path d="${ringPath(1000, 500, RECORD, hole)}" clip-rule="evenodd"/></clipPath>`,
  );
  return (
    `<g transform="translate(500 0)">${drawRecord(drawing, recordId)}</g>` +
    `<rect x="1000" y="0" width="70" height="1000" fill="url(#${coverId}-edge)" clip-path="url(#${coverId}-disc)"/>` +
    drawCover(drawing, coverId) +
    // The sleeve's paper edge.
    `<rect x="997" y="0" width="3" height="1000" fill="#fff" fill-opacity="0.18"/>`
  );
}
