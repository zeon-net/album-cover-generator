import { bestContrast, contrast, isDark, jitter, luminance, mix, parseHex, shade, tint } from './color';
import { INK_DARK, INK_LIGHT, INK_PRESETS, PALETTES, paletteById, type InkPreset, type Palette } from './palettes';
import { ABSTRACT_KINDS, MOTIF_KINDS, type BackgroundKind, type EmblemKind, type LabelColors, type SceneKind } from './parts';
import { Random, hashString } from './random';
import type { CoverWear } from './texture';
import { THEMES, matchTitle, type ThemeId, type TitleMatch } from './themes';

export interface LabelOptions {
  /** The song's title: printed below the hole, and read for a theme and colour words. */
  readonly title?: string;
  /** A stable id for the song, so it always gets the same label. Defaults to the title. */
  readonly seed?: string | number;
  /** Forces one of the palettes in palettes.ts. */
  readonly palette?: string;
  /** 'auto' (the default) reads the title; 'none' ignores it; a theme id forces that theme. */
  readonly theme?: ThemeId | 'auto' | 'none';
  readonly background?: BackgroundKind;
  readonly scene?: SceneKind;
  readonly emblem?: EmblemKind;
  /**
   * The wordmark at the top: the user's own label name, from their settings. Missing or blank, it's
   * "ZEON"; `false` prints no brand at all.
   */
  readonly brand?: string | false;
  /** The small print top left. Defaults to "STEREO", or to nothing over an image. */
  readonly stereo?: string;
  /** The side, right of the hole. Defaults to "Side A", or to nothing over an image. */
  readonly side?: string;
  /**
   * Artwork to use instead of the generated background, scene and emblem: an AI cover or a user's
   * upload. Only the brand and the title are printed over it. Use a data: URL (see `readImage`) so it
   * survives drawing into a canvas; a plain URL only shows on a page.
   */
  readonly image?: string;
  /**
   * Whether the image is dark or light where the brand and title go (`readImage` measures it).
   * Dark gets cream ink on a dark fade, light gets near-black ink on a light fade. Defaults to 'dark'.
   */
  readonly imageTone?: 'dark' | 'light';
  /**
   * The ink colour: 'auto' (the default), the ink that reads best, or one of the presets in
   * `INK_PRESETS`. A preset is the user's call: it colours the brand, the title, the small print and
   * the emblem, with no readability check, and the rest of the label stays as with 'auto'. Over an
   * image, the fade behind the text follows it.
   */
  readonly ink?: InkPreset | 'auto';
  /** Print the title in capitals, as old labels did. Defaults to true. */
  readonly uppercase?: boolean;
  /** Grain and wear, from 0 (clean) to 1 (well played). Defaults to 0.6. */
  readonly texture?: number;
  /** On a cover (and sleeve): draw the dashed ring wear, where the record rubbed the sleeve. Defaults to true. */
  readonly ringWear?: boolean;
  /** On a cover (and sleeve): draw the dashed rubbed edges and corners. Defaults to true. */
  readonly edgeWear?: boolean;
}

/** Every decision behind one label, as plain JSON: render it again and it comes out the same. */
export interface LabelDesign {
  readonly version: 1;
  readonly seed: number;
  readonly title: string;
  readonly match: TitleMatch;
  readonly theme: ThemeId | null;
  readonly palette: string;
  readonly background: BackgroundKind;
  readonly scene: SceneKind;
  readonly emblem: EmblemKind;
  readonly colors: LabelColors;
  readonly text: { readonly brand: string; readonly stereo: string; readonly side: string; readonly title: string };
  readonly texture: number;
  /** Which of a cover's worn marks are drawn. */
  readonly coverWear?: CoverWear;
  /** The artwork the label is printed over, if one was given. */
  readonly image?: { readonly href: string; readonly tone: 'dark' | 'light' };
}

/** The brand when none is configured. */
export const DEFAULT_BRAND = 'ZEON';

/** Large bold text reads from a contrast of about 3; the title and logo get a little more. */
const TEXT_CONTRAST = 3.2;
const LOGO_CONTRAST = 4.5;

const BACKGROUND_WEIGHTS: readonly (readonly [BackgroundKind, number])[] = [
  ['flat', 3],
  ['rings', 2],
  ['sunburst', 1.2],
  ['gradient', 1.5],
  ['split', 1.2],
  ['stripes', 0.8],
  ['starfield', 1.5],
  ['spectrum', 0.25],
];

const SCENE_WEIGHTS: readonly (readonly [SceneKind, number])[] = [
  ['none', 4],
  ['waves', 1],
  ['mountains', 1],
  ['dunes', 1],
  ['hills', 1],
  ['skyline', 0.8],
  ['beach', 0.6],
];

const EMBLEM_WEIGHTS: readonly (readonly [EmblemKind, number])[] = [
  ...MOTIF_KINDS.map((kind) => [kind, 1] as const),
  ...ABSTRACT_KINDS.map((kind) => [kind, 0.8] as const),
];

export function seedOf(options: LabelOptions): number {
  if (typeof options.seed === 'number') return options.seed >>> 0;
  return hashString(String(options.seed ?? options.title ?? 'zeon'));
}

/** Decides a label from the options: theme, palette, parts and every colour. */
export function designLabel(options: LabelOptions = {}): LabelDesign {
  const title = options.title ?? '';
  const seed = seedOf(options);
  const random = new Random(seed);
  const match = matchTitle(title);
  const theme = options.theme === 'none' ? null : options.theme && options.theme !== 'auto' ? options.theme : match.theme;
  const themed = theme ? THEMES[theme] : null;

  if (options.ink && options.ink !== 'auto' && !(options.ink in INK_PRESETS)) throw new Error(`No text colour called ${options.ink}`);
  const preset = options.ink && options.ink !== 'auto' ? INK_PRESETS[options.ink].color : undefined;

  const pick = random.fork('choices');
  const palette = paletteById(
    options.palette ??
      (match.palettes.length > 0 ? pick.pick(match.palettes) : themed && pick.chance(0.8) ? pick.pick(themed.palettes) : pick.pick(PALETTES).id),
  );

  let emblem: EmblemKind = options.emblem ?? (themed && pick.chance(0.85) ? pick.pick(themed.emblems) : pick.weighted(EMBLEM_WEIGHTS));
  let scene: SceneKind = options.scene ?? (themed && pick.chance(0.75) ? pick.pick(themed.scenes) : pick.weighted(SCENE_WEIGHTS));
  let background: BackgroundKind =
    options.background ??
    (palette.spectrum && pick.chance(0.65) ? 'spectrum' : themed && pick.chance(0.7) ? pick.pick(themed.backgrounds) : pick.weighted(BACKGROUND_WEIGHTS));

  const colors = chooseColors(palette, random.fork('colors'));
  const drawn = { ...colors };

  // Fall back where the palette can't support a part.
  if (background === 'starfield' && !isDark(colors.background)) background = 'flat';
  if (background === 'spectrum' && colors.spectrum.length < 3) background = 'flat';
  if (background === 'stripes' && colors.stripes.length < 3) background = 'flat';
  if (background === 'stripes' && !options.emblem) emblem = 'none';
  if (background === 'spectrum') {
    // On a rainbow, the ink must read on every hue.
    const ink = bestContrast([palette.ink, INK_DARK, INK_LIGHT], colors.spectrum).color;
    Object.assign(drawn, { ink, backgroundAlt: colors.spectrum.filter((color) => contrast(color, ink) >= 2.5) });
  }
  const layers = sceneLayers(scene, drawn, random.fork('scene-colors'));
  if (layers.length === 0) scene = 'none';

  // A chosen ink is the user's call: it goes on the text and the emblem, with no readability check,
  // and everything else stays as it was. The emblem's other colours stay too, unless one would vanish
  // against the ink; that one takes the emblem's old main colour.
  if (preset) {
    const [main, second, third] = drawn.emblem;
    const keep = (color: string) => (contrast(color, preset) >= 1.3 ? color : main);
    Object.assign(drawn, { ink: preset, emblem: [preset, keep(second), keep(third)] });
  }

  // Over an image, nothing is drawn but the printing, in the ink that reads on the image's tone.
  const image = options.image ? { href: options.image, tone: options.imageTone ?? 'dark' } : undefined;
  if (image) {
    emblem = 'none';
    scene = 'none';
    background = 'flat';
    Object.assign(drawn, { ink: preset ?? (image.tone === 'dark' ? INK_LIGHT : INK_DARK) });
  }
  const brand = options.brand === false ? '' : options.brand?.trim() || DEFAULT_BRAND;

  return {
    version: 1,
    seed,
    title,
    match,
    theme,
    palette: palette.id,
    background,
    scene,
    emblem,
    colors: { ...drawn, scene: image ? [] : layers },
    text: {
      brand,
      stereo: options.stereo ?? (image ? '' : 'STEREO'),
      side: options.side ?? (image ? '' : 'Side A'),
      title: options.uppercase === false ? title : title.toLocaleUpperCase(),
    },
    texture: Math.min(1, Math.max(0, options.texture ?? 0.6)),
    coverWear: { ring: options.ringWear ?? true, edges: options.edgeWear ?? true },
    ...(image ? { image } : {}),
  };
}

/** Picks every colour from one palette, nudged a little so no two labels match exactly. */
function chooseColors(palette: Palette, random: Random): LabelColors {
  const accents = palette.accents.map((color) => jitter(color, random, 4, 0.025));
  // Now and then a mid-tone accent strong enough to carry the logo becomes the background.
  // Near-black and near-white accents are emblem and text colours, never a whole label.
  const swaps = accents.filter(
    (color) =>
      luminance(color) > 0.05 &&
      luminance(color) < 0.75 &&
      Math.max(contrast(color, INK_DARK), contrast(color, INK_LIGHT)) >= 6 &&
      contrast(color, palette.background) >= 1.6,
  );
  const base = swaps.length > 0 && random.chance(0.15) ? random.pick(swaps) : palette.background;
  const background = jitter(base, random, 5, 0.03);
  const others = [palette.background, ...accents].filter((color) => color !== base);

  const ink = contrast(palette.ink, background) >= LOGO_CONTRAST ? palette.ink : bestContrast([palette.ink, INK_DARK, INK_LIGHT], [background]).color;
  // Lighter or darker versions of a colour, away from the ink, so text stays readable on them.
  const away = (color: string, t: number) => (isDark(ink) ? tint(color, t) : shade(color, t));
  const toward = (color: string, t: number) => (isDark(ink) ? shade(color, t) : tint(color, t));

  const altCandidates = [...random.shuffle(others), away(background, 0.2), toward(background, 0.12), away(background, 0.35), mix(background, others[0] ?? background, 0.5)];
  const backgroundAlt = unique(altCandidates.filter((color) => contrast(color, ink) >= TEXT_CONTRAST && contrast(color, background) >= 1.12)).slice(0, 3);
  if (backgroundAlt.length === 0) backgroundAlt.push(away(background, 0.15));

  const emblemCandidates = unique([...others, ink, isDark(background) ? INK_LIGHT : INK_DARK]);
  const visible = emblemCandidates.filter((color) => contrast(color, background) >= 2);
  const main = visible.length > 0 && random.chance(0.75) ? random.pick(visible) : ink;
  // Deeper and lighter versions of the palette's own colours, so a palette with few accents still
  // has a colourful second and third colour instead of a grey from the ink.
  const variants = [...others, background].flatMap((color) => [shade(color, 0.35), tint(color, 0.35)]);
  const secondPool = unique([...emblemCandidates, ...variants, away(main, 0.4), toward(main, 0.3)]).filter(
    (color) => color !== main && contrast(color, main) >= 1.6 && contrast(color, background) >= 1.3,
  );
  const second = secondPool.length > 0 ? random.pick(preferColourful(secondPool).slice(0, 3)) : mix(main, background, 0.5);
  const thirdPool = secondPool.filter((color) => color !== second && contrast(color, second) >= 1.3);
  const third = thirdPool.length > 0 ? random.pick(preferColourful(thirdPool).slice(0, 3)) : mix(main, second, 0.5);

  const stripes = random.shuffle(unique([...others, ink].filter((color) => contrast(color, background) >= 1.3))).slice(0, 5);
  const spectrum = palette.spectrum ? palette.spectrum.map((color) => jitter(color, random, 3, 0.02)) : [];
  const light = [INK_LIGHT, ...others.filter((color) => luminance(color) > 0.5)];

  return { background, ink, backgroundAlt, emblem: [main, second, third], scene: [], stripes, spectrum: spectrum.length >= 3 ? spectrum : [], sparkle: light };
}

/**
 * Scene layers, back to front. The front layer, which the title sits on, is one of the palette's
 * colours made just light or dark enough to read the ink on; the layers behind it are other palette
 * colours, so scenes stay bold.
 */
function sceneLayers(scene: SceneKind, colors: Omit<LabelColors, 'scene'>, random: Random): string[] {
  if (scene === 'none') return [];
  const { background, ink } = colors;
  const sources = unique([...colors.stripes, ...colors.backgroundAlt, ...colors.emblem, background]).filter((color) => color !== ink);
  const fronts = unique(sources.map((color) => readableOn(color, ink, TEXT_CONTRAST)).filter((color): color is string => color !== null)).filter(
    (color) => contrast(color, background) >= 1.35,
  );
  if (fronts.length === 0) return [];
  const front = random.pick(preferColourful(fronts).slice(0, 3));
  // Back layers are palette colours or deeper shades of the background, never whitened tints, which read as a glare.
  const deeper = (t: number) => (isDark(background) ? tint(background, t) : shade(background, t));
  const backSources = unique([...colors.stripes, ...colors.emblem, deeper(0.22), deeper(0.38)]);
  const backs = preferColourful(random.shuffle(backSources.filter((color) => color !== front && contrast(color, background) >= 1.2 && contrast(color, front) >= 1.15)));
  const count = scene === 'skyline' ? random.int(1, 2) : scene === 'beach' ? 2 : random.int(1, 3);
  const behind = [backs[0] ?? mix(front, background, 0.45), backs[1] ?? mix(front, background, 0.25)];
  return [...behind.slice(0, count - 1).reverse(), front];
}

/** The colour moved toward white (dark ink) or black (light ink), keeping its hue, until the ink reads on it. */
function readableOn(color: string, ink: string, ratio: number): string | null {
  for (let t = 0; t <= 0.7; t += 0.05) {
    const moved = isDark(ink) ? tint(color, t) : shade(color, t);
    if (contrast(moved, ink) >= ratio) return moved;
  }
  return null;
}

/** The colourful ones first, most colourful first; greys only when nothing else is left. */
function preferColourful(colors: readonly string[]): string[] {
  const sorted = [...colors].sort((a, b) => colorfulness(b) - colorfulness(a));
  const colourful = sorted.filter((color) => colorfulness(color) >= 40);
  return colourful.length > 0 ? colourful : sorted;
}

/** How far a colour is from grey: its spread between channels. */
function colorfulness(hex: string): number {
  const channels = parseHex(hex);
  return Math.max(...channels) - Math.min(...channels);
}

function unique(colors: readonly string[]): string[] {
  return [...new Set(colors.map((color) => color.toLowerCase()))];
}
