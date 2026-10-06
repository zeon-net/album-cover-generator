/** A coordinate rounded to 0.1, so the SVG stays short and the same input always prints the same text. */
export function n(value: number): string {
  if (!Number.isFinite(value)) throw new Error(`Not a finite coordinate: ${value}`);
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

export function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export type Point = readonly [number, number];

/** A straight-edged path through the points. */
export function polyPath(points: readonly Point[], close = true): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${n(x)} ${n(y)}`).join('') + (close ? 'Z' : '');
}

/** A smooth path through the points (Catmull-Rom turned into cubic curves). */
export function smoothPath(points: readonly Point[]): string {
  if (points.length < 3) return polyPath(points, false);
  let d = `M${n(points[0][0])} ${n(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
}

/** A regular star: `points` tips at `outer`, valleys at `inner`, the first tip straight up unless rotated. */
export function starPath(cx: number, cy: number, points: number, outer: number, inner: number, rotation = 0): string {
  const corners: Point[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = rotation - Math.PI / 2 + (i * Math.PI) / points;
    corners.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return polyPath(corners);
}

export function circle(cx: number, cy: number, r: number, fill: string, extra = ''): string {
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
}

/** A ring as one path (outer circle minus inner circle), drawn with the even-odd rule. */
export function ringPath(cx: number, cy: number, outer: number, inner: number): string {
  const arc = (r: number) =>
    `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0Z`;
  return arc(outer) + arc(inner);
}
