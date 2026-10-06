import { LABEL } from './parts';
import type { Random } from './random';
import { circle, n } from './svg';

const { cx, cy, r: R, hole } = LABEL;

/**
 * The print and wear that make a flat drawing look like an old paper label: grain and blotchy ink
 * (multiplied over everything, text included), a worn, uneven edge, pressing rings, and scuffs.
 * `strength` runs from 0 (clean) to 1 (well played).
 */
export function textureDefs(id: string, random: Random, strength: number): string {
  const fine = 0.32 * strength;
  const coarse = 0.2 * strength;
  const shade = (k: number, mid: number) =>
    ['R', 'G', 'B'].map((c) => `<feFunc${c} type="linear" slope="${n2(k)}" intercept="${n2(1 - k * mid)}"/>`).join('') + '<feFuncA type="linear" slope="0" intercept="1"/>';
  const print =
    `<filter id="${id}-print" filterUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${random.int(1, 9999)}" result="fine"/>` +
    `<feColorMatrix in="fine" type="saturate" values="0" result="fineGrey"/>` +
    `<feComponentTransfer in="fineGrey" result="fineShade">${shade(fine, 0.55)}</feComponentTransfer>` +
    `<feTurbulence type="fractalNoise" baseFrequency="${n2(random.range(0.008, 0.016))}" numOctaves="3" seed="${random.int(1, 9999)}" result="coarse"/>` +
    `<feColorMatrix in="coarse" type="saturate" values="0" result="coarseGrey"/>` +
    `<feComponentTransfer in="coarseGrey" result="coarseShade">${shade(coarse, 0.5)}</feComponentTransfer>` +
    `<feBlend in="fineShade" in2="coarseShade" mode="multiply" result="shade"/>` +
    `<feBlend in="SourceGraphic" in2="shade" mode="multiply" result="printed"/>` +
    `<feComposite in="printed" in2="SourceGraphic" operator="in"/>` +
    `</filter>`;
  const rough =
    `<filter id="${id}-rough" filterUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${random.int(1, 9999)}" result="noise"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${n(3 + 9 * strength)}" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>`;
  const vignette =
    `<radialGradient id="${id}-vignette" cx="0.5" cy="0.5" r="0.5">` +
    `<stop offset="${n2(hole / 500)}" stop-color="#000" stop-opacity="${n2(0.28 * strength)}"/>` +
    `<stop offset="${n2((hole + 50) / 500)}" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="${n2((R * 0.8) / 500)}" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="${n2(R / 500)}" stop-color="#000" stop-opacity="${n2(0.34 * strength)}"/>` +
    `</radialGradient>`;
  return print + rough + vignette;
}

/** The label's round shape with its hole, its edges roughened. */
export function labelMask(id: string, strength: number): string {
  const filter = strength > 0 ? ` filter="url(#${id}-rough)"` : '';
  return `<mask id="${id}-label" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000"><g${filter}>${circle(cx, cy, R, '#fff')}${circle(cx, cy, hole, '#000')}</g></mask>`;
}

/** Rim and hole edges, pressing rings, scuffs and specks, drawn over the label. */
export function drawWear(id: string, random: Random, strength: number): string {
  let out = `<rect width="1000" height="1000" fill="url(#${id}-vignette)"/>`;
  out += circle(cx, cy, R - 3, 'none', `stroke="#000" stroke-opacity="${n2(0.18 + 0.25 * strength)}" stroke-width="6"`);
  out += circle(cx, cy, hole + 2, 'none', `stroke="#000" stroke-opacity="${n2(0.3 + 0.3 * strength)}" stroke-width="5"`);
  const pressings = random.int(1, 3);
  for (let i = 0; i < pressings; i++) {
    const r = hole + 14 + i * random.range(12, 18);
    out += circle(cx, cy, r, 'none', `stroke="#000" stroke-opacity="${n2(random.range(0.05, 0.12))}" stroke-width="2"`);
    out += circle(cx, cy, r + 2, 'none', `stroke="#fff" stroke-opacity="${n2(random.range(0.03, 0.07))}" stroke-width="1.5"`);
  }
  const scuffs = Math.round(random.int(2, 7) * strength);
  for (let i = 0; i < scuffs; i++) {
    const r = random.range(hole + 30, R - 18);
    const a0 = random.range(0, Math.PI * 2);
    const a1 = a0 + random.range(0.15, 0.9);
    out += `<path d="M${n(cx + Math.cos(a0) * r)} ${n(cy + Math.sin(a0) * r)}A${n(r)} ${n(r)} 0 0 1 ${n(cx + Math.cos(a1) * r)} ${n(cy + Math.sin(a1) * r)}" stroke="#fff" stroke-opacity="${n2(random.range(0.06, 0.16))}" stroke-width="${n(random.range(1, 2.5))}" fill="none"/>`;
  }
  const specks = Math.round(random.int(20, 50) * strength);
  for (let i = 0; i < specks; i++) {
    const a = random.range(0, Math.PI * 2);
    const r = random.range(hole + 8, R - 6);
    out += circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, random.range(0.6, 1.8), random.chance(0.6) ? '#fff' : '#000', `opacity="${n2(random.range(0.08, 0.3))}"`);
  }
  return out;
}

/** A sleeve's ageing: darker corners, and a soft blur for its rubbed marks. */
export function coverDefs(id: string, strength: number): string {
  return (
    `<radialGradient id="${id}-corners" cx="0.5" cy="0.5" r="0.72">` +
    `<stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${n2(0.4 * strength)}"/></radialGradient>` +
    `<filter id="${id}-rub" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>`
  );
}

/** Which of a sleeve's worn marks to draw: the dashed ring wear, and the dashed rubbed edges with their corners. */
export interface CoverWear {
  readonly ring: boolean;
  readonly edges: boolean;
}

/**
 * An old sleeve: darker corners, rubbed edges, and ring wear, the faint circle a record inside
 * leaves where it rubs the sleeve, plus scuffs and specks.
 */
export function drawCoverWear(id: string, random: Random, strength: number, marks: CoverWear = { ring: true, edges: true }): string {
  let out = `<rect width="1000" height="1000" fill="url(#${id}-corners)"/>`;
  const dashes = (min: number, max: number, gapMin: number, gapMax: number) =>
    Array.from({ length: 8 }, (_, i) => n(i % 2 === 0 ? random.range(min, max) : random.range(gapMin, gapMax))).join(' ');
  // Each mark is worked out even when it's turned off, so the scuffs and specks after it stay where they were.
  const ring = circle(cx, cy, random.range(400, 445), 'none', `stroke="#fff" stroke-opacity="${n2(0.05 + 0.08 * strength)}" stroke-width="${n(random.range(10, 18))}" stroke-dasharray="${dashes(80, 320, 20, 140)}" filter="url(#${id}-rub)"`);
  let edges = `<rect x="5" y="5" width="990" height="990" fill="none" stroke="#fff" stroke-opacity="${n2(0.06 + 0.12 * strength)}" stroke-width="10" stroke-dasharray="${dashes(60, 260, 30, 200)}" filter="url(#${id}-rub)"/>`;
  for (const [x, y] of [[0, 0], [1000, 0], [0, 1000], [1000, 1000]]) {
    edges += circle(x, y, random.range(18, 40), '#fff', `fill-opacity="${n2(0.04 + 0.08 * strength)}" filter="url(#${id}-rub)"`);
  }
  if (marks.ring) out += ring;
  if (marks.edges) out += edges;
  const scuffs = Math.round(random.int(2, 6) * strength);
  for (let i = 0; i < scuffs; i++) {
    const x = random.range(60, 940);
    const y = random.range(60, 940);
    const length = random.range(30, 140);
    const angle = random.range(0, Math.PI);
    out += `<path d="M${n(x)} ${n(y)}l${n(Math.cos(angle) * length)} ${n(Math.sin(angle) * length)}" stroke="#fff" stroke-opacity="${n2(random.range(0.06, 0.15))}" stroke-width="${n(random.range(1, 2.5))}"/>`;
  }
  const specks = Math.round(random.int(30, 70) * strength);
  for (let i = 0; i < specks; i++) {
    out += circle(random.range(0, 1000), random.range(0, 1000), random.range(0.6, 1.8), random.chance(0.6) ? '#fff' : '#000', `opacity="${n2(random.range(0.08, 0.3))}"`);
  }
  return out;
}

/** Two decimals, for filter values and opacities. */
function n2(value: number): string {
  return String(Math.round(value * 100) / 100);
}
