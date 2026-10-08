import {
  cameraRatingLabels,
  lensRatingLabels,
  isCamera,
  type Equipment,
  type Lens,
} from "../types";
export const ratingPercent = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.min(10, value)) * 10 : 0;
export type AdapterRule = { cameraMount: string; lensMount: string };
// Adapter support is opt-in: mount match alone never implies AF or full sensor coverage.
export const isCompatible = (
  lens: Lens,
  mount: string,
  adapters: AdapterRule[] = [],
) =>
  lens.compatibleMounts.includes(mount) ||
  adapters.some(
    (rule) =>
      rule.cameraMount === mount &&
      lens.compatibleMounts.includes(rule.lensMount),
  );
export const filterLenses = (
  lenses: Lens[],
  mount: string,
  compatibleOnly: boolean,
  adapters: AdapterRule[] = [],
) =>
  compatibleOnly
    ? lenses.filter((l) => isCompatible(l, mount, adapters))
    : lenses;
export type FormErrors = Record<string, string>;
const positiveRange =
  /^\s*(?:約\s*)?(?:f\/)?\d+(?:\.\d+)?(?:\s*[-–〜]\s*\d+(?:\.\d+)?)?\s*(?:g|kg|mm|MP|fps|コマ\/秒)?\s*$/i;
export function validateEquipment(item: Equipment): FormErrors {
  const errors: FormErrors = {};
  const required = (key: string, value: unknown) => {
    if (typeof value !== "string" || !value.trim())
      errors[key] = "必須項目を入力してください。";
  };
  for (const key of ["name", "maker", "category", "summary"] as const)
    required(key, item[key]);
  const numeric = (key: string, value: string, pattern = positiveRange) => {
    if (!value.trim()) return;
    const numbers = value.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (
      !pattern.test(value) ||
      numbers.some((n) => !Number.isFinite(n) || n <= 0) ||
      (numbers.length === 2 && numbers[0] > numbers[1])
    )
      errors[key] = "正の数値で入力してください（単位・範囲も可）。";
  };
  if (isCamera(item)) {
    required("mount", item.mount);
    required("role", item.role);
    numeric("specs.weight", item.specs.weight);
    numeric("specs.resolution", item.specs.resolution);
    numeric("specs.continuousShooting", item.specs.continuousShooting);
    if (
      item.specs.releaseYear &&
      !/^(18|19|20|21)\d{2}$/.test(item.specs.releaseYear)
    )
      errors["specs.releaseYear"] =
        "発売年は1800〜2199の整数で入力してください。";
  } else {
    if (
      !item.compatibleMounts.length ||
      item.compatibleMounts.some((m) => !m.trim())
    )
      errors.compatibleMounts = "対応マウントを1つ以上入力してください。";
    for (const key of ["focalLength", "maxAperture", "weight"] as const) {
      required(key, item[key]);
      numeric(key, item[key]);
    }
  }
  const labels = isCamera(item) ? cameraRatingLabels : lensRatingLabels;
  for (const key of Object.keys(labels)) {
    const value = (item.ratings as Record<string, number>)[key];
    if (!Number.isFinite(value) || value < 0 || value > 10)
      errors[`ratings.${key}`] = "評価は0〜10の数値で入力してください。";
  }
  return errors;
}
