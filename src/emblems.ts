import { isDark, mix } from './color';
import { paletteById } from './palettes';
import { COVER_EMBLEM_BOX, EMBLEM_BOX, type DrawContext, type EmblemKind } from './parts';
import { circle, n, polyPath, smoothPath, starPath, type Point } from './svg';

/**
 * The emblem left of the hole. Motifs are recognisable things varied by the seed; abstract emblems
 * combine plain shapes.
 *
 * Safety rule: anything repeated around a centre is itself mirror-symmetric (straight rays, round or
 * pointed petals, star tips), and rays come at least six at a time. Turning bent or L-shaped arms four
 * times around a centre can make a swastika, so no emblem does that. There are no lightning bolts either.
 */
export function drawEmblem(kind: EmblemKind, ctx: DrawContext): string {
  if (kind === 'none') return '';
  const place = ctx.layout === 'cover' ? COVER_EMBLEM_BOX : EMBLEM_BOX;
  const box = { x: place.cx, y: place.cy, u: place.size / 100 };
  return `<g>${DRAW[kind](ctx, box)}</g>`;
}

type Box = { x: number; y: number; u: number };
type Draw = (ctx: DrawContext, box: Box) => string;

const DRAW: Record<Exclude<EmblemKind, 'none'>, Draw> = {
  sun({ random, colors, id, defs }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const rays = random.int(8, 16);
    const core = u * random.range(19, 25);
    const inner = core + u * random.range(4, 8);
    const outer = u * random.range(42, 48);
    const rayColor = random.chance(0.5) ? main : second;
    let out = '';
    if (random.chance(0.5)) {
      const half = (Math.PI / rays) * random.range(0.35, 0.55);
      let d = '';
      for (let i = 0; i < rays; i++) {
        const a = (i * 2 * Math.PI) / rays - Math.PI / 2;
        d += polyPath([
          [x + Math.cos(a - half) * inner, y + Math.sin(a - half) * inner],
          [x + Math.cos(a) * outer, y + Math.sin(a) * outer],
          [x + Math.cos(a + half) * inner, y + Math.sin(a + half) * inner],
        ]);
      }
      out += `<path d="${d}" fill="${rayColor}"/>`;
    } else {
      let d = '';
      for (let i = 0; i < rays; i++) {
        const a = (i * 2 * Math.PI) / rays - Math.PI / 2;
        d += `M${n(x + Math.cos(a) * inner)} ${n(y + Math.sin(a) * inner)}L${n(x + Math.cos(a) * outer)} ${n(y + Math.sin(a) * outer)}`;
      }
      out += `<path d="${d}" stroke="${rayColor}" stroke-width="${n(u * random.range(3.5, 5.5))}" stroke-linecap="round" fill="none"/>`;
    }
    if (random.chance(0.45)) {
      // Retro sun: horizontal gaps cut across its lower half.
      const gaps = random.int(3, 4);
      let bars = '';
      for (let i = 0; i < gaps; i++) {
        const gy = y + core * (0.12 + i * 0.24);
        bars += `<rect x="${n(x - core - 2)}" y="${n(gy)}" width="${n(core * 2 + 4)}" height="${n(core * (0.05 + i * 0.03))}" fill="#000"/>`;
      }
      defs.push(`<mask id="${id}-sun" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000"><rect width="1000" height="1000" fill="#fff"/>${bars}</mask>`);
      out += circle(x, y, core, main, `mask="url(#${id}-sun)"`);
    } else {
      out += circle(x, y, core, main);
    }
    return out;
  },

  sunset({ random, colors, id, defs }, { x, y, u }) {
    const [main, second, third] = colors.emblem;
    const horizon = y + u * random.range(2, 10);
    const radius = u * random.range(24, 31);
    defs.push(`<clipPath id="${id}-sky"><rect x="0" y="0" width="1000" height="${n(horizon)}"/></clipPath>`);
    let out = '';
    if (random.chance(0.55)) {
      const rays = random.int(6, 9);
      let d = '';
      for (let i = 0; i < rays; i++) {
        const a = Math.PI + (Math.PI * (i + 0.5)) / rays;
        d += `M${n(x + Math.cos(a) * (radius + u * 5))} ${n(horizon + Math.sin(a) * (radius + u * 5))}L${n(x + Math.cos(a) * (radius + u * 15))} ${n(horizon + Math.sin(a) * (radius + u * 15))}`;
      }
      out += `<path d="${d}" stroke="${second}" stroke-width="${n(u * 4)}" stroke-linecap="round"/>`;
    }
    out += `<g clip-path="url(#${id}-sky)">${circle(x, horizon, radius, main)}</g>`;
    const lines = random.int(2, 4);
    const amplitude = u * random.range(2, 4);
    for (let i = 0; i < lines; i++) {
      const ly = horizon + u * (7 + i * 10);
      const half = u * (40 - i * random.range(3, 7));
      const points: Point[] = [];
      for (let k = 0; k <= 12; k++) points.push([x - half + (k * half * 2) / 12, ly + Math.sin((k / 12) * Math.PI * 4) * amplitude]);
      out += `<path d="${smoothPath(points)}" stroke="${third}" stroke-width="${n(u * random.range(4, 5.5))}" stroke-linecap="round" fill="none"/>`;
    }
    return out;
  },

  moon({ random, colors, id, defs }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const radius = u * random.range(30, 38);
    const tilt = random.range(-0.6, 0.6) + (random.chance(0.5) ? 0 : Math.PI);
    const offset = radius * random.range(0.35, 0.6);
    const bite = radius * random.range(0.85, 1);
    defs.push(
      `<mask id="${id}-moon" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000"><rect width="1000" height="1000" fill="#000"/>${circle(x, y, radius, '#fff')}${circle(x + Math.cos(tilt) * offset, y + Math.sin(tilt) * offset, bite, '#000')}</mask>`,
    );
    let out = `<rect x="${n(x - radius - 2)}" y="${n(y - radius - 2)}" width="${n(radius * 2 + 4)}" height="${n(radius * 2 + 4)}" fill="${main}" mask="url(#${id}-moon)"/>`;
    const stars = random.int(0, 3);
    for (let i = 0; i < stars; i++) {
      const a = tilt + random.range(-0.7, 0.7);
      const d = radius * random.range(0.7, 1.15);
      const size = u * random.range(4, 8);
      out += `<path d="${starPath(x + Math.cos(a) * d, y + Math.sin(a) * d, 4, size, size * 0.3)}" fill="${second}"/>`;
    }
    return out;
  },

  star({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const points = random.int(4, 8);
    const outer = u * random.range(38, 46);
    const inner = outer * (points === 4 ? random.range(0.18, 0.3) : random.range(0.38, 0.5));
    let out = `<path d="${starPath(x, y, points, outer, inner)}" fill="${main}"/>`;
    if (random.chance(0.4)) {
      const extras = random.int(1, 3);
      for (let i = 0; i < extras; i++) {
        const a = random.range(0, Math.PI * 2);
        const size = u * random.range(5, 9);
        out += `<path d="${starPath(x + Math.cos(a) * outer * 0.95, y + Math.sin(a) * outer * 0.95, 4, size, size * 0.3)}" fill="${second}"/>`;
      }
    }
    return out;
  },

  sparkles({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const spots: [number, number, number][] = [
      [x + u * random.range(-12, 0), y + u * random.range(-6, 8), u * random.range(22, 30)],
      [x + u * random.range(18, 30), y - u * random.range(18, 30), u * random.range(9, 14)],
      [x + u * random.range(14, 26), y + u * random.range(18, 30), u * random.range(7, 11)],
      [x - u * random.range(26, 36), y - u * random.range(22, 34), u * random.range(6, 9)],
    ];
    return spots
      .slice(0, random.int(3, 4))
      .map(([sx, sy, size], i) => `<path d="${starPath(sx, sy, 4, size, size * random.range(0.18, 0.28))}" fill="${i === 0 ? main : random.pick([main, second])}"/>`)
      .join('');
  },

  trees({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const count = random.int(1, 3);
    const ground = y + u * 44;
    let out = '';
    for (let i = 0; i < count; i++) {
      const tx = count === 1 ? x : x + u * (-26 + (52 * i) / (count - 1)) + u * random.range(-4, 4);
      const height = u * (count === 1 ? random.range(75, 90) : random.range(52, 82));
      const width = height * random.range(0.42, 0.56);
      const tiers = random.int(2, 4);
      const trunk = height * 0.12;
      const color = count > 1 && i !== Math.floor(count / 2) && random.chance(0.3) ? second : main;
      out += `<rect x="${n(tx - width * 0.06)}" y="${n(ground - trunk)}" width="${n(width * 0.12)}" height="${n(trunk)}" fill="${color}"/>`;
      const crown = height - trunk;
      for (let t = 0; t < tiers; t++) {
        const tierTop = ground - height + (crown * t) / (tiers + 0.6);
        const tierBottom = ground - trunk - (crown * (tiers - 1 - t)) / (tiers + 2.2);
        const tierWidth = width * (0.55 + (0.45 * (t + 1)) / tiers);
        out += `<path d="${polyPath([[tx, tierTop], [tx + tierWidth / 2, tierBottom], [tx - tierWidth / 2, tierBottom]])}" fill="${color}"/>`;
      }
    }
    return out;
  },

  mountain({ random, colors }, { x, y, u }) {
    const [main, second, third] = colors.emblem;
    const peaks = random.int(1, 3);
    const ground = y + u * 38;
    let out = '';
    const order = random.shuffle(Array.from({ length: peaks }, (_, i) => i));
    for (const i of order) {
      const px = peaks === 1 ? x : x + u * (-14 + (28 * i) / (peaks - 1)) + u * random.range(-3, 3);
      const height = u * random.range(42, 68);
      const half = Math.min(u * 42, height * random.range(0.6, 0.85));
      const top: Point = [px, ground - height];
      const color = i === order[order.length - 1] ? main : mix(main, third, 0.35);
      out += `<path d="${polyPath([top, [px + half, ground], [px - half, ground]])}" fill="${color}"/>`;
      if (random.chance(0.75)) {
        const t = random.range(0.28, 0.4);
        const left: Point = [px - half * t, ground - height * (1 - t)];
        const right: Point = [px + half * t, ground - height * (1 - t)];
        const notch: Point = [px + random.range(-0.2, 0.2) * half * t, ground - height * (1 - t * 0.65)];
        out += `<path d="${polyPath([top, right, notch, left])}" fill="${second}"/>`;
      }
    }
    return out;
  },

  planet({ random, colors, id, defs }, { x, y, u }) {
    const [main, second, third] = colors.emblem;
    const radius = u * random.range(21, 28);
    const rx = radius * random.range(1.6, 1.95);
    const ry = rx * random.range(0.2, 0.36);
    const tilt = random.range(-28, 28);
    const width = u * random.range(3, 5.5);
    const ring = (sweep: 0 | 1) => `<path d="M${n(x - rx)} ${n(y)}A${n(rx)} ${n(ry)} 0 0 ${sweep} ${n(x + rx)} ${n(y)}" stroke="${second}" stroke-width="${n(width)}" fill="none" stroke-linecap="round" transform="rotate(${n(tilt)} ${n(x)} ${n(y)})"/>`;
    let body = circle(x, y, radius, main);
    if (random.chance(0.45)) {
      defs.push(`<clipPath id="${id}-planet">${circle(x, y, radius, '#000')}</clipPath>`);
      const bands = random.int(1, 2);
      let stripes = '';
      for (let i = 0; i < bands; i++) {
        const by = y - radius * 0.3 + i * radius * 0.45;
        stripes += `<rect x="${n(x - radius)}" y="${n(by)}" width="${n(radius * 2)}" height="${n(radius * random.range(0.12, 0.2))}" fill="${third}"/>`;
      }
      body += `<g clip-path="url(#${id}-planet)" transform="rotate(${n(tilt)} ${n(x)} ${n(y)})">${stripes}</g>`;
    }
    return ring(1) + body + ring(0);
  },

  flower({ random, colors }, { x, y, u }) {
    const [main, second, third] = colors.emblem;
    const petals = random.int(5, 8);
    const length = u * random.range(18, 23);
    const width = length * random.range(0.75, 1.05);
    const distance = length * random.range(0.85, 1);
    const pointed = random.chance(0.4);
    const petal = (scale: number, angle: number, color: string) => {
      const l = length * scale;
      const w = width * scale;
      const shape = pointed
        ? `<path d="M${n(x)} ${n(y - distance * scale - l)}Q${n(x + w)} ${n(y - distance * scale)} ${n(x)} ${n(y - distance * scale + l * 0.9)}Q${n(x - w)} ${n(y - distance * scale)} ${n(x)} ${n(y - distance * scale - l)}Z" fill="${color}"/>`
        : `<ellipse cx="${n(x)}" cy="${n(y - distance * scale)}" rx="${n(w / 2)}" ry="${n(l)}" fill="${color}"/>`;
      return `<g transform="rotate(${n(angle)} ${n(x)} ${n(y)})">${shape}</g>`;
    };
    let out = '';
    for (let i = 0; i < petals; i++) out += petal(1, (360 * i) / petals, main);
    if (random.chance(0.35)) for (let i = 0; i < petals; i++) out += petal(0.55, (360 * (i + 0.5)) / petals, third);
    out += circle(x, y, u * random.range(8, 12), second);
    return out;
  },

  waves({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const lines = random.int(3, 4);
    const amplitude = u * random.range(3, 6);
    const periods = random.int(2, 3);
    const half = u * random.range(36, 42);
    let out = '';
    for (let i = 0; i < lines; i++) {
      const ly = y + u * ((i - (lines - 1) / 2) * random.range(11, 14));
      const points: Point[] = [];
      for (let k = 0; k <= 16; k++) points.push([x - half + (k * half * 2) / 16, ly + Math.sin((k / 16) * Math.PI * 2 * periods) * amplitude]);
      out += `<path d="${smoothPath(points)}" stroke="${i % 2 === 1 && random.chance(0.5) ? second : main}" stroke-width="${n(u * random.range(5, 7))}" stroke-linecap="round" fill="none"/>`;
    }
    return out;
  },

  flame({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    // A leaning teardrop with smaller teardrop tongues at its sides, like a printed fire icon.
    const base = y + u * 40;
    const height = u * random.range(78, 88);
    const lean = u * random.range(-8, 8);
    const r = u * random.range(22, 26);
    let body = teardrop(x, base - r, r, x + lean, base - height);
    for (const side of [-1, 1]) {
      if (side === 1 && random.chance(0.3)) continue;
      const tongue = r * random.range(0.42, 0.55);
      const tx = x + side * r * random.range(0.55, 0.7);
      body += teardrop(tx, base - tongue - r * 0.15, tongue, tx + side * u * random.range(4, 10), base - height * random.range(0.5, 0.62));
    }
    let out = `<path d="${body}" fill="${main}"/>`;
    if (random.chance(0.8)) {
      const inner = r * random.range(0.45, 0.55);
      out += `<path d="${teardrop(x, base - inner - u * 3, inner, x + lean * 0.5, base - height * random.range(0.45, 0.55))}" fill="${second}"/>`;
    }
    return out;
  },

  cloud({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    // A flat base with three or four bumps, the second the biggest, like a printed weather icon.
    const bottom = y + u * random.range(8, 14);
    const bumps: [number, number][] = [
      [-24, random.range(13, 16)],
      [-3, random.range(20, 24)],
      [19, random.range(14, 18)],
    ];
    if (random.chance(0.4)) bumps.push([33, random.range(9, 11)]);
    const left = x - u * 38;
    const right = x + u * (bumps.length === 4 ? 43 : 35);
    let out = `<rect x="${n(left)}" y="${n(bottom - u * 16)}" width="${n(right - left)}" height="${n(u * 16)}" rx="${n(u * 8)}" fill="${main}"/>`;
    for (const [dx, r] of bumps) out += circle(x + u * dx, bottom - u * Math.max(8, r * 0.95), u * r, main);
    if (random.chance(0.35)) {
      const drops = random.int(3, 5);
      for (let i = 0; i < drops; i++) {
        const dx = x - u * 26 + (u * 52 * i) / (drops - 1);
        const dy = bottom + u * random.range(8, 14);
        out += `<path d="M${n(dx)} ${n(dy)}l${n(-u * 3)} ${n(u * 9)}" stroke="${second}" stroke-width="${n(u * 3)}" stroke-linecap="round"/>`;
      }
    }
    return out;
  },

  heart({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const heart = (w: number, h: number, ox: number, oy: number) => {
      const cx = x + ox;
      const cy = y + oy;
      return `M${n(cx)} ${n(cy + h / 2)}C${n(cx - w * 0.55)} ${n(cy + h * 0.1)} ${n(cx - w * 0.62)} ${n(cy - h * 0.45)} ${n(cx - w * 0.25)} ${n(cy - h * 0.47)}C${n(cx - w * 0.08)} ${n(cy - h * 0.48)} ${n(cx)} ${n(cy - h * 0.32)} ${n(cx)} ${n(cy - h * 0.22)}C${n(cx)} ${n(cy - h * 0.32)} ${n(cx + w * 0.08)} ${n(cy - h * 0.48)} ${n(cx + w * 0.25)} ${n(cy - h * 0.47)}C${n(cx + w * 0.62)} ${n(cy - h * 0.45)} ${n(cx + w * 0.55)} ${n(cy + h * 0.1)} ${n(cx)} ${n(cy + h / 2)}Z`;
    };
    const w = u * random.range(70, 84);
    const h = w * random.range(0.85, 1);
    const tilt = random.range(-12, 12);
    let out = '';
    if (random.chance(0.3)) out += `<path d="${heart(w, h, u * 4, u * 3)}" fill="${second}"/>`;
    out += `<path d="${heart(w, h, 0, 0)}" fill="${main}"/>`;
    return `<g transform="rotate(${n(tilt)} ${n(x)} ${n(y)})">${out}</g>`;
  },

  record({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const radius = u * random.range(38, 44);
    let out = circle(x, y, radius, main);
    const grooves = random.int(3, 5);
    const groove = mix(main, colors.background, 0.35);
    for (let i = 0; i < grooves; i++) {
      out += circle(x, y, radius * (0.45 + (0.5 * (i + 1)) / (grooves + 1)), 'none', `stroke="${groove}" stroke-width="${n(u * 1.2)}" opacity="0.7"`);
    }
    out += circle(x, y, radius * random.range(0.3, 0.4), second);
    out += circle(x, y, u * 3, colors.background);
    return out;
  },

  drop({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const drop = (cx: number, cy: number, r: number) => {
      const h = r * 2.2;
      return `<path d="M${n(cx)} ${n(cy - h)}C${n(cx + r * 0.35)} ${n(cy - h * 0.55)} ${n(cx + r)} ${n(cy - r * 0.6)} ${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx - r)} ${n(cy)}C${n(cx - r)} ${n(cy - r * 0.6)} ${n(cx - r * 0.35)} ${n(cy - h * 0.55)} ${n(cx)} ${n(cy - h)}Z"`;
    };
    const r = u * random.range(18, 23);
    let out = `${drop(x, y + u * 16, r)} fill="${main}"/>`;
    if (random.chance(0.55)) out += `${drop(x + u * 30, y - u * 10, r * 0.45)} fill="${second}"/>`;
    if (random.chance(0.5)) out += `<path d="M${n(x - r * 0.55)} ${n(y + u * 16)}a${n(r * 0.55)} ${n(r * 0.55)} 0 0 0 ${n(r * 0.4)} ${n(r * 0.45)}" stroke="${mix(main, '#ffffff', 0.6)}" stroke-width="${n(u * 2.5)}" stroke-linecap="round" fill="none"/>`;
    return out;
  },

  target({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const rings = random.int(2, 5);
    const outer = u * random.range(38, 45);
    let out = '';
    if (random.chance(0.6)) {
      for (let i = 0; i < rings; i++) out += circle(x, y, outer * (1 - i / rings), i % 2 === 0 ? main : colors.background);
    } else {
      for (let i = 0; i < rings; i++) out += circle(x, y, outer * (1 - i / rings) - u * 2, 'none', `stroke="${main}" stroke-width="${n(u * 4)}"`);
    }
    out += circle(x, y, outer / rings / 2.2, second);
    return out;
  },

  prism({ random, colors, id, defs }, { x, y, u }) {
    const [main] = colors.emblem;
    const side = u * random.range(72, 86);
    const height = (side * Math.sqrt(3)) / 2;
    const top: Point = [x, y - height * 0.6];
    const left: Point = [x - side / 2, y + height * 0.4];
    const right: Point = [x + side / 2, y + height * 0.4];
    // A prism splits light into a rainbow, whatever the palette.
    const rainbow = colors.spectrum.length >= 3 ? colors.spectrum : (paletteById('spectrum').spectrum ?? []);
    const stops = rainbow.map((color, i) => `<stop offset="${n(i / Math.max(1, rainbow.length - 1))}" stop-color="${color}"/>`).join('');
    const angle = random.range(20, 70);
    defs.push(`<linearGradient id="${id}-prism" gradientTransform="rotate(${n(angle)} 0.5 0.5)">${stops}</linearGradient>`);
    // A plain, crisp triangle with a thin outline at most. A light beam used to come in from the left; it read as a tail.
    const outline = random.chance(0.6) ? ` stroke="${main}" stroke-width="${n(u * 1.3)}" stroke-linejoin="round"` : '';
    return `<path d="${polyPath([top, right, left])}" fill="url(#${id}-prism)"${outline}/>`;
  },

  spiral({ random, colors }, { x, y, u }) {
    const [main] = colors.emblem;
    const turns = random.range(2.2, 3.6);
    const outer = u * random.range(38, 44);
    const direction = random.chance(0.5) ? 1 : -1;
    const start = random.range(0, Math.PI * 2);
    const points: Point[] = [];
    const steps = 140;
    for (let i = 4; i <= steps; i++) {
      const t = i / steps;
      const angle = start + direction * t * turns * Math.PI * 2;
      points.push([x + Math.cos(angle) * outer * t, y + Math.sin(angle) * outer * t]);
    }
    return `<path d="${smoothPath(points)}" stroke="${main}" stroke-width="${n(u * random.range(5, 8))}" stroke-linecap="round" fill="none"/>`;
  },

  overlap({ random, colors }, { x, y, u }) {
    const [main, second, third] = colors.emblem;
    const count = random.int(2, 3);
    const radius = u * random.range(22, 27);
    const spread = radius * random.range(0.7, 1);
    // Overlaps darken on light labels and glow on dark ones, like inks printed over each other.
    const blend = isDark(colors.background) ? 'screen' : 'multiply';
    let out = '';
    const fills = [main, second, third];
    for (let i = 0; i < count; i++) {
      const angle = count === 2 ? (i === 0 ? Math.PI : 0) : -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const offset = count === 2 ? spread * 0.6 : spread * 0.62;
      out += circle(x + Math.cos(angle) * offset, y + Math.sin(angle) * offset, radius, fills[i], i > 0 ? `style="mix-blend-mode:${blend}"` : '');
    }
    return out;
  },

  bars({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const count = random.int(5, 9);
    const width = u * random.range(5, 8);
    const gap = (u * 84 - width * count) / (count - 1);
    const centred = random.chance(0.5);
    const alternate = random.chance(0.3);
    let out = '';
    for (let i = 0; i < count; i++) {
      const height = u * random.range(16, 80);
      const bx = x - u * 42 + i * (width + gap);
      const by = centred ? y - height / 2 : y + u * 38 - height;
      out += `<rect x="${n(bx)}" y="${n(by)}" width="${n(width)}" height="${n(height)}" rx="${n(width / 2)}" fill="${alternate && i % 2 ? second : main}"/>`;
    }
    return out;
  },

  echo({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const arcs = random.int(2, 4);
    const spread = random.range(0.55, 0.85);
    const width = u * random.range(4, 6);
    let out = circle(x, y, u * random.range(7, 10), second);
    for (let i = 0; i < arcs; i++) {
      const r = u * (17 + i * random.range(9, 11));
      for (const side of [0, Math.PI]) {
        const a0 = side - spread;
        const a1 = side + spread;
        out += `<path d="M${n(x + Math.cos(a0) * r)} ${n(y + Math.sin(a0) * r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + Math.cos(a1) * r)} ${n(y + Math.sin(a1) * r)}" stroke="${main}" stroke-width="${n(width)}" stroke-linecap="round" fill="none"/>`;
      }
    }
    return out;
  },

  orbit({ random, colors }, { x, y, u }) {
    const [main, second, third] = colors.emblem;
    const ellipses = random.int(1, 2);
    const tilt = random.range(18, 34);
    const rx = u * 44;
    const ry = u * random.range(13, 19);
    let out = '';
    for (let i = 0; i < ellipses; i++) {
      const angle = ellipses === 1 ? random.range(-30, 30) : i === 0 ? tilt : -tilt;
      out += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" transform="rotate(${n(angle)} ${n(x)} ${n(y)})" stroke="${second}" stroke-width="${n(u * random.range(3, 4.5))}" fill="none"/>`;
    }
    out += circle(x, y, u * random.range(10, 16), main);
    if (random.chance(0.5)) {
      const a = random.range(0, Math.PI * 2);
      out += circle(x + Math.cos(a) * rx * 0.97, y + Math.sin(a) * ry * 0.97, u * 4.5, third);
    }
    return out;
  },

  burst({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const points = random.int(8, 14);
    const outer = u * random.range(40, 45);
    let out = `<path d="${starPath(x, y, points, outer, outer * random.range(0.68, 0.8), random.range(0, Math.PI))}" fill="${main}"/>`;
    if (random.chance(0.7)) out += circle(x, y, outer * random.range(0.35, 0.5), second);
    return out;
  },

  diamond({ random, colors }, { x, y, u }) {
    const [main, second] = colors.emblem;
    const half = u * random.range(36, 44);
    const diamond = (h: number) => polyPath([[x, y - h], [x + h * 0.82, y], [x, y + h], [x - h * 0.82, y]]);
    let out = `<path d="${diamond(half)}" fill="${main}"/>`;
    out += random.chance(0.5) ? `<path d="${diamond(half * 0.5)}" fill="${second}"/>` : `<path d="${diamond(half * 0.62)}" stroke="${second}" stroke-width="${n(u * 3)}" fill="none"/>`;
    return out;
  },

  dots({ random, colors }, { x, y, u }) {
    const [main] = colors.emblem;
    const grid = random.int(4, 5);
    const step = (u * 80) / (grid - 1);
    const fade = random.range(0, Math.PI * 2);
    let out = '';
    for (let i = 0; i < grid; i++) {
      for (let j = 0; j < grid; j++) {
        const dx = -u * 40 + i * step;
        const dy = -u * 40 + j * step;
        if (Math.hypot(dx, dy) > u * 46) continue;
        // Halftone: dots shrink toward one side.
        const along = (Math.cos(fade) * dx + Math.sin(fade) * dy) / (u * 40);
        out += circle(x + dx, y + dy, step * (0.18 + 0.2 * (1 - along) / 2 + 0.1), main);
      }
    }
    return out;
  },
};

/** A teardrop: a round bottom of radius `r` centred at (bx, by), drawn up to a point at (tx, ty). */
function teardrop(bx: number, by: number, r: number, tx: number, ty: number): string {
  const pull = (edge: number) => `${n(tx + (edge - tx) * 0.2)} ${n(ty + (by - ty) * 0.45)}`;
  return (
    `M${n(tx)} ${n(ty)}C${pull(bx + r)} ${n(bx + r)} ${n(by - r * 0.9)} ${n(bx + r)} ${n(by)}` +
    `A${n(r)} ${n(r)} 0 0 1 ${n(bx - r)} ${n(by)}` +
    `C${n(bx - r)} ${n(by - r * 0.9)} ${pull(bx - r)} ${n(tx)} ${n(ty)}Z`
  );
}
