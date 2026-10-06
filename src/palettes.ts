/**
 * The preset colour schemes: 25 retro label palettes.
 * `background` is the label's main colour; `accents` are its other colours, most used first;
 * `ink` is the colour its logo is printed in. Colours are randomised within a scheme, never across.
 */
export interface Palette {
  readonly id: string;
  readonly background: string;
  readonly accents: readonly string[];
  readonly ink: string;
  /** A rainbow's stops in hue order, for the spectrum palette. */
  readonly spectrum?: readonly string[];
}

/** The two main inks: warm near-black for light labels, cream for dark ones. */
export const INK_DARK = '#0b0806';
export const INK_LIGHT = '#f5eedc';

/**
 * The ink colours a user may pick: three classic label inks (warm black, cream, navy) and three deep
 * colours that print well as ink. There's no free choice, so labels keep a consistent retro look.
 */
export const INK_PRESETS = {
  black: { name: 'Black', color: INK_DARK },
  cream: { name: 'Cream', color: INK_LIGHT },
  navy: { name: 'Navy', color: '#053b8a' },
  burgundy: { name: 'Burgundy', color: '#7e0e29' },
  forest: { name: 'Forest', color: '#054e2e' },
  gold: { name: 'Gold', color: '#fcb10f' },
} as const;

export type InkPreset = keyof typeof INK_PRESETS;

export const PALETTES: readonly Palette[] = [
  { id: 'tangerine', background: '#f84128', accents: ['#fc8d29', '#1a1414'], ink: INK_DARK },
  { id: 'midnight', background: '#051d52', accents: ['#073781', '#444d72', '#f4f0e8'], ink: INK_LIGHT },
  { id: 'sunflower', background: '#fcae1b', accents: ['#fb6f18', '#e92f1e'], ink: INK_DARK },
  { id: 'lagoon', background: '#0dc0b6', accents: ['#017393', '#39d2cd'], ink: INK_DARK },
  { id: 'bubblegum', background: '#fa628e', accents: ['#7e0e29'], ink: INK_DARK },
  { id: 'pine', background: '#054e2e', accents: ['#f3ecd2', '#386e4d'], ink: INK_LIGHT },
  { id: 'retro-cream', background: '#f3e4c3', accents: ['#fcb10f', '#088bb7', '#dc0e61', '#f92820'], ink: INK_DARK },
  { id: 'onyx', background: '#1c1b1d', accents: ['#454344', '#f4f0e4'], ink: INK_LIGHT },
  { id: 'cherry', background: '#fa231b', accents: ['#0a0403'], ink: INK_DARK },
  { id: 'sky', background: '#8ad3e0', accents: ['#0391bf'], ink: INK_DARK },
  { id: 'violet', background: '#5011bf', accents: ['#300a73', '#832dea', '#180539'], ink: INK_LIGHT },
  { id: 'mustard', background: '#fcc415', accents: ['#12141a'], ink: INK_DARK },
  { id: 'blossom', background: '#faa0b2', accents: ['#e41849'], ink: INK_DARK },
  { id: 'desert', background: '#fb9f3d', accents: ['#cc301e', '#fa6b1d', '#0c0703'], ink: INK_DARK },
  { id: 'charcoal', background: '#262626', accents: ['#f7f0e0', '#4f4f4e'], ink: INK_LIGHT },
  { id: 'sunset', background: '#fb651c', accents: ['#fb9c1e', '#200b07', '#152334'], ink: INK_DARK },
  { id: 'deep-sea', background: '#032f44', accents: ['#01a9b0'], ink: INK_LIGHT },
  { id: 'parchment', background: '#f0e2c3', accents: ['#f94722', '#03b4bb'], ink: INK_DARK },
  { id: 'alpine', background: '#18a0f9', accents: ['#0155b9', '#4dc0fb', '#03397b', '#97dcfc'], ink: INK_DARK },
  { id: 'sand', background: '#f5cb6f', accents: ['#05aeb8', '#45cacb', '#f8e2b7', '#09799a'], ink: INK_DARK },
  { id: 'stone', background: '#c1bbaa', accents: ['#0a0907'], ink: INK_DARK },
  { id: 'scarlet', background: '#fa2328', accents: ['#0e0203'], ink: INK_DARK },
  {
    id: 'spectrum',
    background: '#417afc',
    accents: ['#8545fb', '#11c5f8', '#f5e30d'],
    ink: '#053b8a',
    spectrum: ['#f5e30d', '#9df552', '#60f48e', '#11c5f8', '#417afc', '#8545fb', '#dc32f5'],
  },
  { id: 'olive', background: '#415917', accents: ['#eedcb0', '#74823d'], ink: INK_LIGHT },
  { id: 'cosmos', background: '#34127b', accents: ['#65419b', '#f5f1e0'], ink: INK_LIGHT },
];

export type PaletteId = (typeof PALETTES)[number]['id'];

export function paletteById(id: string): Palette {
  const palette = PALETTES.find((p) => p.id === id);
  if (!palette) throw new Error(`No palette called ${id}`);
  return palette;
}
