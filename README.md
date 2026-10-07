# album-cover-generator

Retro vinyl records, labels and album covers, drawn as SVG from a song's title.

**[Try it live](https://album-cover-generator.zeon.net)**: design a cover, then download it at any size.

Give it a title and a stable id, and it designs a label in the style of a 1960s–70s 7-inch single: palette, emblem, scene, background, lettering and wear. The same song always gets the same design. Draw it as a record, a lone label, a square cover, or a sleeve with the record sliding out, and export anything from a 64 px icon to 3000 × 3000 album art.

- **Deterministic:** a design is plain JSON. Store it, and it redraws identically.
- **Reads the title:** "Midnight Rain" gets a moon on a night palette, and "Golden Hour" a yellow label. Plain word rules, no AI model.
- **Endless variety:** 25 palettes, 25 emblems, 7 scenes and 8 backgrounds, each varied by the seed.
- **Readable:** the title and logo always contrast with whatever they sit on.
- **Your artwork:** print the brand and title over any image: a user's upload or an AI-generated cover.
- **Fonts:** 13 open-licence fonts included, or the user's own font file.
- **Any size:** crisp vector SVG, and PNG or JPEG at any size up to 4096 px.
- **No runtime dependencies.**

## Quick start

```sh
npm install @zeon.net/album-cover-generator
```

```ts
import { generateLabel, exportLabel, canvasMeasure } from '@zeon.net/album-cover-generator';

const { svg, design } = generateLabel({
  title: 'Midnight Rain',
  seed: 'song-42',          // a stable id: the same id always gives the same design
  shape: 'cover',           // 'record' (the default), 'label', 'cover' or 'sleeve'
  measure: canvasMeasure(), // in a browser: fit the title exactly
});

document.querySelector('#art').innerHTML = svg;

const png = await exportLabel(design, { shape: 'cover', size: 3000 }); // a 3000 × 3000 PNG Blob
```

`generateLabel` works anywhere: browser, Node, workers. `exportLabel`, `readImage`, `loadFont`, `readFont` and `canvasMeasure` need a browser.


## Shapes

| Shape | What you get |
| --- | --- |
| `record` | The label on an old black record, with grooves, reflection, dust and a worn rim. Transparent outside the record and in the centre hole |
| `label` | The round label alone, transparent outside it |
| `cover` | The same design as a square sleeve: the emblem large in the middle, and an old sleeve's wear (darker corners, rubbed edges, ring wear) |
| `sleeve` | The cover with the record half out of it, as a 3:2 picture |

## Options

| Option | Default | |
| --- | --- | --- |
| `title` | `''` | Printed in capitals (`uppercase: false` keeps its case). One line, else two, else squeezed; cut at 60 characters |
| `seed` | the title | A string or number that identifies the song |
| `brand` | `'ZEON'` | The wordmark at the top. Missing or blank means ZEON; `false` prints none |
| `stereo`, `side` | `'STEREO'`, `'Side A'` | The small print. Left out over an image unless set |
| `ink` | `'auto'` | `'auto'` picks the most readable ink. A preset from `INK_PRESETS` (black, cream, navy, burgundy, forest, gold) colours the text and emblem as asked, with no readability check |
| `palette` | from the title | One of the 25 palette ids in `PALETTES` |
| `theme` | `'auto'` | `'auto'` reads the title, `'none'` ignores it, or force one of `THEME_IDS` |
| `emblem`, `background`, `scene` | chosen | Force a part: see `EMBLEM_KINDS`, `BACKGROUND_KINDS`, `SCENE_KINDS` |
| `image`, `imageTone` | none, `'dark'` | Artwork to print over instead of drawn art (see below) |
| `texture` | `0.6` | Grain and wear, from 0 (clean) to 1 (well played) |
| `ringWear`, `edgeWear` | `true` | On a cover or sleeve: the dashed ring wear, and the rubbed edges and corners |
| `shape` | `'record'` | See Shapes |
| `centre` | `'open'` | For a record or label: the centre hole open, or `'vinyl'`, filled with record down to a spindle hole |
| `size` | `1000` | The SVG's height in pixels; a sleeve is 1.5 times as wide |
| `fonts`, `embedFonts` | system fonts | See Fonts |
| `measure` | estimate | Measures text for fitting the title; `canvasMeasure()` in a browser |

## Your own artwork

Pass an image, and it replaces the drawn background, scene and emblem. Only the brand and the title are printed over it. A soft fade at the top and bottom keeps them readable on any picture, and the paper grain, wear, record and sleeve still apply.

```ts
const art = await readImage(file, 3000); // a centred square up to 3000 px, as a data: URL, plus its tone
const { svg } = generateLabel({ title: 'I Am The One', seed: 'song-7', image: art.href, imageTone: art.tone });
```

`readImage` also reports whether the image is dark or light at the top and bottom, which picks a cream or near-black ink.

To show the image alone, print nothing over it: `brand: false` and an empty title (and no `stereo` or `side`). The fade is then left out too. Add `texture: 0`, `ringWear: false` and `edgeWear: false` for no grain or wear either.

Use a data: URL, which `readImage` makes. An SVG drawn into a canvas can't fetch other addresses, so a plain URL only shows on a page.

## Fonts

The brand and the text each take a font. The defaults are system fonts (Avenir Next Heavy and DIN Condensed on macOS, with fallbacks).

`FONT_CHOICES` lists 13 more, shipped in `fonts/`:

- **For the brand:** Archivo Black, Alfa Slab One, Shrikhand, Pacifico, Righteous, Rubik Mono One, Bungee.
- **For the text:** Oswald, Bebas Neue, Anton, Barlow Condensed, League Gothic, Special Elite.

```ts
// The files are in the package's fonts/ folder. With Vite, import a file's URL; or serve the folder yourself.
import shrikhandUrl from '@zeon.net/album-cover-generator/fonts/Shrikhand-Regular.ttf?url';

const brand = await loadFont(fontSpec('shrikhand', shrikhandUrl));
const label = await readFont(uploadedFile); // or the user's own TTF, OTF, WOFF or WOFF2

generateLabel({ title, seed, fonts: { brand, label }, measure: canvasMeasure() }); // on a page
exportLabel(design, { fonts: { brand, label } });                                // fonts embedded
```

- **Sizing:** titles fit the chosen font, and the brand, "STEREO" and the side shrink to their space, so a wide font can't run into the hole or the edge.
- **Embedding:** exports embed their fonts automatically. For a downloaded SVG, render with `embedFonts: true`.

## Export

`exportLabel(design, { shape, size, type, quality })` draws a design to a PNG or JPEG `Blob`, with its fonts embedded.

- **Size:** from 16 to 4096 px; the default is 3000, the usual size for digital album art. `EXPORT_SIZES` holds presets from 64 to 3000 for a picker.
- **Format:** PNG keeps transparency. JPEG is about a tenth of the size of a textured 3000 px cover, and fills transparent parts with black.

| Export, in Chrome | File size | Time |
| --- | --- | --- |
| Cover, 256 px PNG | 102 KB | 15 ms |
| Cover, 3000 px PNG | 11.3 MB | 1.3 s |
| Cover, 3000 px JPEG | 1.1 MB | 1.1 s |
| Sleeve, 4500 × 3000 JPEG | 1.6 MB | 2 s |

## How a design is chosen

1. **The title** is read with plain word rules: exact words, plurals and "-ing" forms, slang ("nite"), near spellings, then words inside longer words. Concrete words ("pines") beat moods ("lost"), and colour words ("golden", "red") choose the palette.
2. **The theme** found in the title (night, ocean, sun, fire, love, forest, mountain, city, space, flower, rain, desert, music or dream) suggests emblems, scenes, backgrounds and palettes. About one design in five ignores the suggestions, for variety.
3. **The seed** decides the rest. Each part draws from its own random stream, so a change to one part doesn't reshuffle the others.

**Parts:**
- **25 emblems:** 15 motifs (sun, sunset, moon, star, sparkles, trees, mountain, planet, flower, waves, flame, cloud, heart, record, drop) and 10 abstract shapes (target, prism, spiral, overlap, bars, echo, orbit, burst, diamond, dots).
- **7 scenes:** none, waves, mountains, dunes, hills, skyline, beach.
- **8 backgrounds:** flat, rings, sunburst, gradient, split, stripes, starfield, spectrum.

**Built-in rules:**
- **Readable text:** with the automatic ink, everything the text can sit on contrasts with it by at least 3.2:1, and the background by 4.5:1. A scene's front layer, which the title sits on, is chosen to suit the ink.
- **Safe shapes:** anything repeated around a centre is itself symmetric, and rays come at least six at a time, so no emblem can form a hateful symbol by accident.

## Development

```sh
npm install
npm run dev      # the demo page, at http://localhost:5180
npm run check    # typecheck, tests and library build
```

The demo has every option, downloads at any size, and a random batch where you can flag designs that look wrong and export the list.

| Source | |
| --- | --- |
| `src/design.ts` | Decides a design: theme, palette, parts, colours |
| `src/render.ts` | Draws a design as SVG in each shape |
| `src/themes.ts` | Title matching and themes |
| `src/palettes.ts` | Palettes and ink presets |
| `src/backgrounds.ts`, `scenes.ts`, `emblems.ts` | The drawn parts |
| `src/text.ts` | Lettering, and fitting it |
| `src/texture.ts`, `vinyl.ts` | Paper grain, wear and the record |
| `src/fonts.ts` | Font choices and embedding |
| `src/raster.ts` | Browser helpers: export, images, fonts, text measuring |

The demo deploys to [album-cover-generator.zeon.net](https://album-cover-generator.zeon.net) from `main`, through `.github/workflows/pages.yml`. The workflow runs the full check first, so nothing ships if a test fails.

**Social card:** `demo/public/og-image.jpg` is a 1200 × 630 screenshot of `demo/og.html`. To change it, run `npm run dev`, open `/og.html` (`?title=` and `?seed=` try other designs) in a 1200 × 630 window, and save a JPEG over it.

**Releasing:** bump `version` in `package.json`, then publish a GitHub release tagged `v` plus that version (for example `v0.2.0`). `.github/workflows/publish.yml` checks the tag matches, runs the full check, and publishes to npm with provenance, through npm's trusted publishing.

On npm 10.9, if installing Vitest fails with "Cannot read properties of null (reading 'edgesOut')", install it with `--legacy-peer-deps`.

## Licence

MIT, see [LICENSE](LICENSE). The fonts in `fonts/` keep their own licences, in `fonts/licences/`: the SIL Open Font License 1.1, or the Apache License 2.0 for Special Elite.
