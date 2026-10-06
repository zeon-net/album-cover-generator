import type { Random } from './random';

export const BACKGROUND_KINDS = ['flat', 'rings', 'sunburst', 'gradient', 'split', 'stripes', 'starfield', 'spectrum'] as const;
export type BackgroundKind = (typeof BACKGROUND_KINDS)[number];

export const SCENE_KINDS = ['none', 'waves', 'mountains', 'dunes', 'hills', 'skyline', 'beach'] as const;
export type SceneKind = (typeof SCENE_KINDS)[number];

/** Recognisable things, each varied by the seed. */
export const MOTIF_KINDS = ['sun', 'sunset', 'moon', 'star', 'sparkles', 'trees', 'mountain', 'planet', 'flower', 'waves', 'flame', 'cloud', 'heart', 'record', 'drop'] as const;
/** Abstract emblems built from symmetric shapes only (see emblems.ts on why). */
export const ABSTRACT_KINDS = ['target', 'prism', 'spiral', 'overlap', 'bars', 'echo', 'orbit', 'burst', 'diamond', 'dots'] as const;
export const EMBLEM_KINDS = [...MOTIF_KINDS, ...ABSTRACT_KINDS, 'none'] as const;
export type EmblemKind = (typeof EMBLEM_KINDS)[number];

/**
 * The label in its 1000×1000 drawing. The hole is 41% of the radius, as on a real 7-inch single;
 * the radius leaves room for the worn edge's displacement.
 */
export const LABEL = { cx: 500, cy: 500, r: 482, hole: 482 * 0.41 } as const;

/** Where the emblem sits: left of the hole, below "STEREO". */
export const EMBLEM_BOX = { cx: LABEL.cx - LABEL.r * 0.69, cy: LABEL.cy + LABEL.r * 0.06, size: LABEL.r * 0.47 } as const;

/** On a square cover there's no hole: the emblem sits large in the middle, between the logo and the title. */
export const COVER_EMBLEM_BOX = { cx: 500, cy: 455, size: 400 } as const;

/** 'label': drawn for the round label with its hole. 'cover': drawn for a square sleeve. */
export type Layout = 'label' | 'cover';

/**
 * The lowest point a scene's front layer may leave uncovered. The title is drawn below it,
 * so the title only ever sits on the front layer's colour, which was chosen to contrast with the ink.
 */
export const SCENE_FRONT_MAX_Y = LABEL.cy + LABEL.r * 0.42;

/** Colours chosen for one label. Every colour the title or logo can sit on contrasts with `ink`. */
export interface LabelColors {
  readonly background: string;
  readonly ink: string;
  /** Second background colours (rings, gradient, swoosh, sunburst), each readable under the ink. */
  readonly backgroundAlt: readonly string[];
  /** Emblem colours: main, second, third. */
  readonly emblem: readonly [string, string, string];
  /** Scene layers from back to front. The front one contrasts with the ink. */
  readonly scene: readonly string[];
  readonly stripes: readonly string[];
  readonly spectrum: readonly string[];
  /** Light colours for stars on a dark label. */
  readonly sparkle: readonly string[];
}

/** What a part needs to draw itself: its own random stream, a prefix for unique ids, and a place for defs. */
export interface DrawContext {
  readonly layout: Layout;
  readonly random: Random;
  readonly id: string;
  readonly defs: string[];
  readonly colors: LabelColors;
}
