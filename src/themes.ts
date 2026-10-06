import type { BackgroundKind, EmblemKind, SceneKind } from './parts';

/**
 * Themes a song title can point to. `words` are concrete things ("moon", "heart") and win over
 * `hints`, which are moods ("lost", "high"): "Lost in the Pines" is a forest, not a dream.
 */
export interface Theme {
  readonly words: readonly string[];
  readonly hints: readonly string[];
  readonly emblems: readonly EmblemKind[];
  readonly scenes: readonly SceneKind[];
  readonly backgrounds: readonly BackgroundKind[];
  readonly palettes: readonly string[];
}

export const THEMES = {
  night: {
    words: ['night', 'midnight', 'moon', 'moonlight', 'moonlit', 'nocturne', 'nightfall', 'dusk', 'twilight', 'lunar'],
    hints: ['dark', 'darkness', 'evening', 'sleep', 'sleepless', 'silent', 'silence', 'late', 'shadow', 'lonely'],
    emblems: ['moon', 'star', 'sparkles'],
    scenes: ['skyline', 'hills', 'none'],
    backgrounds: ['starfield', 'gradient', 'flat'],
    palettes: ['midnight', 'charcoal', 'cosmos', 'violet', 'deep-sea', 'onyx'],
  },
  ocean: {
    words: ['ocean', 'sea', 'wave', 'tide', 'surf', 'beach', 'shore', 'coast', 'island', 'lagoon', 'harbor', 'harbour', 'sail', 'sailor', 'bay', 'reef', 'mermaid'],
    hints: ['water', 'deep', 'drift', 'float', 'breeze', 'tropical', 'salt'],
    emblems: ['waves', 'sunset', 'drop'],
    scenes: ['waves', 'beach'],
    backgrounds: ['flat', 'gradient', 'rings'],
    palettes: ['lagoon', 'deep-sea', 'sky', 'alpine', 'sand'],
  },
  sun: {
    words: ['sun', 'sunshine', 'sunlight', 'sunrise', 'sunset', 'summer', 'morning', 'daybreak', 'dawn', 'noon', 'sunny'],
    hints: ['golden', 'day', 'bright', 'shine', 'warm', 'light', 'hour', 'glow'],
    emblems: ['sun', 'sunset'],
    scenes: ['dunes', 'waves', 'hills', 'none'],
    backgrounds: ['flat', 'rings', 'sunburst'],
    palettes: ['sunflower', 'tangerine', 'sunset', 'mustard', 'desert', 'retro-cream'],
  },
  fire: {
    words: ['fire', 'flame', 'blaze', 'ember', 'inferno', 'bonfire', 'burn', 'firework', 'wildfire'],
    hints: ['hot', 'heat', 'spark', 'smoke'],
    emblems: ['flame'],
    scenes: ['none', 'dunes'],
    backgrounds: ['flat', 'sunburst', 'rings'],
    palettes: ['cherry', 'scarlet', 'tangerine', 'sunset', 'onyx'],
  },
  love: {
    words: ['love', 'heart', 'kiss', 'valentine', 'romance', 'lover', 'sweetheart', 'heartbeat', 'heartbreak'],
    hints: ['baby', 'darling', 'honey', 'sweet', 'crush', 'forever', 'falling', 'together'],
    emblems: ['heart', 'flower'],
    scenes: ['none', 'hills'],
    backgrounds: ['flat', 'rings', 'sunburst'],
    palettes: ['bubblegum', 'blossom', 'scarlet', 'cherry', 'parchment'],
  },
  forest: {
    words: ['forest', 'tree', 'pine', 'wood', 'woods', 'woodland', 'jungle', 'leaf', 'oak', 'grove', 'timber'],
    hints: ['nature', 'green', 'wilderness', 'roots'],
    emblems: ['trees'],
    scenes: ['hills', 'mountains'],
    backgrounds: ['flat', 'gradient'],
    palettes: ['pine', 'olive', 'parchment', 'retro-cream'],
  },
  mountain: {
    words: ['mountain', 'peak', 'summit', 'valley', 'cliff', 'glacier', 'alps', 'alpine', 'hill', 'canyon'],
    hints: ['high', 'higher', 'climb', 'snow', 'air', 'ground'],
    emblems: ['mountain'],
    scenes: ['mountains', 'hills'],
    backgrounds: ['flat', 'gradient'],
    palettes: ['alpine', 'sky', 'pine', 'stone'],
  },
  city: {
    words: ['city', 'street', 'downtown', 'avenue', 'highway', 'boulevard', 'metro', 'subway', 'skyline', 'neon', 'town', 'traffic', 'rooftop'],
    hints: ['lights', 'urban', 'drive', 'road'],
    emblems: ['bars', 'overlap', 'target', 'burst'],
    scenes: ['skyline'],
    backgrounds: ['gradient', 'starfield', 'flat'],
    palettes: ['violet', 'onyx', 'midnight', 'cosmos', 'charcoal'],
  },
  space: {
    words: ['space', 'star', 'galaxy', 'planet', 'cosmos', 'cosmic', 'orbit', 'universe', 'rocket', 'astronaut', 'nebula', 'comet', 'satellite', 'starlight', 'stardust', 'mars', 'saturn'],
    hints: ['infinity', 'gravity', 'endless', 'beyond'],
    emblems: ['planet', 'star', 'sparkles', 'spiral', 'orbit'],
    scenes: ['none', 'hills'],
    backgrounds: ['starfield', 'gradient'],
    palettes: ['cosmos', 'midnight', 'violet', 'deep-sea', 'onyx'],
  },
  flower: {
    words: ['flower', 'blossom', 'rose', 'bloom', 'petal', 'garden', 'lily', 'daisy', 'tulip', 'orchid'],
    hints: ['spring', 'pretty', 'fresh'],
    emblems: ['flower'],
    scenes: ['none', 'hills'],
    backgrounds: ['flat', 'rings'],
    palettes: ['blossom', 'bubblegum', 'scarlet', 'parchment', 'olive'],
  },
  rain: {
    words: ['rain', 'cloud', 'storm', 'thunder', 'drizzle', 'umbrella', 'weather', 'sky', 'drop', 'tear'],
    hints: ['cry', 'crying', 'cold', 'fog', 'mist'],
    emblems: ['cloud', 'drop'],
    scenes: ['hills', 'none', 'waves'],
    backgrounds: ['flat', 'gradient'],
    palettes: ['sky', 'stone', 'alpine', 'deep-sea', 'charcoal'],
  },
  desert: {
    words: ['desert', 'sand', 'dune', 'cactus', 'mirage', 'sahara', 'mojave', 'oasis'],
    hints: ['dry', 'dust', 'west', 'western', 'cowboy'],
    emblems: ['sun', 'sunset'],
    scenes: ['dunes'],
    backgrounds: ['flat', 'gradient'],
    palettes: ['desert', 'sand', 'tangerine', 'sunflower'],
  },
  music: {
    words: ['record', 'vinyl', 'disco', 'groove', 'radio', 'jukebox', 'guitar', 'piano', 'drum', 'bass', 'song', 'melody', 'rhythm', 'beat', 'tune', 'dance', 'party', 'club', 'funk', 'soul', 'jazz', 'rock', 'boogie'],
    hints: ['spin', 'around', 'move', 'sound', 'music'],
    emblems: ['record', 'bars', 'target', 'overlap', 'burst'],
    scenes: ['none'],
    backgrounds: ['flat', 'rings', 'stripes', 'sunburst'],
    palettes: ['mustard', 'onyx', 'parchment', 'scarlet', 'retro-cream', 'spectrum'],
  },
  dream: {
    words: ['dream', 'echo', 'ghost', 'mystery', 'memory', 'illusion', 'mirror', 'trance', 'unknown'],
    hints: ['lost', 'fade', 'mind', 'wonder', 'strange', 'trip'],
    emblems: ['spiral', 'target', 'echo', 'prism', 'overlap', 'orbit'],
    scenes: ['none', 'waves'],
    backgrounds: ['split', 'gradient', 'flat', 'spectrum'],
    palettes: ['deep-sea', 'spectrum', 'stone', 'violet', 'cosmos', 'onyx'],
  },
} as const satisfies Record<string, Theme>;

export type ThemeId = keyof typeof THEMES;
export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

/** Colour words in a title choose the palette: "Golden Hour" gets a yellow label. */
export const PALETTE_WORDS: Readonly<Record<string, readonly string[]>> = {
  red: ['cherry', 'scarlet'],
  crimson: ['cherry', 'scarlet'],
  scarlet: ['scarlet'],
  orange: ['tangerine', 'sunset'],
  yellow: ['sunflower', 'mustard'],
  gold: ['sunflower', 'mustard'],
  golden: ['sunflower', 'mustard'],
  green: ['pine', 'olive'],
  emerald: ['pine'],
  blue: ['sky', 'alpine', 'midnight'],
  navy: ['midnight'],
  teal: ['lagoon', 'deep-sea'],
  turquoise: ['lagoon'],
  purple: ['violet', 'cosmos'],
  violet: ['violet'],
  pink: ['bubblegum', 'blossom'],
  black: ['onyx', 'charcoal'],
  noir: ['onyx', 'charcoal'],
  white: ['parchment', 'retro-cream'],
  cream: ['parchment', 'retro-cream'],
  ivory: ['parchment'],
  grey: ['stone', 'charcoal'],
  gray: ['stone', 'charcoal'],
  silver: ['stone'],
  rainbow: ['spectrum'],
  color: ['spectrum'],
  colour: ['spectrum'],
  prism: ['spectrum'],
  spectrum: ['spectrum'],
};

export type MatchType = 'exact' | 'stemmed' | 'fuzzy' | 'compound';

export interface TitleMatch {
  /** The words the title was split into. */
  readonly tokens: readonly string[];
  readonly theme: ThemeId | null;
  readonly palettes: readonly string[];
  /** Which title word chose the theme and how, for the demo and for debugging. */
  readonly themeMatch: { readonly token: string; readonly word: string; readonly type: MatchType } | null;
  readonly paletteMatch: { readonly token: string; readonly word: string; readonly type: MatchType } | null;
}

const COLLOQUIAL: Readonly<Record<string, string>> = { nite: 'night', thru: 'through', lite: 'light', luv: 'love', tonite: 'tonight' };

export function levenshtein(a: string, b: string): number {
  if (a.length < b.length) return levenshtein(b, a);
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const current = [i + 1];
    for (let j = 0; j < b.length; j++) {
      current.push(Math.min(previous[j + 1] + 1, current[j] + 1, previous[j] + (a[i] === b[j] ? 0 : 1)));
    }
    previous = current;
  }
  return previous[previous.length - 1];
}

/** Lowercase words of two or more letters, each once, in title order. */
export function tokenize(title: string): string[] {
  const words = title.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  return [...new Set(words.filter((word) => word.length >= 2))];
}

/** Plural, "-ing" and "-ed" forms of a word, and slang spellings, back to a word in `vocabulary`. */
function stem(token: string, vocabulary: ReadonlySet<string>): string | null {
  const candidates: string[] = [];
  if (COLLOQUIAL[token]) candidates.push(COLLOQUIAL[token]);
  if (token.endsWith('ies') && token.length > 4) candidates.push(token.slice(0, -3) + 'y');
  if (token.endsWith('es') && token.length > 3) candidates.push(token.slice(0, -2));
  if (token.endsWith('s') && token.length > 3) candidates.push(token.slice(0, -1));
  for (const suffix of ['ing', 'ed']) {
    if (token.endsWith(suffix) && token.length > suffix.length + 2) {
      const base = token.slice(0, -suffix.length);
      candidates.push(base, base + 'e');
      if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) candidates.push(base.slice(0, -1));
    }
  }
  return candidates.find((candidate) => vocabulary.has(candidate)) ?? null;
}

/**
 * The closest word within a small edit distance: 1 edit below 8 letters, 2 from 8.
 * Two edits at six letters would turn "golden" into "garden".
 */
function fuzzy(token: string, vocabulary: readonly string[]): string | null {
  if (token.length < 4) return null;
  const maxDistance = token.length >= 8 ? 2 : 1;
  let best: { word: string; distance: number } | null = null;
  for (const word of vocabulary) {
    if (Math.abs(word.length - token.length) > maxDistance || word[0] !== token[0]) continue;
    const distance = levenshtein(token, word);
    if (distance <= maxDistance && (!best || distance < best.distance)) best = { word, distance };
  }
  return best?.word ?? null;
}

/** A word of four or more letters that a longer token starts or ends with: "starlights" holds "star". */
function compound(token: string, vocabulary: readonly string[]): string | null {
  const parts = vocabulary.filter((word) => word.length >= 4 && token.length >= word.length + 2 && (token.startsWith(word) || token.endsWith(word)));
  return parts.sort((a, b) => b.length - a.length)[0] ?? null;
}

type Lookup = { token: string; word: string; type: MatchType };
type Tier = 'direct' | 'fuzzy' | 'compound';

/** The first title word that names something in `vocabulary` at this tier, in title order. */
function find(tokens: readonly string[], vocabulary: readonly string[], tier: Tier): Lookup | null {
  const set = new Set(vocabulary);
  for (const token of tokens) {
    if (tier === 'direct') {
      if (set.has(token)) return { token, word: token, type: 'exact' };
      const stemmed = stem(token, set);
      if (stemmed) return { token, word: stemmed, type: 'stemmed' };
    } else {
      const word = tier === 'fuzzy' ? fuzzy(token, vocabulary) : compound(token, vocabulary);
      if (word) return { token, word, type: tier };
    }
  }
  return null;
}

/** Tries each vocabulary in turn at each tier, so an exact hint beats a fuzzy guess at a word. */
function findInOrder(tokens: readonly string[], vocabularies: readonly (readonly string[])[]): Lookup | null {
  for (const tier of ['direct', 'fuzzy', 'compound'] as const) {
    for (const vocabulary of vocabularies) {
      const found = find(tokens, vocabulary, tier);
      if (found) return found;
    }
  }
  return null;
}

const STRONG = new Map<string, ThemeId>();
const WEAK = new Map<string, ThemeId>();
for (const id of THEME_IDS) {
  for (const word of THEMES[id].words) STRONG.set(word, id);
  for (const word of THEMES[id].hints) WEAK.set(word, id);
}

/** Reads a song title for a theme and a palette, with plain rules and no model. */
export function matchTitle(title: string): TitleMatch {
  const tokens = tokenize(title);
  const themeMatch = findInOrder(tokens, [[...STRONG.keys()], [...WEAK.keys()]]);
  const theme = themeMatch ? (STRONG.get(themeMatch.word) ?? WEAK.get(themeMatch.word) ?? null) : null;
  const paletteMatch = findInOrder(tokens, [Object.keys(PALETTE_WORDS)]);
  return { tokens, theme, palettes: paletteMatch ? PALETTE_WORDS[paletteMatch.word] : [], themeMatch, paletteMatch };
}
