// MathUtil.ts  –  shared math helpers

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return math.max(min, math.min(max, value));
}

/** Snap a world-space coordinate to the nearest grid point */
export function snapToGrid(coord: number, tileSize: number): number {
  return math.round(coord / tileSize) * tileSize;
}

/** Format seconds as mm:ss */
export function formatTime(seconds: number): string {
  const totalSec = math.floor(seconds);
  const mins = math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${string.format("%02d", mins)}:${string.format("%02d", secs)}`;
}

/** Logarithmic RPS growth curve (mirrors calculateTargetRPS) */
export function calculateTargetRPS(
  gameTimeSeconds: number,
  baseRPS: number,
): number {
  const logGrowth = math.log(1 + gameTimeSeconds / 20) * 2.2;
  const linearBoost = gameTimeSeconds * 0.008;
  return baseRPS + logGrowth + linearBoost;
}

/** Calculate fail chance based on service load */
export function calculateFailChanceBasedOnLoad(load: number): number {
  if (load < 0.7) return 0;
  if (load < 0.9) return (load - 0.7) * 0.5;
  return 0.5 + (load - 0.9) * 2;
}

/** Generate a short random id (mirrors JS implementation) */
export function randomId(prefix: string): string {
  return `${prefix}_${math.floor(math.random() * 1e9).toString(36)}`;
}
