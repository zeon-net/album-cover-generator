import type { LabelDesign } from './design';
import { exportDimensions, renderLabel, type RenderOptions } from './render';
import type { FontSpec, MeasureText } from './text';

/**
 * Draws an SVG into an image file in the browser (PNG by default), `width` pixels wide; the height
 * follows the SVG's shape (a sleeve is 3:2). Web fonts can't load inside an SVG drawn this way: use
 * system fonts, or embed the fonts with `fontCss` when rendering.
 */
export async function svgToBlob(svg: string, width = 1024, type = 'image/png', quality?: number): Promise<Blob> {
  const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const height = box ? Math.round((width * Number(box[2])) / Number(box[1])) : width;
  const sized = svg.replace(/^<svg([^>]*?) width="[^"]*" height="[^"]*"/, `<svg$1 width="${width}" height="${height}"`);
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D canvas');
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image'))), type, quality),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Reads artwork for a label's background (a user's upload, or an AI cover's URL): crops it to a
 * centred square, shrinks it to `size` pixels, and returns it as a data: URL, so it survives drawing
 * the SVG into a canvas. `tone` says whether its top and bottom, where the brand and title go, are
 * dark or light; pass it on as `imageTone`.
 */
export async function readImage(source: Blob | string, size = 1024): Promise<{ href: string; tone: 'dark' | 'light' }> {
  const blob = typeof source === 'string' ? await (await fetch(source)).blob() : source;
  const bitmap = await createImageBitmap(blob);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const out = Math.min(size, side);
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D canvas');
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out);

    // The average brightness of the top and bottom thirds, measured on a small copy.
    const probe = document.createElement('canvas');
    probe.width = 32;
    probe.height = 32;
    const small = probe.getContext('2d', { willReadFrequently: true });
    if (!small) throw new Error('No 2D canvas');
    small.drawImage(canvas, 0, 0, 32, 32);
    const { data } = small.getImageData(0, 0, 32, 32);
    let total = 0;
    let count = 0;
    for (let y = 0; y < 32; y++) {
      if (y >= 11 && y < 21) continue;
      for (let x = 0; x < 32; x++) {
        const i = (y * 32 + x) * 4;
        total += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
        count++;
      }
    }
    return { href: canvas.toDataURL('image/jpeg', 0.9), tone: total / count < 0.55 ? 'dark' : 'light' };
  } finally {
    bitmap.close();
  }
}

function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Gets a font ready: fetches its file and keeps it as a data: URL (so `embedFonts` can carry it), and
 * registers it with this page, so titles measure and preview in it. Fonts without a file pass through.
 */
export async function loadFont(spec: FontSpec): Promise<FontSpec> {
  if (!spec.face) return spec;
  const src = spec.face.src.startsWith('data:') ? spec.face.src : await dataUrl(await (await fetch(spec.face.src)).blob());
  const face = new FontFace(spec.face.name, `url("${src}")`, { weight: String(spec.weight) });
  await face.load();
  document.fonts.add(face);
  return { ...spec, face: { name: spec.face.name, src } };
}

/**
 * A user's own font file (TTF, OTF, WOFF or WOFF2), ready to use. It gets a name of its own, so it
 * can't be mistaken for an installed font, and is drawn at its own weight.
 */
export async function readFont(file: Blob, label = 'Custom font'): Promise<FontSpec> {
  const src = await dataUrl(file);
  const name = `${label.replace(/['"\\]/g, '')} ${src.length.toString(36)}`;
  return loadFont({ family: `'${name}', sans-serif`, weight: 400, face: { name, src } });
}

export interface ExportOptions extends RenderOptions {
  /** The image's height in pixels, and its width too except a sleeve's (1.5 times). Defaults to 3000, the album-art standard. */
  readonly size?: number;
  /** PNG (the default) keeps transparency; JPEG is much smaller but fills transparent parts with black. */
  readonly type?: 'image/png' | 'image/jpeg';
  /** JPEG quality, 0 to 1. Defaults to 0.92. */
  readonly quality?: number;
}

/**
 * Draws a label straight to an image file at any size, from an icon to 3000 × 3000 and beyond, with
 * its fonts embedded so it looks the same everywhere. Artwork is drawn at the size it was read at,
 * so read images at the largest size you'll export (`readImage(file, 3000)`).
 */
export async function exportLabel(design: LabelDesign, options: ExportOptions = {}): Promise<Blob> {
  const { width } = exportDimensions(options.shape ?? 'record', options.size ?? 3000);
  const type = options.type ?? 'image/png';
  return svgToBlob(renderLabel(design, { ...options, embedFonts: true }), width, type, type === 'image/jpeg' ? (options.quality ?? 0.92) : undefined);
}

/** Measures text with the browser's own fonts, for exact title fitting. */
export function canvasMeasure(): MeasureText {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) throw new Error('No 2D canvas');
  return (text, font) => {
    context.font = `${font.weight} ${font.size}px ${font.family}`;
    return context.measureText(text).width;
  };
}
