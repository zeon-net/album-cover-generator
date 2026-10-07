import { describe, expect, it } from 'vitest';
import { contrast } from '../src/color';
import { INK_DARK, INK_LIGHT, INK_PRESETS } from '../src/palettes';
import { designLabel } from '../src/design';
import { BACKGROUND_KINDS, EMBLEM_KINDS, SCENE_KINDS } from '../src/parts';
import { EXPORT_SIZES, MAX_EXPORT_SIZE, MIN_EXPORT_SIZE, exportDimensions, generateLabel, renderLabel } from '../src/render';

const seeds = Array.from({ length: 300 }, (_, i) => `song-${i}`);

/** A tiny well-formedness check: every opened tag closes, in order. */
function balanced(svg: string): boolean {
  const stack: string[] = [];
  for (const [, closing, name, selfClosing] of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)[^>]*?(\/?)>/g)) {
    if (selfClosing) continue;
    if (!closing) stack.push(name);
    else if (stack.pop() !== name) return false;
  }
  return stack.length === 0;
}

describe('generateLabel', () => {
  it('draws the same label for the same song every time', () => {
    const a = generateLabel({ title: 'Midnight Rain', seed: 'take-17' });
    const b = generateLabel({ title: 'Midnight Rain', seed: 'take-17' });
    expect(a.svg).toBe(b.svg);
    expect(a.design).toEqual(b.design);
  });

  it('renders a design again exactly, so storing the design is enough', () => {
    const { design, svg } = generateLabel({ title: 'Ocean Breeze', seed: 9 });
    expect(renderLabel(JSON.parse(JSON.stringify(design)))).toBe(svg);
  });

  it('draws well-formed SVG with finite coordinates in every shape', () => {
    for (const seed of seeds.slice(0, 80)) {
      for (const shape of ['record', 'label', 'cover', 'sleeve'] as const) {
        const { svg } = generateLabel({ title: `Track ${seed}`, seed, shape });
        expect(svg, seed).not.toMatch(/NaN|undefined|Infinity/);
        expect(balanced(svg), seed).toBe(true);
      }
    }
  });

  it('varies a lot across songs', () => {
    const designs = seeds.map((seed) => designLabel({ seed, theme: 'none' }));
    const looks = new Set(designs.map((d) => `${d.palette}/${d.background}/${d.scene}/${d.emblem}`));
    expect(looks.size).toBeGreaterThan(250);
    const used = (key: 'background' | 'scene' | 'emblem') => new Set(designs.map((d) => d[key]));
    expect(used('emblem').size).toBeGreaterThanOrEqual(EMBLEM_KINDS.length - 1);
    expect(used('scene').size).toBe(SCENE_KINDS.length);
    expect(used('background').size).toBe(BACKGROUND_KINDS.length);
  });

  it('keeps the logo and title readable on everything they sit on', () => {
    for (const seed of seeds) {
      const { colors, background, scene } = designLabel({ seed, title: seed });
      const behindText = background === 'spectrum' ? colors.spectrum : [colors.background];
      for (const color of behindText) expect(contrast(colors.ink, color), seed).toBeGreaterThanOrEqual(background === 'spectrum' ? 2.5 : 3);
      for (const color of colors.backgroundAlt) expect(contrast(colors.ink, color), seed).toBeGreaterThanOrEqual(2.5);
      if (scene !== 'none') expect(contrast(colors.ink, colors.scene[colors.scene.length - 1]), seed).toBeGreaterThanOrEqual(3.2);
    }
  });

  it('follows the title: a theme, its motifs and its colour words', () => {
    const night = designLabel({ title: 'Midnight Rain', seed: 1, emblem: undefined });
    expect(night.theme).toBe('night');
    expect(designLabel({ title: 'Golden Hour', seed: 4 }).palette).toMatch(/sunflower|mustard/);
    expect(designLabel({ title: 'Midnight Rain', theme: 'none', seed: 1 }).theme).toBeNull();
  });

  it('obeys forced choices', () => {
    const design = designLabel({ seed: 5, palette: 'lagoon', emblem: 'flame', scene: 'dunes', background: 'rings' });
    expect(design).toMatchObject({ palette: 'lagoon', emblem: 'flame', scene: 'dunes', background: 'rings' });
  });

  it('lets the stripes stand in for the emblem, unless an emblem is asked for', () => {
    expect(designLabel({ seed: 2, palette: 'retro-cream', background: 'stripes' }).emblem).toBe('none');
    expect(designLabel({ seed: 2, palette: 'retro-cream', background: 'stripes', emblem: 'sun' }).emblem).toBe('sun');
  });

  it('prints the brand, the sides and the title, escaped', () => {
    const { svg } = generateLabel({ title: 'Rock & <Roll>', seed: 3, side: 'Side B', brand: 'ZEON' });
    expect(svg).toContain('>ZEON</text>');
    expect(svg).toContain('>Side B</text>');
    expect(svg).toContain('ROCK &amp; &lt;ROLL&gt;');
    expect(generateLabel({ title: 'x', seed: 3, brand: false, stereo: '' }).svg).not.toContain('STEREO');
  });

  it('draws an old record by default, with the centre hole open through label and record', () => {
    const record = generateLabel({ title: 'Silent Moon', seed: 8 }).svg;
    expect(record).toMatch(/<\/defs><g data-part="vinyl" data-centre="open">/);
    expect(record).toMatch(/scale\(0\.664\)/);
    const filled = generateLabel({ title: 'Silent Moon', seed: 8, centre: 'vinyl' }).svg;
    expect(filled).toContain('data-centre="vinyl"');
  });

  it('draws a cover as the whole design on a square: no record, no hole, no round label', () => {
    const cover = generateLabel({ title: 'Silent Moon', seed: 8, shape: 'cover' }).svg;
    expect(cover).not.toContain('data-part="vinyl"');
    expect(cover).not.toMatch(/mask="url\(#[^)]+-label\)"/);
    expect(cover).toMatch(/<\/defs><g filter="url\(#[^)]+-print\)"><rect width="1000" height="1000"/);
    expect(cover).toContain('>SILENT MOON</text>');
    expect(cover).toContain('>ZEON</text>');
  });

  it('pulls the record half out of its sleeve, in a 3:2 picture', () => {
    const sleeve = generateLabel({ title: 'Silent Moon', seed: 8, shape: 'sleeve', size: 400 }).svg;
    expect(sleeve).toMatch(/^<svg [^>]*viewBox="0 0 1500 1000" width="600" height="400"/);
    // The record is drawn first, centred on the sleeve's right edge, and the cover over it.
    expect(sleeve).toMatch(/<\/defs><g transform="translate\(500 0\)"><g data-part="vinyl"/);
    expect(sleeve).toContain('>SILENT MOON</text>');
  });

  it('never repeats an id, so every gradient, mask and filter points at its own definition', () => {
    for (const seed of seeds.slice(0, 40)) {
      for (const shape of ['record', 'label', 'cover', 'sleeve'] as const) {
        const { svg } = generateLabel({ title: seed, seed, shape, centre: 'vinyl' });
        const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
        expect(new Set(ids).size, `${seed} ${shape}`).toBe(ids.length);
      }
    }
  });

  it("leaves a lone label's centre open, or fills it with vinyl", () => {
    const open = generateLabel({ title: 'Silent Moon', seed: 8, shape: 'label' }).svg;
    expect(open).toMatch(/<\/defs><g mask="url\(#[^)]+-label\)">/);
    expect(open).not.toContain('data-part="vinyl"');
    const filled = generateLabel({ title: 'Silent Moon', seed: 8, shape: 'label', centre: 'vinyl' }).svg;
    expect(filled).toMatch(/<\/defs><g data-part="vinyl" data-centre="vinyl">/);
  });

  it('draws clean when texture is off', () => {
    const { svg } = generateLabel({ title: 'Clean', seed: 1, texture: 0 });
    expect(svg).not.toContain('-print)');
  });

  it('prints ZEON unless the settings name another brand, and none when told', () => {
    expect(designLabel({ seed: 1 }).text.brand).toBe('ZEON');
    expect(designLabel({ seed: 1, brand: '   ' }).text.brand).toBe('ZEON');
    expect(designLabel({ seed: 1, brand: ' Tigillo Records ' }).text.brand).toBe('Tigillo Records');
    expect(designLabel({ seed: 1, brand: false }).text.brand).toBe('');
    expect(generateLabel({ seed: 1, title: 'x', brand: false }).svg).not.toContain('>ZEON<');
  });
});

describe('a label over given artwork', () => {
  const image = 'data:image/jpeg;base64,AAAA';

  it('prints only the brand and the title over the image', () => {
    const design = designLabel({ title: 'I Am The One', seed: 'take-1', image });
    expect(design).toMatchObject({ emblem: 'none', scene: 'none', image: { href: image, tone: 'dark' } });
    expect(design.text).toMatchObject({ brand: 'ZEON', stereo: '', side: '', title: 'I AM THE ONE' });
    for (const shape of ['record', 'label', 'cover', 'sleeve'] as const) {
      const { svg } = generateLabel({ title: 'I Am The One', seed: 'take-1', image, shape });
      expect(svg, shape).toContain(`<image href="${image}" x="0" y="0" width="1000" height="1000" preserveAspectRatio="xMidYMid slice"/>`);
      expect(svg, shape).toContain('>ZEON</text>');
      expect(svg, shape).toContain('>I AM THE ONE</text>');
      expect(svg, shape).not.toMatch(/>STEREO<|>Side A</);
      expect(balanced(svg), shape).toBe(true);
    }
  });

  it('inks to suit the image: cream on dark artwork, near-black on light', () => {
    expect(designLabel({ seed: 1, image }).colors.ink).toBe(INK_LIGHT);
    expect(designLabel({ seed: 1, image, imageTone: 'light' }).colors.ink).toBe(INK_DARK);
  });

  it('still prints the small text when asked', () => {
    const { svg } = generateLabel({ title: 'x', seed: 1, image, stereo: 'STEREO', side: 'Side A' });
    expect(svg).toContain('>STEREO</text>');
  });

  it('draws the image as it is when nothing is printed over it', () => {
    for (const shape of ['record', 'label', 'cover', 'sleeve'] as const) {
      const bare = generateLabel({ title: '', brand: false, seed: 1, image, shape }).svg;
      expect(bare, shape).toContain(`<image href="${image}"`);
      expect(bare, shape).not.toContain('-fade');
      expect(bare, shape).not.toContain('<text');
      expect(balanced(bare), shape).toBe(true);
      // Any printing brings the fade back.
      expect(generateLabel({ title: '', brand: 'ZEON', seed: 1, image, shape }).svg, shape).toContain('-fade');
      expect(generateLabel({ title: '', brand: false, side: 'Side A', seed: 1, image, shape }).svg, shape).toContain('-fade');
    }
  });

  it('escapes the image address', () => {
    const { svg } = generateLabel({ title: 'x', seed: 1, image: 'https://example.com/a.png?w=1&h=1' });
    expect(svg).toContain('href="https://example.com/a.png?w=1&amp;h=1"');
  });
});

describe('an ink colour', () => {
  const presets = Object.keys(INK_PRESETS) as (keyof typeof INK_PRESETS)[];

  it('colours the brand, title, small print and emblem', () => {
    const design = designLabel({ title: 'Wild Heart', seed: 4, palette: 'retro-cream', background: 'flat', emblem: 'heart', ink: 'navy' });
    expect(design.colors.ink).toBe(INK_PRESETS.navy.color);
    expect(design.colors.emblem[0]).toBe(INK_PRESETS.navy.color);
    const { svg } = generateLabel({ title: 'Wild Heart', seed: 4, palette: 'retro-cream', background: 'flat', emblem: 'heart', ink: 'navy' });
    for (const text of ['>ZEON<', '>WILD HEART<', '>STEREO<', '>Side A<']) {
      expect(svg).toMatch(new RegExp(`fill="${INK_PRESETS.navy.color}"[^>]*${text}`));
    }
    expect(svg).toMatch(new RegExp(`<g><g transform="rotate\\([^)]*\\)">(<path [^>]*/>)?<path d="[^"]*" fill="${INK_PRESETS.navy.color}"/>`));
  });

  it('changes the text and the emblem only: the rest of the label stays as it was', () => {
    for (const seed of seeds.slice(0, 60)) {
      const auto = designLabel({ seed, title: seed });
      for (const ink of presets) {
        const inked = designLabel({ seed, title: seed, ink });
        expect({ ...inked, colors: { ...inked.colors, ink: auto.colors.ink, emblem: auto.colors.emblem } }, `${seed} ${ink}`).toEqual(auto);
      }
    }
  });

  it("is the user's call: it applies with no readability check", () => {
    // Navy on the midnight palette is hard to read, and still what was asked for.
    expect(designLabel({ seed: 4, palette: 'midnight', background: 'flat', ink: 'navy' }).colors.ink).toBe(INK_PRESETS.navy.color);
    expect(designLabel({ seed: 4, ink: 'auto' }).colors.ink).toBe(designLabel({ seed: 4 }).colors.ink);
  });

  it("keeps the emblem's details visible against the new ink", () => {
    for (const seed of seeds.slice(0, 60)) {
      const auto = designLabel({ seed, title: seed });
      for (const ink of presets) {
        const [, second, third] = designLabel({ seed, title: seed, ink }).colors.emblem;
        for (const detail of [second, third]) {
          expect(contrast(detail, INK_PRESETS[ink].color) >= 1.3 || detail === auto.colors.emblem[0], `${seed} ${ink}`).toBe(true);
        }
      }
    }
  });

  it('applies over an image, with the fade flipped to suit it', () => {
    const image = 'data:image/jpeg;base64,AAAA';
    const fade = (svg: string) => /-fade"[^>]*><stop offset="0" stop-color="(#[0-9a-f]{3})"/.exec(svg)?.[1];
    expect(fade(generateLabel({ seed: 1, title: 'x', image }).svg)).toBe('#000');
    expect(fade(generateLabel({ seed: 1, title: 'x', image, ink: 'burgundy' }).svg)).toBe('#fff');
    for (const ink of presets) expect(designLabel({ seed: 1, image, ink }).colors.ink).toBe(INK_PRESETS[ink].color);
  });

  it('refuses a colour that is not a preset', () => {
    expect(() => designLabel({ seed: 1, ink: '#ff00aa' as never })).toThrow(/No text colour called #ff00aa/);
  });
});

describe("a cover's worn marks", () => {
  const options = { title: 'Ocean Breeze', seed: 'wear-1', shape: 'cover' } as const;
  const dashed = (svg: string) => [...svg.matchAll(/<(circle|rect)[^>]*stroke-dasharray[^>]*\/>/g)].map((match) => match[1]);

  it('draws the dashed ring wear and rubbed edges by default', () => {
    expect(dashed(generateLabel(options).svg)).toEqual(['circle', 'rect']);
  });

  it('leaves out just the mark that is turned off', () => {
    const all = generateLabel(options).svg;
    const noRing = generateLabel({ ...options, ringWear: false }).svg;
    const noEdges = generateLabel({ ...options, edgeWear: false }).svg;
    expect(dashed(noRing)).toEqual(['rect']);
    expect(dashed(noEdges)).toEqual(['circle']);
    expect(dashed(generateLabel({ ...options, ringWear: false, edgeWear: false }).svg)).toEqual([]);
    // Everything else is untouched: put the removed mark back and it's the same drawing.
    const ring = all.match(/<circle[^>]*stroke-dasharray[^>]*\/>/)![0];
    const idOf = (svg: string) => /id="(ac[a-z0-9]+)-print"/.exec(svg)![1];
    expect(noRing.replaceAll(idOf(noRing), 'ID').replace('url(#ID-corners)"/>', `url(#ID-corners)"/>${ring.replaceAll(idOf(all), 'ID')}`)).toBe(all.replaceAll(idOf(all), 'ID'));
  });

  it('only concerns covers: records and labels draw the same either way', () => {
    for (const shape of ['record', 'label'] as const) {
      const svg = (wear: boolean) => generateLabel({ ...options, shape, ringWear: wear, edgeWear: wear }).svg.replace(/ac[a-z0-9]+-/g, 'ID-');
      expect(svg(false), shape).toBe(svg(true));
    }
  });
});


describe('export sizes', () => {
  it('goes from an icon to the 3000 × 3000 album-art standard', () => {
    expect(EXPORT_SIZES[0]).toBe(64);
    expect(EXPORT_SIZES).toContain(256);
    expect(EXPORT_SIZES[EXPORT_SIZES.length - 1]).toBe(3000);
  });

  it('is square for every shape but the sleeve, which is 3:2', () => {
    expect(exportDimensions('cover', 3000)).toEqual({ width: 3000, height: 3000 });
    expect(exportDimensions('record', 64)).toEqual({ width: 64, height: 64 });
    expect(exportDimensions('sleeve', 3000)).toEqual({ width: 4500, height: 3000 });
  });

  it('keeps sizes whole and within bounds', () => {
    expect(exportDimensions('cover', 2)).toEqual({ width: MIN_EXPORT_SIZE, height: MIN_EXPORT_SIZE });
    expect(exportDimensions('cover', 99999)).toEqual({ width: MAX_EXPORT_SIZE, height: MAX_EXPORT_SIZE });
    expect(exportDimensions('cover', 1399.6)).toEqual({ width: 1400, height: 1400 });
  });
});
