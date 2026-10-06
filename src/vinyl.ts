import { LABEL } from './parts';
import type { Random } from './random';
import { n, ringPath } from './svg';

const { cx, cy, hole } = LABEL;

/** The spindle hole, about 7 mm on a 7-inch single, whose 38 mm centre hole the label's hole stands for. */
export const SPINDLE = hole * 0.19;

export interface VinylShape {
  /** The record's outer radius. */
  readonly outer: number;
  /** Where the label's centre hole edge sits. */
  readonly holeEdge: number;
  /**
   * Set to fill the centre with vinyl down to a spindle hole of this radius. Left out, the centre is
   * open, as on a real single: the big hole goes through record and label alike.
   */
  readonly spindle?: number;
  /** Where the label's outer edge sits, if the record shows outside the label. */
  readonly labelEdge?: number;
  /** Dust and scuffs, 0 (new) to 1 (well played). */
  readonly wear: number;
}

/** Circles as one path, so a hundred grooves are one element. */
function circles(radii: readonly number[]): string {
  return radii.map((r) => `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0`).join('');
}

/** A ring sector from `inner` to `outer`, `half` radians either side of `angle`. */
function sector(angle: number, half: number, inner: number, outer: number): string {
  const at = (r: number, a: number) => `${n(cx + Math.cos(a) * r)} ${n(cy + Math.sin(a) * r)}`;
  return `M${at(inner, angle - half)}L${at(outer, angle - half)}A${n(outer)} ${n(outer)} 0 0 1 ${at(outer, angle + half)}L${at(inner, angle + half)}A${n(inner)} ${n(inner)} 0 0 0 ${at(inner, angle - half)}Z`;
}

/**
 * Black vinyl: fine grooves, a soft bow-tie reflection, the label's shadow along its edges, a raised
 * rim, and the dust and scuffs of an old record. It's drawn under the label and kept out of the paper
 * texture, so it reads as glossy plastic next to printed paper.
 */
export function drawVinyl(id: string, random: Random, defs: string[], shape: VinylShape): string {
  const { outer, spindle, holeEdge, labelEdge, wear } = shape;
  // An open centre stops a little outside the label's hole, so the label's worn edge never shows a sliver of vinyl.
  const inner = spindle ?? holeEdge + 3;
  const runout = spindle ? spindle + 30 : inner;
  // Gradient offsets need finer steps than coordinates: 0.1 would merge the shadow's stops.
  const at = (r: number) => String(Math.round(Math.min(1, Math.max(0, r / outer)) * 1000) / 1000);
  const shadeStops =
    (spindle ? `<stop offset="${at(holeEdge - 30)}" stop-color="#000" stop-opacity="0"/><stop offset="${at(holeEdge)}" stop-color="#000" stop-opacity="0.6"/>` : '') +
    (labelEdge
      ? `<stop offset="${at(labelEdge)}" stop-color="#000" stop-opacity="0.55"/><stop offset="${at(labelEdge + Math.min(26, (outer - labelEdge) * 0.6))}" stop-color="#000" stop-opacity="0"/>`
      : `<stop offset="1" stop-color="#000" stop-opacity="0.6"/>`);
  defs.push(
    `<filter id="${id}-gloss" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${n(outer > 300 ? 12 : 7)}"/></filter>`,
    `<radialGradient id="${id}-shade" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${n(outer)}">${shadeStops}</radialGradient>`,
  );

  const light: number[] = [];
  const dark: number[] = [];
  const rim = labelEdge ? outer - 16 : outer;
  // On a real single the grooves stop short of the label, leaving a smooth, shinier band around it.
  const smooth = labelEdge ? [labelEdge - 4, labelEdge + 22] : null;
  for (let r = runout + (spindle ? 6 : 2), i = 0; r < rim; r += 3.4, i++) {
    if (smooth && r > smooth[0] && r < smooth[1]) continue;
    (i % 2 === 0 ? light : dark).push(r);
  }

  const angle = random.range(0, Math.PI);
  const sheen = [0, Math.PI].map((turn) => sector(angle + turn, random.range(0.18, 0.26), inner + 8, outer - 2)).join('');
  const glint = [0, Math.PI].map((turn) => sector(angle + turn + Math.PI / 2, 0.08, runout + 4, outer - 2)).join('');
  const ring = ringPath(cx, cy, outer, inner);

  let out =
    `<g data-part="vinyl" data-centre="${spindle ? 'vinyl' : 'open'}">` +
    `<path d="${ring}" fill="#0e0d10" fill-rule="evenodd"/>` +
    `<path d="${circles(light)}" fill="none" stroke="#1d1b21" stroke-width="1.3"/>` +
    `<path d="${circles(dark)}" fill="none" stroke="#060507" stroke-width="1.1"/>`;
  // The smooth run-out near the spindle, with its pressing ring.
  if (spindle) out += `<path d="${circles([runout])}" fill="none" stroke="#2a282f" stroke-width="2.2"/>`;
  if (smooth) {
    out += `<path d="${circles([(smooth[0] + smooth[1]) / 2])}" fill="none" stroke="#17161a" stroke-width="${n(smooth[1] - smooth[0])}"/>`;
    out += `<path d="${circles([smooth[1], rim])}" fill="none" stroke="#28262c" stroke-width="1.6"/>`;
  }
  if (labelEdge) {
    // The smooth, slightly raised rim of the record.
    out += `<path d="${circles([outer - 6])}" fill="none" stroke="#1a191e" stroke-width="10"/><path d="${circles([outer - 1.5])}" fill="none" stroke="#2c2a31" stroke-width="2.5"/>`;
  }
  out +=
    `<path d="${sheen}" fill="#fff" fill-opacity="${labelEdge ? 0.065 : 0.1}" filter="url(#${id}-gloss)"/>` +
    `<path d="${glint}" fill="#fff" fill-opacity="${labelEdge ? 0.03 : 0.04}" filter="url(#${id}-gloss)"/>` +
    `<path d="${ring}" fill="url(#${id}-shade)" fill-rule="evenodd"/>`;
  // The spindle hole's moulded edge.
  if (spindle) out += `<path d="${circles([spindle + 1.5])}" fill="none" stroke="#2c2a31" stroke-width="3"/>`;

  // An old record: fine scuffs along the grooves, and dust.
  const scuffs = Math.round(random.int(3, 9) * wear * (labelEdge ? 1.6 : 0.6));
  for (let i = 0; i < scuffs; i++) {
    const r = random.range(runout + 10, rim - 4);
    const a0 = random.range(0, Math.PI * 2);
    const a1 = a0 + random.range(0.1, 0.7);
    out += `<path d="M${n(cx + Math.cos(a0) * r)} ${n(cy + Math.sin(a0) * r)}A${n(r)} ${n(r)} 0 0 1 ${n(cx + Math.cos(a1) * r)} ${n(cy + Math.sin(a1) * r)}" stroke="#fff" stroke-opacity="${op(random.range(0.05, 0.14))}" stroke-width="${n(random.range(0.8, 1.8))}" fill="none"/>`;
  }
  const dust = Math.round(random.int(10, 30) * wear * (labelEdge ? 2 : 0.6));
  for (let i = 0; i < dust; i++) {
    const a = random.range(0, Math.PI * 2);
    const r = random.range(inner + 6, outer - 4);
    out += `<circle cx="${n(cx + Math.cos(a) * r)}" cy="${n(cy + Math.sin(a) * r)}" r="${n(random.range(0.6, 1.8))}" fill="#fff" fill-opacity="${op(random.range(0.08, 0.3))}"/>`;
  }
  return out + `</g>`;
}

/** Two decimals, for opacities. */
function op(value: number): string {
  return String(Math.round(value * 100) / 100);
}
