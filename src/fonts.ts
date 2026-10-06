import type { FontSpec } from './text';

/**
 * Fonts a user can pick for the brand and the text. The open ones ship in the package's `fonts/`
 * folder (licences in `fonts/licences/`); serve that folder and pass where each file is to `fontSpec`.
 * The two system choices need no file and are the defaults.
 */
export interface FontChoice {
  readonly id: string;
  /** The name to show people. */
  readonly name: string;
  /** What it suits: the brand (heavy display faces) or the text (condensed faces). */
  readonly role: 'brand' | 'text';
  /** The CSS family name its file declares. */
  readonly family: string;
  /** Fonts to fall back on while it loads, or where it's missing. */
  readonly fallback: string;
  readonly weight: number;
  /** Its average width against `estimateWidth`'s base, measured in Chrome plus 8% to stay generous, for estimating without a browser. */
  readonly width: number;
  /** Its file in `fonts/`; none for system fonts. */
  readonly file?: string;
  readonly licence?: 'OFL-1.1' | 'Apache-2.0';
}

const SANS = "'Helvetica Neue', Arial, sans-serif";
const CONDENSED = "'Arial Narrow', 'Roboto Condensed', sans-serif";

export const FONT_CHOICES: readonly FontChoice[] = [
  { id: 'system-heavy', name: 'System heavy (default)', role: 'brand', family: 'Avenir Next', fallback: "'Futura', 'Helvetica Neue', 'Arial Black', sans-serif", weight: 900, width: 1.35 },
  { id: 'archivo-black', name: 'Archivo Black', role: 'brand', family: 'Archivo Black', fallback: SANS, weight: 400, width: 1.44, file: 'ArchivoBlack-Regular.ttf', licence: 'OFL-1.1' },
  { id: 'alfa-slab-one', name: 'Alfa Slab One', role: 'brand', family: 'Alfa Slab One', fallback: "'Rockwell', serif", weight: 400, width: 1.46, file: 'AlfaSlabOne-Regular.ttf', licence: 'OFL-1.1' },
  { id: 'shrikhand', name: 'Shrikhand (70s)', role: 'brand', family: 'Shrikhand', fallback: SANS, weight: 400, width: 1.35, file: 'Shrikhand-Regular.ttf', licence: 'OFL-1.1' },
  { id: 'pacifico', name: 'Pacifico (50s script)', role: 'brand', family: 'Pacifico', fallback: 'cursive', weight: 400, width: 1.41, file: 'Pacifico-Regular.ttf', licence: 'OFL-1.1' },
  { id: 'righteous', name: 'Righteous', role: 'brand', family: 'Righteous', fallback: SANS, weight: 400, width: 1.2, file: 'Righteous-Regular.ttf', licence: 'OFL-1.1' },
  { id: 'rubik-mono-one', name: 'Rubik Mono One', role: 'brand', family: 'Rubik Mono One', fallback: 'monospace', weight: 400, width: 1.81, file: 'RubikMonoOne-Regular.ttf', licence: 'OFL-1.1' },
  { id: 'bungee', name: 'Bungee', role: 'brand', family: 'Bungee', fallback: SANS, weight: 400, width: 1.38, file: 'Bungee-Regular.ttf', licence: 'OFL-1.1' },
  { id: 'system-condensed', name: 'System condensed (default)', role: 'text', family: 'DIN Condensed', fallback: `'Avenir Next Condensed', ${CONDENSED}`, weight: 700, width: 0.77 },
  { id: 'oswald', name: 'Oswald', role: 'text', family: 'Oswald', fallback: CONDENSED, weight: 700, width: 1.02, file: 'Oswald-Variable.ttf', licence: 'OFL-1.1' },
  { id: 'bebas-neue', name: 'Bebas Neue', role: 'text', family: 'Bebas Neue', fallback: CONDENSED, weight: 400, width: 0.76, file: 'BebasNeue-Regular.ttf', licence: 'OFL-1.1' },
  { id: 'anton', name: 'Anton', role: 'text', family: 'Anton', fallback: CONDENSED, weight: 400, width: 0.91, file: 'Anton-Regular.ttf', licence: 'OFL-1.1' },
  { id: 'barlow-condensed', name: 'Barlow Condensed', role: 'text', family: 'Barlow Condensed', fallback: CONDENSED, weight: 700, width: 0.87, file: 'BarlowCondensed-Bold.ttf', licence: 'OFL-1.1' },
  { id: 'league-gothic', name: 'League Gothic', role: 'text', family: 'League Gothic', fallback: CONDENSED, weight: 400, width: 0.67, file: 'LeagueGothic-Variable.ttf', licence: 'OFL-1.1' },
  { id: 'special-elite', name: 'Special Elite (typewriter)', role: 'text', family: 'Special Elite', fallback: "'Courier New', monospace", weight: 400, width: 1.21, file: 'SpecialElite-Regular.ttf', licence: 'Apache-2.0' },
];

export const DEFAULT_BRAND_FONT = 'system-heavy';
export const DEFAULT_TEXT_FONT = 'system-condensed';

export function fontChoice(id: string): FontChoice {
  const choice = FONT_CHOICES.find((font) => font.id === id);
  if (!choice) throw new Error(`No font called ${id}`);
  return choice;
}

/**
 * A font to pass in `fonts`, from the list. `src` is where its file is served (any URL while drawing
 * on a page; a data: URL, which `loadFont` makes, to embed it in an exported file). System fonts need none.
 */
export function fontSpec(id: string, src?: string): FontSpec {
  const choice = fontChoice(id);
  const family = `'${choice.family}', ${choice.fallback}`;
  return {
    family,
    weight: choice.weight,
    width: choice.width,
    ...(choice.file && src ? { face: { name: choice.family, src } } : {}),
  };
}

/** @font-face rules for the fonts that have files, to embed in an SVG so it carries its own fonts. */
export function fontFaceCss(fonts: readonly FontSpec[]): string {
  const seen = new Set<string>();
  let css = '';
  for (const font of fonts) {
    if (!font.face || seen.has(font.face.name)) continue;
    seen.add(font.face.name);
    css += `@font-face{font-family:'${font.face.name.replace(/'/g, '')}';src:url("${font.face.src.replace(/"/g, '%22')}");font-weight:${font.weight}}`;
  }
  return css;
}
