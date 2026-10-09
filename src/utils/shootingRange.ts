import type { Camera, Inventory, Lens, LoadoutSelection } from "../types";
import { cameraAcceptsLens } from "./loadout";

export const shootingRangeLabels = {
  wide: "WIDE ANGLE",
  closeUp: "CLOSE-UP",
  standard: "STANDARD RANGE",
  telephoto: "TELEPHOTO RANGE",
} as const;
export type RangeScores = Record<keyof typeof shootingRangeLabels, number>;
export type ShootingRange = {
  status: "ready" | "incomplete" | "incompatible" | "unknown";
  ratings: RangeScores;
  equivalent?: { min: number; max: number };
};
const emptyScores = (): RangeScores => ({
  wide: 0,
  closeUp: 0,
  standard: 0,
  telephoto: 0,
});

// Reference coverage curves, not manufacturer measurements or image quality scores.
// A zoom gets the best value available anywhere within its continuous range.
const curves: Record<
  Exclude<keyof RangeScores, "closeUp">,
  readonly (readonly [number, number])[]
> = {
  wide: [
    [1, 10],
    [28, 10],
    [50, 4],
    [85, 0],
  ],
  standard: [
    [1, 0],
    [20, 0],
    [35, 8],
    [50, 10],
    [70, 8],
    [135, 0],
  ],
  telephoto: [
    [1, 0],
    [50, 0],
    [85, 3],
    [135, 7],
    [200, 10],
  ],
};

function cropFactor(camera: Camera): number | undefined {
  const sensor = camera.specs.sensor.normalize("NFKC").toLowerCase();
  if (/full[\s-]*frame|フルサイズ|35\s*mm/.test(sensor)) return 1;
  if (/aps[\s-]*c/.test(sensor)) return /canon/i.test(camera.maker) ? 1.6 : 1.5;
  if (/micro\s*four\s*thirds|mft|マイクロフォーサーズ|4\s*\/\s*3/.test(sensor))
    return 2;
  if (/\b1[\s-]*inch\b|(?:^|\s)1型/.test(sensor)) return 2.7;
  return undefined;
}

function focalRange(value: string): { min: number; max: number } | undefined {
  const match = value
    .normalize("NFKC")
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(?:[-–—~〜]\s*(\d+(?:\.\d+)?))?\s*mm$/i);
  if (!match) return undefined;
  const min = Number(match[1]);
  const max = Number(match[2] ?? match[1]);
  return min > 0 && max >= min ? { min, max } : undefined;
}

function at(
  focal: number,
  curve: readonly (readonly [number, number])[],
): number {
  if (focal <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [end, to] = curve[i];
    const [start, from] = curve[i - 1];
    if (focal <= end)
      return from + ((focal - start) / (end - start)) * (to - from);
  }
  return curve[curve.length - 1][1];
}

export function shootingRange(camera?: Camera, lens?: Lens): ShootingRange {
  const ratings = emptyScores();
  if (!camera || !lens) return { status: "incomplete", ratings };
  if (!cameraAcceptsLens(camera, lens))
    return { status: "incompatible", ratings };
  const focal = focalRange(lens.focalLength);
  const sensorCrop = cropFactor(camera);
  if (!focal || sensorCrop === undefined) return { status: "unknown", ratings };
  // DX / EF-S lenses on a full-frame body are evaluated in their cropped image area.
  const lensCrop = /\bDX\b|\bEF-S\b|APS[\s-]*C/i.test(
    `${lens.name} ${lens.category}`,
  )
    ? /\bEF-S\b/i.test(lens.name)
      ? 1.6
      : 1.5
    : 1;
  const crop = Math.max(sensorCrop, lensCrop);
  const equivalent = { min: focal.min * crop, max: focal.max * crop };
  ratings.closeUp = lens.ratings.closeFocus;
  for (const key of Object.keys(curves) as (keyof typeof curves)[]) {
    const curve = curves[key];
    const points = [
      equivalent.min,
      equivalent.max,
      ...curve
        .map(([f]) => f)
        .filter((f) => f >= equivalent.min && f <= equivalent.max),
    ];
    ratings[key] =
      Math.round(Math.max(...points.map((f) => at(f, curve))) * 10) / 10;
  }
  return { status: "ready", ratings, equivalent };
}

export function squadronCoverage(data: Inventory, units: LoadoutSelection[]) {
  const ratings = emptyScores();
  let eligible = 0;
  for (const unit of units) {
    const profile = shootingRange(
      data.cameras.find((c) => c.id === unit.cameraId),
      data.lenses.find((l) => l.id === unit.lensId),
    );
    if (profile.status !== "ready") continue;
    eligible++;
    for (const key of Object.keys(ratings) as (keyof RangeScores)[])
      ratings[key] = Math.max(ratings[key], profile.ratings[key]);
  }
  return { ratings, eligible };
}
