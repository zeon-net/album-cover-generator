import { describe, expect, it } from 'vitest';
import { DEFAULT_BRAND_FONT, DEFAULT_TEXT_FONT, FONT_CHOICES, fontFaceCss, fontSpec } from '../src/fonts';
import { generateLabel } from '../src/render';
import { DEFAULT_FONTS, estimateWidth, layoutTitle } from '../src/text';

// The files on disk, listed by Vite, so the check needs no Node types.
const names = (paths: Record<string, unknown>) => Object.keys(paths).map((path) => path.split('/').pop()!);
const files = names(import.meta.glob('../fonts/*.ttf'));
const licences = names(import.meta.glob('../fonts/licences/*.txt'));

describe('font choices', () => {
  it('ships a file and a licence for every font that needs one', () => {
    for (const choice of FONT_CHOICES.filter((font) => font.file)) {
      expect(files, choice.id).toContain(choice.file);
      const stem = choice.file!.split('-')[0];
      expect(licences.some((licence) => licence.startsWith(stem)), choice.id).toBe(true);
    }
  });

  it('offers display fonts for the brand and condensed ones for the text, with system defaults', () => {
    expect(FONT_CHOICES.find((font) => font.id === DEFAULT_BRAND_FONT)?.file).toBeUndefined();
    expect(FONT_CHOICES.find((font) => font.id === DEFAULT_TEXT_FONT)?.file).toBeUndefined();
    expect(FONT_CHOICES.filter((font) => font.role === 'brand').length).toBeGreaterThanOrEqual(5);
    expect(FONT_CHOICES.filter((font) => font.role === 'text').length).toBeGreaterThanOrEqual(5);
    expect(DEFAULT_FONTS.brand.family.startsWith("'Avenir Next'")).toBe(true);
  });

  it('describes a shipped font by its file, and a system font without one', () => {
    expect(fontSpec('bebas-neue', 'data:font/ttf;base64,AA')).toMatchObject({ family: "'Bebas Neue', 'Arial Narrow', 'Roboto Condensed', sans-serif", face: { name: 'Bebas Neue', src: 'data:font/ttf;base64,AA' } });
    expect(fontSpec('system-condensed').face).toBeUndefined();
    expect(() => fontSpec('comic-sans')).toThrow(/No font/);
  });

  it('writes one @font-face rule per font file', () => {
    const bebas = fontSpec('bebas-neue', 'data:font/ttf;base64,AA');
    expect(fontFaceCss([bebas, bebas, DEFAULT_FONTS.label])).toBe(`@font-face{font-family:'Bebas Neue';src:url("data:font/ttf;base64,AA");font-weight:400}`);
  });
});

describe('drawing with a chosen font', () => {
  const brand = fontSpec('rubik-mono-one', 'data:font/ttf;base64,AA');
  const label = fontSpec('special-elite', 'data:font/ttf;base64,BB');

  it('embeds the fonts only when asked, so pages stay light', () => {
    const plain = generateLabel({ title: 'Midnight Rain', seed: 1, fonts: { brand, label } }).svg;
    expect(plain).not.toContain('@font-face');
    expect(plain).toContain("font-family=\"&apos;Rubik Mono One&apos;");
    const embedded = generateLabel({ title: 'Midnight Rain', seed: 1, fonts: { brand, label }, embedFonts: true }).svg;
    expect(embedded).toContain(`<style>@font-face{font-family:'Rubik Mono One';src:url("data:font/ttf;base64,AA")`);
    expect(embedded).toContain(`@font-face{font-family:'Special Elite';src:url("data:font/ttf;base64,BB")`);
  });

  it('sets wider fonts smaller', () => {
    const size = (spec: typeof label) => layoutTitle('MIDNIGHT RAIN AGAIN', estimateWidth, spec)[0].size;
    expect(size(fontSpec('league-gothic'))).toBeGreaterThan(size(fontSpec('special-elite')));
  });

  it('keeps the brand, "STEREO" and the side inside their room, whatever the font', () => {
    const { svg } = generateLabel({ title: 'x', seed: 1, brand: 'Tigillo Records', fonts: { brand, label }, shape: 'label' });
    const sizeOf = (text: string) => Number(new RegExp(`font-size="([\\d.]+)"[^>]*>${text}<`).exec(svg)?.[1]);
    const width = (text: string, spec: typeof label, spacing: number) => estimateWidth(text, { ...spec, size: sizeOf(text) }) + (text.length - 1) * spacing * sizeOf(text);
    expect(width('Tigillo Records', brand, 0.02)).toBeLessThanOrEqual(560);
    expect(width('STEREO', label, 0.07)).toBeLessThanOrEqual(200.5);
    expect(width('Side A', label, 0.02)).toBeLessThanOrEqual(482 - 482 * 0.41 - 44 + 0.5);
  });
});
