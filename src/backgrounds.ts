import { mix } from './color';
import { LABEL, type BackgroundKind, type DrawContext } from './parts';
import { circle, n, ringPath, starPath } from './svg';

const { cx, cy, r: R, hole } = LABEL;

/** The label's base: a full square in the background colour, plus the pattern. The label mask cuts it round. */
export function drawBackground(kind: BackgroundKind, ctx: DrawContext): string {
  const base = `<rect width="1000" height="1000" fill="${ctx.colors.background}"/>`;
  switch (kind) {
    case 'flat':
      return base;
    case 'rings':
      return base + rings(ctx);
    case 'sunburst':
      return base + sunburst(ctx);
    case 'gradient':
      return gradient(ctx);
    case 'split':
      return base + split(ctx);
    case 'stripes':
      return base + stripes(ctx);
    case 'starfield':
      return base + starfield(ctx);
    case 'spectrum':
      return spectrum(ctx);
  }
}

/**
 * One or two soft bands close around the hole. They end
 * before "STEREO", "Side A" and the logo, so the printing never sits on a ring.
 */
function rings(ctx: DrawContext): string {
  const { random, colors, id } = ctx;
  ctx.defs.push(`<filter id="${id}-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${n(random.range(3, 9))}"/></filter>`);
  const limit = hole + 140;
  let out = '';
  let inner = hole + random.range(6, 30);
  const count = random.int(1, 2);
  for (let i = 0; i < count && inner < limit - 30; i++) {
    const width = Math.min(limit - inner, random.range(40, 100));
    const color = colors.backgroundAlt[i % colors.backgroundAlt.length];
    out += `<path d="${ringPath(cx, cy, inner + width, inner)}" fill="${color}" fill-rule="evenodd" filter="url(#${id}-soft)"/>`;
    inner += width + random.range(15, 35);
  }
  if (random.chance(0.35)) {
    const color = colors.backgroundAlt[colors.backgroundAlt.length - 1];
    out += `<path d="${ringPath(cx, cy, R + 10, R * random.range(0.92, 0.95))}" fill="${color}" fill-rule="evenodd" opacity="0.7"/>`;
  }
  return out;
}

/** Rays from the centre, alternating with a near shade of the background. */
function sunburst(ctx: DrawContext): string {
  const { random, colors } = ctx;
  const rays = random.int(9, 18) * 2;
  const color = mix(colors.background, colors.backgroundAlt[0], random.range(0.25, 0.45));
  const twist = random.range(0, Math.PI);
  let d = '';
  for (let i = 0; i < rays; i += 2) {
    const a0 = twist + (i * 2 * Math.PI) / rays;
    const a1 = twist + ((i + 1) * 2 * Math.PI) / rays;
    d += `M${cx} ${cy}L${n(cx + Math.cos(a0) * 760)} ${n(cy + Math.sin(a0) * 760)}L${n(cx + Math.cos(a1) * 760)} ${n(cy + Math.sin(a1) * 760)}Z`;
  }
  return `<path d="${d}" fill="${color}"/>`;
}

/** The background fading into a second colour toward the bottom (or from the centre out). */
function gradient(ctx: DrawContext): string {
  const { random, colors, id } = ctx;
  const to = colors.backgroundAlt[0];
  if (random.chance(0.7)) {
    const start = random.range(0.15, 0.4);
    ctx.defs.push(`<linearGradient id="${id}-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="${n(start)}" stop-color="${colors.background}"/><stop offset="1" stop-color="${to}"/></linearGradient>`);
  } else {
    ctx.defs.push(`<radialGradient id="${id}-grad" cx="0.5" cy="0.5" r="0.5"><stop offset="0.42" stop-color="${colors.background}"/><stop offset="1" stop-color="${to}"/></radialGradient>`);
  }
  return `<rect width="1000" height="1000" fill="url(#${id}-grad)"/>`;
}

/** A large curved swoosh over one side. */
function split(ctx: DrawContext): string {
  const { random, colors } = ctx;
  const angle = random.pick([-0.25, 0.25, 0.75, 1.25]) * Math.PI + random.range(-0.3, 0.3);
  const distance = R * random.range(1.05, 1.35);
  const radius = R * random.range(0.62, 0.9);
  const x = cx + Math.cos(angle) * distance;
  const y = cy + Math.sin(angle) * distance;
  let out = circle(x, y, radius, colors.backgroundAlt[0]);
  if (random.chance(0.5)) {
    const band = R * random.range(0.05, 0.1);
    out += `<path d="${ringPath(x, y, radius + band * 2.4, radius + band * 1.4)}" fill="${colors.backgroundAlt[colors.backgroundAlt.length - 1]}" fill-rule="evenodd"/>`;
  }
  return out;
}

/** A 70s band of stripes running in from the left edge to the hole. */
function stripes(ctx: DrawContext): string {
  const { random, colors } = ctx;
  const count = Math.min(colors.stripes.length, random.int(3, 5));
  const height = R * random.range(0.065, 0.09);
  const gap = height * random.range(0.15, 0.35);
  const top = cy - R * 0.1 - ((count * (height + gap)) / 2) * random.range(0.6, 1);
  let out = '';
  for (let i = 0; i < count; i++) {
    // On a label they run in to the hole; on a cover, right across.
    const width = ctx.layout === 'cover' ? 1040 : cx + 20;
    out += `<rect x="-20" y="${n(top + i * (height + gap))}" width="${n(width)}" height="${n(height)}" fill="${colors.stripes[i]}"/>`;
  }
  return out;
}

/** Specks of light and a few four-point sparkles, for dark labels. */
function starfield(ctx: DrawContext): string {
  const { random, colors } = ctx;
  let out = '';
  const dots = random.int(70, 140);
  for (let i = 0; i < dots; i++) {
    const angle = random.range(0, Math.PI * 2);
    const radius = Math.sqrt(random.range((hole / R) ** 2, 1)) * R;
    const [x, y] = ctx.layout === 'cover' ? [random.range(0, 1000), random.range(0, 1000)] : [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
    out += circle(x, y, random.range(0.8, 2.8), random.pick(colors.sparkle), `opacity="${n(random.range(0.3, 1))}"`);
  }
  const sparkles = random.int(2, 5);
  for (let i = 0; i < sparkles; i++) {
    const angle = random.range(0, Math.PI * 2);
    const radius = random.range(hole + 40, R - 40);
    const size = random.range(9, 22);
    out += `<path d="${starPath(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 4, size, size * 0.22)}" fill="${random.pick(colors.sparkle)}"/>`;
  }
  return out;
}

/** A rainbow sweeping around the label: wedges in hue order, blurred into one smooth sweep. */
function spectrum(ctx: DrawContext): string {
  const { random, colors, id } = ctx;
  const stops = colors.spectrum;
  const wedges = 72;
  const twist = random.range(0, Math.PI * 2);
  ctx.defs.push(`<filter id="${id}-sweep" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${n(random.range(18, 30))}"/></filter>`);
  let out = '';
  for (let i = 0; i < wedges; i++) {
    const position = (i / wedges) * stops.length;
    const from = stops[Math.floor(position) % stops.length];
    const to = stops[(Math.floor(position) + 1) % stops.length];
    const color = mix(from, to, position - Math.floor(position));
    const a0 = twist + (i * 2 * Math.PI) / wedges;
    const a1 = twist + ((i + 1.15) * 2 * Math.PI) / wedges;
    out += `<path d="M${cx} ${cy}L${n(cx + Math.cos(a0) * 760)} ${n(cy + Math.sin(a0) * 760)}L${n(cx + Math.cos(a1) * 760)} ${n(cy + Math.sin(a1) * 760)}Z" fill="${color}"/>`;
  }
  return `<rect width="1000" height="1000" fill="${colors.background}"/><g filter="url(#${id}-sweep)">${out}</g>`;
}
