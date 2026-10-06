import { contrast, mix } from './color';
import { LABEL, SCENE_FRONT_MAX_Y, type DrawContext, type SceneKind } from './parts';
import { n, polyPath, smoothPath, type Point } from './svg';

const { cx, cy, r: R } = LABEL;
const BOTTOM = 1010;

/**
 * How high a scene may reach at `x`: below "Side A" on the right, below "STEREO" elsewhere.
 * Scenes may pass behind the emblem, as a cactus stands on the dunes.
 */
export function ceiling(x: number): number {
  const sideA = Math.abs(x - (cx + R * 0.69)) < 100;
  return sideA ? cy + 42 : cy - R * 0.1;
}

/**
 * Layered silhouettes across the bottom of the label, back to front. Every front layer's top edge
 * stays above SCENE_FRONT_MAX_Y, so the title below it sits on one colour.
 */
export function drawScene(kind: SceneKind, ctx: DrawContext): string {
  const layers = ctx.colors.scene;
  if (kind === 'none' || layers.length === 0) return '';
  let out = '';
  layers.forEach((color, index) => {
    const front = index === layers.length - 1;
    // Back layers reach higher; the front one sits just above the title.
    const depth = layers.length === 1 ? 1 : index / (layers.length - 1);
    const top = front ? SCENE_FRONT_MAX_Y - ctx.random.range(25, 60) : cy + R * (0.08 + depth * 0.16) + ctx.random.range(-15, 15);
    const lowest = front ? SCENE_FRONT_MAX_Y : top + 80;
    out += layer(kind, ctx, color, top, lowest, front);
  });
  return out;
}

function layer(kind: Exclude<SceneKind, 'none'>, ctx: DrawContext, color: string, top: number, lowest: number, front: boolean): string {
  const { random } = ctx;
  // A cover has no "Side A" to keep clear, but keeps the big emblem mostly in view.
  const limit = ctx.layout === 'cover' ? () => cy + 60 : ceiling;
  // Keeps an edge point between the ceiling (out of the printing) and the lowest it may go.
  const fit = (x: number, y: number) => Math.min(lowest, Math.max(limit(x), y));
  switch (kind) {
    case 'waves': {
      const amplitude = random.range(10, 26);
      const frequency = random.range(1.5, 3.2);
      const phase = random.range(0, Math.PI * 2);
      const points: Point[] = [];
      for (let x = -20; x <= 1020; x += 20) {
        const t = (x / 1000) * Math.PI * 2;
        points.push([x, fit(x, top + amplitude + Math.sin(t * frequency + phase) * amplitude + Math.sin(t * frequency * 2.3 + phase) * amplitude * 0.25)]);
      }
      return fillUnder(points, color);
    }
    case 'dunes': {
      const points: Point[] = [];
      const count = random.int(3, 5);
      for (let i = 0; i <= count; i++) {
        const x = -40 + (i * 1080) / count;
        points.push([x, fit(x, top + random.range(0, 70))]);
      }
      return fillUnder(points, color, true);
    }
    case 'hills': {
      const bumps = Array.from({ length: random.int(2, 4) }, () => ({ x: random.range(0, 1000), w: random.range(140, 320), h: random.range(30, 90) }));
      const points: Point[] = [];
      for (let x = -20; x <= 1020; x += 20) {
        const lift = bumps.reduce((sum, bump) => sum + bump.h * Math.exp(-(((x - bump.x) / bump.w) ** 2)), 0);
        points.push([x, fit(x, top + 70 - lift)]);
      }
      return fillUnder(points, color);
    }
    case 'mountains': {
      const points: Point[] = [[-20, fit(-20, top + random.range(40, 90))]];
      let x = -20;
      while (x < 1020) {
        const peakX = x + random.range(70, 170);
        const peakY = fit(peakX, top - random.range(front ? 10 : 40, front ? 60 : 160));
        const valleyX = peakX + random.range(70, 170);
        points.push([peakX, peakY], [valleyX, fit(valleyX, top + random.range(20, 80))]);
        x = valleyX;
      }
      let out = `<path d="${polyPath([...points, [1020, BOTTOM], [-20, BOTTOM]])}" fill="${color}"/>`;
      // Snow only where the range stands out from the background; on a faint range the caps seem to float.
      if (!front && random.chance(0.6) && contrast(color, ctx.colors.background) >= 1.5 && points.some(([, y]) => y < top - 30)) {
        // Snow on the back range's peaks, cut off by a jagged line part way down.
        const snow = mix(color, '#ffffff', 0.75);
        for (let i = 1; i < points.length - 1; i += 2) {
          const [px, py] = points[i];
          const [lx, ly] = points[i - 1];
          const [rx, ry] = points[i + 1];
          const t = random.range(0.22, 0.32);
          const left: Point = [px + (lx - px) * t, py + (ly - py) * t];
          const right: Point = [px + (rx - px) * t, py + (ry - py) * t];
          const notch: Point = [px + random.range(-8, 8), py + (Math.max(ly, ry) - py) * t * 0.7];
          out += `<path d="${polyPath([[px, py], right, notch, left])}" fill="${snow}"/>`;
        }
      }
      return out;
    }
    case 'skyline': {
      // A solid base reaches SCENE_FRONT_MAX_Y; buildings rise from it.
      const base = front ? lowest : top + 60;
      let out = `<rect x="-20" y="${n(base)}" width="1040" height="${n(BOTTOM - base)}" fill="${color}"/>`;
      let x = -20;
      const window = mix(color, ctx.colors.background, 0.55);
      while (x < 1020) {
        const width = random.range(34, 86);
        const height = Math.min(random.range(front ? 30 : 60, front ? 120 : 210), base - Math.max(limit(x), limit(x + width)));
        out += `<rect x="${n(x)}" y="${n(base - height)}" width="${n(width + 1)}" height="${n(height + 1)}" fill="${color}"/>`;
        if (random.chance(0.18)) out += `<rect x="${n(x + width / 2 - 2)}" y="${n(base - height - 26)}" width="4" height="26" fill="${color}"/>`;
        if (!front && random.chance(0.6)) {
          for (let wy = base - height + 14; wy < base - 12; wy += 22) {
            for (let wx = x + 9; wx < x + width - 12; wx += 16) {
              if (random.chance(0.45)) out += `<rect x="${n(wx)}" y="${n(wy)}" width="6" height="9" fill="${window}"/>`;
            }
          }
        }
        x += width + random.range(-6, 10);
      }
      return out;
    }
    case 'beach': {
      if (!front) return layer('waves', ctx, color, top, lowest, false);
      const points: Point[] = [];
      const lift = random.range(20, 60);
      const tilt = random.chance(0.5) ? 1 : -1;
      for (let x = -20; x <= 1020; x += 40) points.push([x, fit(x, top + 40 - lift * Math.sin((x / 1000) * Math.PI) * 0.8 + tilt * (x - 500) * 0.04)]);
      return fillUnder(points, color, true);
    }
  }
}

function fillUnder(points: Point[], color: string, smooth = false): string {
  const first = points[0];
  const last = points[points.length - 1];
  const edge = smooth ? smoothPath(points).slice(1) : polyPath(points, false).slice(1);
  return `<path d="M${edge}L${n(last[0])} ${BOTTOM}L${n(first[0])} ${BOTTOM}Z" fill="${color}"/>`;
}
