import {
  cameraPartLabels,
  partFeatureLabels,
  MAX_CAMERA_PARTS,
  MAX_PART_NAME_LENGTH,
  cameraRatingLabels,
  lensRatingLabels,
  legacyCameraRatingKeys,
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
  /^\s*(?:約\s*)?(?:f\/)?\d+(?:\.\d+)?(?:\s*[-–〜]\s*\d+(?:\.\d+)?)?\s*(?:g|kg|mm|MP|fps|frames?\s*\/\s*s|コマ\/秒)?\s*$/i;
export function validCameraParts(
  parts: unknown,
  limit = MAX_CAMERA_PARTS,
): parts is import("../types").CameraPart[] {
  return !(
    !Array.isArray(parts) ||
    parts.length > limit ||
    parts.some(
      (part) =>
        !part ||
        typeof part !== "object" ||
        !Object.hasOwn(cameraPartLabels, part.kind) ||
        typeof part.name !== "string" ||
        !part.name.trim() ||
        part.name.length > MAX_PART_NAME_LENGTH ||
        /[\r\n]/.test(part.name) ||
        (Object.hasOwn(part, "weightGrams") &&
          (typeof part.weightGrams !== "number" ||
            !Number.isFinite(part.weightGrams) ||
            part.weightGrams < 0 ||
            part.weightGrams > 10000)) ||
        (Object.hasOwn(part, "features") &&
          (!Array.isArray(part.features) ||
            part.features.length > Object.keys(partFeatureLabels).length ||
            new Set(part.features).size !== part.features.length ||
            part.features.some(
              (feature: unknown) =>
                typeof feature !== "string" ||
                !Object.hasOwn(partFeatureLabels, feature),
            ))) ||
        (Object.hasOwn(part, "effects") &&
          (!part.effects ||
            typeof part.effects !== "object" ||
            Array.isArray(part.effects) ||
            Object.entries(part.effects).some(
              ([key, value]) =>
                !Object.hasOwn(cameraRatingLabels, key) ||
                typeof value !== "number" ||
                !Number.isFinite(value) ||
                value < -10 ||
                value > 10,
            ))),
    )
  );
}
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
    if (!validCameraParts(item.additionalParts))
      errors.additionalParts = `追加パーツは${MAX_CAMERA_PARTS}個まで、種類と1〜${MAX_PART_NAME_LENGTH}文字の名称（1行）、補正は各評価項目に−10〜+10の数値を入力してください。追加重量は0〜10000 g、追加機能は対応する機能を重複なく指定してください。`;
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
  const keys = [
    ...Object.keys(labels),
    ...(isCamera(item)
      ? legacyCameraRatingKeys.filter((key) => Object.hasOwn(item.ratings, key))
      : []),
  ];
  for (const key of keys) {
    const value = (item.ratings as Record<string, number>)[key];
    if (!Number.isFinite(value) || value < 0 || value > 10)
      errors[`ratings.${key}`] = "評価は0〜10の数値で入力してください。";
  }
  return errors;
}
