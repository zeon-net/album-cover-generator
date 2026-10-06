import {
  BACKGROUND_KINDS,
  INK_PRESETS,
  EMBLEM_KINDS,
  PALETTES,
  SCENE_KINDS,
  THEME_IDS,
  canvasMeasure,
  DEFAULT_BRAND_FONT,
  DEFAULT_FONTS,
  DEFAULT_TEXT_FONT,
  FONT_CHOICES,
  fontChoice,
  fontSpec,
  EXPORT_SIZES,
  exportDimensions,
  exportLabel,
  generateLabel,
  loadFont,
  readFont,
  readImage,
  renderLabel,
  type FontSpec,
  type InkPreset,
  type LabelDesign,
  type LabelOptions,
  type RenderOptions,
} from '../src/index';

/** Sample titles, plus a few with no known words. */
const SAMPLE_TITLES = [
  'Midnight Rain', 'Starlights', 'Sunday Morning', 'Ocean Breeze', 'Falling For You', 'Lost in the Pines', 'Better Days',
  'Neon Dreams', 'Burn a Little', 'Higher Ground', 'City Lights', 'Spinning Around', 'Cherry Blossom', 'Desert Skies',
  'Silent Moon', 'Golden Hour', 'Into the Unknown', 'Simple Things', 'Mountain Air', 'Tropical State', 'Fading Echoes',
  'Wild Heart', 'Colors of You', 'Home Again', 'Endless Night', 'I Am The One', 'Zyphora Elysium', 'Take 12',
  'The Night We Danced Under a Thousand Stars',
];

const form = document.querySelector<HTMLFormElement>('#controls')!;
const stage = document.querySelector<HTMLDivElement>('#stage')!;
const why = document.querySelector<HTMLParagraphElement>('#why')!;
const grid = document.querySelector<HTMLDivElement>('#grid')!;
const exportButton = document.querySelector<HTMLButtonElement>('#exportFlags')!;
const measure = canvasMeasure();
// Opens ZEON's Create page with this cover's title, to make the song to go with it.
const CREATE_SONG_URL = 'https://zeon.net/create';
const createSong = document.querySelector<HTMLAnchorElement>('#createSong')!;

let palette: string | undefined;
let ink: InkPreset | 'auto' = 'auto';
// The chosen fonts, loaded into the page; system fonts until the settings say otherwise.
let brandFont: FontSpec = DEFAULT_FONTS.brand;
let textFont: FontSpec = DEFAULT_FONTS.label;
let image: { href: string; tone: 'dark' | 'light' } | null = null;
let current: { design: LabelDesign; svg: string; options: LabelOptions & RenderOptions } | null = null;

// Selects: "Auto" lets the generator decide.
function fill(name: string, values: readonly string[], auto = 'Auto') {
  const select = form.elements.namedItem(name) as HTMLSelectElement;
  select.innerHTML = [`<option value="">${auto}</option>`, ...values.map((value) => `<option value="${value}">${value}</option>`)].join('');
}
fill('theme', ['none', ...THEME_IDS], 'Auto (from the title)');
fill('emblem', EMBLEM_KINDS);
fill('background', BACKGROUND_KINDS);
fill('scene', SCENE_KINDS);

const swatches = document.querySelector<HTMLDivElement>('#swatches')!;
swatches.innerHTML =
  `<button type="button" class="swatch auto" data-palette="" aria-pressed="true">Auto</button>` +
  PALETTES.map((p) => `<button type="button" class="swatch" data-palette="${p.id}" title="${p.id}" style="background:${p.background}" aria-pressed="false"></button>`).join('');
swatches.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-palette]');
  if (!button) return;
  palette = button.dataset.palette || undefined;
  for (const other of swatches.querySelectorAll('button')) other.setAttribute('aria-pressed', String(other === button));
  render();
});

function readOptions(): LabelOptions & RenderOptions {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? '');
  const choice = <T extends string>(name: string) => (text(name) || undefined) as T | undefined;
  return {
    title: text('title'),
    seed: text('seed') || text('title'),
    shape: (['record', 'cover', 'label', 'sleeve'] as const).find((shape) => shape === text('shape')) ?? 'record',
    centre: text('centre') === 'vinyl' ? 'vinyl' : 'open',
    palette,
    theme: choice('theme') ?? 'auto',
    emblem: choice('emblem'),
    background: choice('background'),
    scene: choice('scene'),
    texture: Number(text('texture')),
    ringWear: data.has('ringWear'),
    edgeWear: data.has('edgeWear'),
    brand: text('brand'),
    // Empty means the default: "Side A" and "STEREO" on a drawn label, nothing over an image.
    side: text('side') || undefined,
    stereo: text('stereo') || undefined,
    uppercase: data.has('uppercase'),
    measure,
    fonts: { brand: brandFont, label: textFont },
    ...(image ? { image: image.href, imageTone: image.tone } : {}),
    ink,
  };
}

function render() {
  const options = readOptions();
  const { design, svg } = generateLabel(options);
  current = { design, svg, options };
  stage.innerHTML = svg;
  updateDownload();
  const songTitle = options.title?.trim();
  createSong.href = songTitle ? `${CREATE_SONG_URL}?${new URLSearchParams({ title: songTitle })}` : CREATE_SONG_URL;
  // Any ink can be picked: Auto chooses for readability, a preset is the user's call.
  document.querySelector<HTMLElement>('#inkInfo')!.textContent =
    ink === 'auto' ? 'Auto: the ink that reads best.' : `${INK_PRESETS[ink].name} ink, on the text and the emblem.`;
  // A cover has no hole, and only covers (and sleeves) have sleeve wear.
  document.querySelector<HTMLFieldSetElement>('#centreField')!.disabled = options.shape === 'cover';
  document.querySelector<HTMLFieldSetElement>('#coverWearField')!.disabled = options.shape !== 'cover' && options.shape !== 'sleeve';
  document.querySelector('#textureValue')!.textContent = String(options.texture);
  if (design.image) {
    why.innerHTML = `Printed over <b>your image</b>, which is <b>${design.image.tone}</b> at the top and bottom, so the ink is <b>${design.image.tone === 'dark' ? 'cream' : 'near-black'}</b>`;
    return;
  }
  const match = design.match.themeMatch;
  const from = match ? ` from “${match.token}” (${match.type})` : '';
  why.innerHTML =
    `Theme <b>${design.theme ?? 'none'}</b>${design.theme ? from : ''} · palette <b>${design.palette}</b>` +
    (design.match.paletteMatch ? ` from “${design.match.paletteMatch.token}”` : '') +
    ` · <b>${design.background}</b> background · <b>${design.scene}</b> scene · <b>${design.emblem}</b> emblem`;
  try {
    history.replaceState(null, '', `#${new URLSearchParams({ title: options.title ?? '', seed: String(options.seed ?? '') })}`);
  } catch {
    // The address is a convenience; drawing doesn't depend on it.
  }
}

form.addEventListener('input', render);
form.addEventListener('change', render);
document.querySelector('#reroll')!.addEventListener('click', () => {
  (form.elements.namedItem('seed') as HTMLInputElement).value = Math.random().toString(36).slice(2, 8);
  render();
});

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const fileName = () => (current?.design.title || 'label').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'label';

// Export: any size from an icon to 3000 × 3000, as PNG or JPEG, fonts embedded.
const exportSize = document.querySelector<HTMLInputElement>('input[name=exportSize]')!;
const exportType = document.querySelector<HTMLSelectElement>('select[name=exportType]')!;
const downloadButton = document.querySelector<HTMLButtonElement>('#png')!;
document.querySelector('#exportSizes')!.innerHTML = EXPORT_SIZES.map((px) => `<option value="${px}">${px === 3000 ? 'album-art standard' : px <= 128 ? 'icon' : px <= 640 ? 'thumbnail' : ''}</option>`).join('');
function updateDownload() {
  const { width, height } = exportDimensions(current?.options.shape ?? 'record', Number(exportSize.value) || 3000);
  downloadButton.textContent = `Download ${width} × ${height} ${exportType.value === 'image/jpeg' ? 'JPEG' : 'PNG'}`;
}
exportSize.addEventListener('input', updateDownload);
exportType.addEventListener('change', updateDownload);
downloadButton.addEventListener('click', async () => {
  if (!current) return;
  const label = downloadButton.textContent;
  downloadButton.disabled = true;
  downloadButton.textContent = 'Drawing…';
  try {
    const type = exportType.value === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await exportLabel(current.design, { ...current.options, size: Number(exportSize.value) || 3000, type });
    const { width, height } = exportDimensions(current.options.shape ?? 'record', Number(exportSize.value) || 3000);
    download(blob, `${fileName()}-${width}x${height}.${type === 'image/jpeg' ? 'jpg' : 'png'}`);
  } finally {
    downloadButton.disabled = false;
    downloadButton.textContent = label;
  }
});
document.querySelector('#svg')!.addEventListener('click', () => {
  if (current) download(new Blob([renderLabel(current.design, { ...current.options, embedFonts: true })], { type: 'image/svg+xml' }), `${fileName()}.svg`);
});
document.querySelector('#json')!.addEventListener('click', async (event) => {
  if (!current) return;
  const button = event.currentTarget as HTMLButtonElement;
  try {
    await navigator.clipboard.writeText(JSON.stringify(current.design, null, 2));
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Copy failed';
  }
  setTimeout(() => (button.textContent = 'Copy design JSON'), 1500);
});

// Flags live in this browser only: they're a review aid, not shared data.
type Flag = { title: string; seed: string; design: Pick<LabelDesign, 'palette' | 'theme' | 'background' | 'scene' | 'emblem'> };
const FLAGS_KEY = 'album-cover-generator:flags';
function loadFlags(): Flag[] {
  try {
    return JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '[]') as Flag[];
  } catch {
    return [];
  }
}
let flags = loadFlags();
function saveFlags() {
  try {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  } catch {
    // Without storage the flags still work until the page closes.
  }
  exportButton.textContent = `Export flagged (${flags.length})`;
}
saveFlags();

function batch() {
  const mine = document.querySelector<HTMLInputElement>('#batchMine')!.checked;
  const { shape, centre, title, texture, ringWear, edgeWear } = readOptions();
  grid.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const seed = Math.random().toString(36).slice(2, 8);
    const cardTitle = mine && title ? title : SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)];
    const { design, svg } = generateLabel({ title: cardTitle, seed, shape, centre, texture, ringWear, edgeWear, measure, size: 340, fonts: { brand: brandFont, label: textFont } });
    const card = document.createElement('div');
    const isFlagged = () => flags.some((flag) => flag.seed === seed && flag.title === cardTitle);
    card.className = 'card';
    card.innerHTML = `${svg}<div class="caption">${design.theme ?? '—'} · ${design.palette} · ${design.emblem}</div><button type="button" class="flag" title="Flag this label">⚑</button>`;
    card.querySelector('.flag')!.addEventListener('click', (event) => {
      event.stopPropagation();
      if (isFlagged()) flags = flags.filter((flag) => !(flag.seed === seed && flag.title === cardTitle));
      else flags.push({ title: cardTitle, seed, design: { palette: design.palette, theme: design.theme, background: design.background, scene: design.scene, emblem: design.emblem } });
      card.classList.toggle('flagged', isFlagged());
      saveFlags();
    });
    card.classList.toggle('flagged', isFlagged());
    card.addEventListener('click', () => {
      (form.elements.namedItem('title') as HTMLInputElement).value = cardTitle;
      (form.elements.namedItem('seed') as HTMLInputElement).value = seed;
      for (const name of ['theme', 'emblem', 'background', 'scene']) (form.elements.namedItem(name) as HTMLSelectElement).value = '';
      (swatches.querySelector('button[data-palette=""]') as HTMLButtonElement).click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    grid.append(card);
  }
}

document.querySelector('#newBatch')!.addEventListener('click', batch);
document.querySelector('#batchMine')!.addEventListener('change', batch);
exportButton.addEventListener('click', () => download(new Blob([JSON.stringify(flags, null, 2)], { type: 'application/json' }), 'flagged-labels.json'));
document.querySelector('#clearFlags')!.addEventListener('click', () => {
  flags = [];
  saveFlags();
  for (const card of grid.querySelectorAll('.card.flagged')) card.classList.remove('flagged');
});

// The brand is a setting: remembered in this browser, and ZEON when left empty.
const BRAND_KEY = 'album-cover-generator:brand';
const brandInput = form.elements.namedItem('brand') as HTMLInputElement;
try {
  brandInput.value = localStorage.getItem(BRAND_KEY) ?? '';
} catch {
  // Without storage the field just starts empty, which means ZEON.
}
brandInput.addEventListener('input', () => {
  try {
    localStorage.setItem(BRAND_KEY, brandInput.value);
  } catch {
    // Remembering is a convenience.
  }
});

// A background image, read in the browser: cropped square, shrunk, and measured for tone.
const imageFile = document.querySelector<HTMLInputElement>('#imageFile')!;
const clearImage = document.querySelector<HTMLButtonElement>('#clearImage')!;
// The browser's own file picker doesn't fit the page, so a themed button opens it.
document.querySelector('#chooseImage')!.addEventListener('click', () => imageFile.click());
const imageInfo = document.querySelector<HTMLElement>('#imageInfo')!;
imageFile.addEventListener('change', async () => {
  const file = imageFile.files?.[0];
  if (!file) return;
  try {
    // Kept at up to 3000 px, so the largest export stays sharp.
    image = await readImage(file, 3000);
    imageInfo.textContent = `Using ${file.name}: ${image.tone} at the top and bottom.`;
    clearImage.disabled = false;
  } catch {
    image = null;
    imageInfo.textContent = 'That file could not be read as an image.';
  }
  render();
});
clearImage.addEventListener('click', () => {
  image = null;
  clearImage.disabled = true;
  imageFile.value = '';
  imageInfo.textContent = 'None: the label is drawn from its title and seed.';
  render();
});

// Text colour: a preset, or Auto.
const inkSwatches = document.querySelector<HTMLDivElement>('#inkSwatches')!;
inkSwatches.innerHTML =
  `<button type="button" class="swatch auto" data-ink="auto" aria-pressed="true">Auto</button>` +
  (Object.keys(INK_PRESETS) as InkPreset[])
    .map((id) => `<button type="button" class="swatch" data-ink="${id}" title="${INK_PRESETS[id].name}" style="background:${INK_PRESETS[id].color}" aria-pressed="false"></button>`)
    .join('');
inkSwatches.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-ink]');
  if (!button) return;
  ink = button.dataset.ink as InkPreset | 'auto';
  for (const other of inkSwatches.querySelectorAll('button')) other.setAttribute('aria-pressed', String(other === button));
  render();
});

// Fonts: the shipped ones by name, or the user's own file. Choices are remembered like the brand.
const FONT_FILES = import.meta.glob('../fonts/*.ttf', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const fontUrl = (file: string) => FONT_FILES[`../fonts/${file}`];
const FONT_KEYS = { brandFont: 'album-cover-generator:brand-font', textFont: 'album-cover-generator:text-font' } as const;
const fontInfo = document.querySelector<HTMLElement>('#fontInfo')!;
const fontFile = document.querySelector<HTMLInputElement>('#fontFile')!;
let uploadFor: keyof typeof FONT_KEYS = 'brandFont';

for (const name of ['brandFont', 'textFont'] as const) {
  const select = form.elements.namedItem(name) as HTMLSelectElement;
  const group = (role: 'brand' | 'text', label: string) =>
    `<optgroup label="${label}">${FONT_CHOICES.filter((font) => font.role === role).map((font) => `<option value="${font.id}">${font.name}</option>`).join('')}</optgroup>`;
  const display = group('brand', 'Display, for the brand');
  const condensed = group('text', 'Condensed, for the text');
  select.innerHTML = (name === 'brandFont' ? display + condensed : condensed + display) + '<option value="upload">Upload your own…</option>';
  let saved = '';
  try {
    saved = localStorage.getItem(FONT_KEYS[name]) ?? '';
  } catch {
    // Without storage the defaults stand.
  }
  select.value = FONT_CHOICES.some((font) => font.id === saved) ? saved : name === 'brandFont' ? DEFAULT_BRAND_FONT : DEFAULT_TEXT_FONT;
  select.dataset.previous = select.value;
  select.addEventListener('change', async (event) => {
    event.stopPropagation();
    if (select.value === 'upload') {
      uploadFor = name;
      select.value = select.dataset.previous ?? '';
      fontFile.click();
      return;
    }
    await useFont(name, select.value);
  });
}

// Choices remembered from an earlier visit still need their files loaded.
for (const name of ['brandFont', 'textFont'] as const) {
  const id = (form.elements.namedItem(name) as HTMLSelectElement).value;
  if (id !== DEFAULT_BRAND_FONT && id !== DEFAULT_TEXT_FONT) void useFont(name, id);
}

async function useFont(name: keyof typeof FONT_KEYS, id: string) {
  const select = form.elements.namedItem(name) as HTMLSelectElement;
  const choice = fontChoice(id);
  try {
    const spec = await loadFont(fontSpec(id, choice.file ? fontUrl(choice.file) : undefined));
    if (name === 'brandFont') brandFont = spec;
    else textFont = spec;
    select.dataset.previous = id;
    fontInfo.textContent = choice.licence ? `${choice.name} (${choice.licence}) · fonts embed in downloads.` : 'Fonts embed in downloads.';
    try {
      localStorage.setItem(FONT_KEYS[name], id);
    } catch {
      // Remembering is a convenience.
    }
  } catch {
    fontInfo.textContent = `${choice.name} could not be loaded.`;
  }
  render();
  batch();
}

fontFile.addEventListener('change', async () => {
  const file = fontFile.files?.[0];
  fontFile.value = '';
  if (!file) return;
  try {
    const spec = await readFont(file, file.name.replace(/\.[^.]+$/, ''));
    if (uploadFor === 'brandFont') brandFont = spec;
    else textFont = spec;
    const select = form.elements.namedItem(uploadFor) as HTMLSelectElement;
    let option = select.querySelector<HTMLOptionElement>('option[value="custom"]');
    if (!option) {
      option = document.createElement('option');
      option.value = 'custom';
      select.insertBefore(option, select.querySelector('option[value="upload"]'));
    }
    option.textContent = `Your font: ${file.name}`;
    select.value = 'custom';
    select.dataset.previous = 'custom';
    fontInfo.textContent = `Using ${file.name} · fonts embed in downloads.`;
  } catch {
    fontInfo.textContent = 'That file could not be read as a font.';
  }
  render();
  batch();
});

// The install tip copies its command.
const copyInstall = document.querySelector<HTMLButtonElement>('#copyInstall')!;
copyInstall.addEventListener('click', async () => {
  const command = document.querySelector('#installCommand')!.textContent ?? '';
  try {
    await navigator.clipboard.writeText(command);
    copyInstall.textContent = 'Copied';
  } catch {
    // Without clipboard access, select the command so it can be copied by hand.
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('#installCommand')!);
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
    copyInstall.textContent = 'Press ⌘C';
  }
  setTimeout(() => (copyInstall.textContent = 'Copy'), 1600);
});

// Open the label in the address, if any.
const params = new URLSearchParams(location.hash.slice(1));
if (params.get('title')) (form.elements.namedItem('title') as HTMLInputElement).value = params.get('title')!;
if (params.get('seed')) (form.elements.namedItem('seed') as HTMLInputElement).value = params.get('seed')!;

render();
batch();
