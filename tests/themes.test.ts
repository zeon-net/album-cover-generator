import { describe, expect, it } from 'vitest';
import { matchTitle, tokenize } from '../src/themes';

describe('matchTitle', () => {
  it.each([
    ['Midnight Rain', 'night', 'exact'],
    ['Lost in the Pines', 'forest', 'stemmed'],
    ['Golden Hour', 'sun', 'exact'],
    ['Starlights', 'space', 'stemmed'],
    ['Burning Hearts', 'fire', 'stemmed'],
    ['Oceans', 'ocean', 'stemmed'],
    ['Thru the Nite', 'night', 'stemmed'],
    ['Moonlite', 'night', 'fuzzy'],
    ['Heartbreaker', 'love', 'fuzzy'],
    ['Sunflower', 'flower', 'compound'],
    ['Spinning Around', 'music', 'stemmed'],
    ['City Lights', 'city', 'exact'],
  ] as const)('reads "%s" as %s (%s)', (title, theme, type) => {
    const match = matchTitle(title);
    expect(match.theme).toBe(theme);
    expect(match.themeMatch?.type).toBe(type);
  });

  it('prefers a concrete word to a mood, wherever it comes in the title', () => {
    expect(matchTitle('Lost in the Pines').themeMatch?.word).toBe('pine');
    expect(matchTitle('Wild Heart').theme).toBe('love');
  });

  it('prefers an exact mood word to a fuzzy guess', () => {
    // A two-edit fuzzy match would have turned "golden" into "garden".
    expect(matchTitle('Golden Hour').themeMatch).toEqual({ token: 'golden', word: 'golden', type: 'exact' });
  });

  it('reads colour words as palettes', () => {
    expect(matchTitle('Golden Hour').palettes).toEqual(['sunflower', 'mustard']);
    expect(matchTitle('Colors of You').palettes).toEqual(['spectrum']);
    expect(matchTitle('Red Red Wine').palettes).toEqual(['cherry', 'scarlet']);
  });

  it('finds nothing in a title with no known words', () => {
    const match = matchTitle('Zyphora Elysium');
    expect(match.theme).toBeNull();
    expect(match.palettes).toEqual([]);
  });

  it('splits titles into words: lowercase, accents and punctuation dropped, short words and repeats out', () => {
    expect(tokenize("Café del Mar — it's a Sea, Sea!")).toEqual(['cafe', 'del', 'mar', 'it', 'sea']);
  });
});
