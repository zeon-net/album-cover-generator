import { describe, expect, it } from 'vitest';
import { LABEL } from '../src/parts';
import { COVER_TITLE, DEFAULT_FONTS, estimateWidth, layoutTitle } from '../src/text';

const font = DEFAULT_FONTS.label;
const layout = (title: string) => layoutTitle(title, estimateWidth, font);

describe('layoutTitle', () => {
  it('sets a short title on one large line', () => {
    const lines = layout('MIDNIGHT RAIN');
    expect(lines).toHaveLength(1);
    expect(lines[0].size).toBeGreaterThanOrEqual(56);
    expect(lines[0].squeeze).toBeUndefined();
  });

  it('breaks a long title into two balanced lines', () => {
    const lines = layout('THE NIGHT WE DANCED UNDER A THOUSAND STARS');
    expect(lines).toHaveLength(2);
    const [first, second] = lines.map((line) => line.text.length);
    expect(Math.abs(first - second)).toBeLessThanOrEqual(12);
    expect(lines[1].y).toBeGreaterThan(lines[0].y);
  });

  it('squeezes one long word rather than overflowing', () => {
    const [line] = layout('SUPERCALIFRAGILISTICEXPIALIDOCIOUSLY');
    expect(line.squeeze).toBeGreaterThan(0);
    expect(line.squeeze).toBeLessThan(LABEL.r * 2);
  });

  it('cuts very long titles with an ellipsis', () => {
    const lines = layout('A '.repeat(80).trim());
    expect(lines.map((line) => line.text).join(' ').endsWith('…')).toBe(true);
  });

  it('keeps every line inside the label, below the hole', () => {
    for (const title of ['GO', 'MIDNIGHT RAIN', 'THE NIGHT WE DANCED UNDER A THOUSAND STARS', 'x'.repeat(40)]) {
      for (const line of layout(title)) {
        expect(line.y - line.size * 0.72).toBeGreaterThan(LABEL.cy + LABEL.hole);
        expect(line.y + line.size * 0.22).toBeLessThan(LABEL.cy + LABEL.r);
      }
    }
  });

  it('prints nothing for an empty title', () => {
    expect(layout('   ')).toEqual([]);
  });
});

describe('layoutTitle on a cover', () => {
  it('sets titles larger across the square, inside its edges', () => {
    const [line] = layoutTitle('MIDNIGHT RAIN', estimateWidth, font, COVER_TITLE);
    expect(line.size).toBeGreaterThanOrEqual(90);
    for (const title of ['GO', 'THE NIGHT WE DANCED UNDER A THOUSAND STARS', 'x'.repeat(40)]) {
      for (const each of layoutTitle(title, estimateWidth, font, COVER_TITLE)) {
        expect(estimateWidth(each.text, { ...font, size: each.size }) <= 860 || each.squeeze !== undefined).toBe(true);
        expect(each.y + each.size * 0.22).toBeLessThan(1000);
        expect(each.y - each.size * 0.72).toBeGreaterThan(720);
      }
    }
  });
});
