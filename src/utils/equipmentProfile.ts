import { legacyCameraRatingKeys, specLabels, type Camera } from "../types";

export function cameraDetailSpecs(camera: Camera): [string, string][] {
  const sensor = camera.specs.sensor.replace(
    /^35mm\s*フルサイズ$/,
    "FULL FRAME",
  );
  const burst = camera.specs.continuousShooting.replace(
    /^(約\s*)?(\d+(?:\.\d+)?(?:\s*[-–〜]\s*\d+(?:\.\d+)?)?)\s*(?:fps|コマ\/秒|frames?\s*\/\s*s)$/i,
    (_match, approximate: string | undefined, value: string) =>
      `${approximate ? "~" : ""}${value}frames /s`,
  );
  return [
    [specLabels.sensor, sensor || "—"],
    [specLabels.resolution, camera.specs.resolution || "—"],
    ["MOUNT", camera.mount.toUpperCase() || "—"],
    [specLabels.continuousShooting, burst || "—"],
    [specLabels.storageSlots, camera.specs.storageSlots || "—"],
    [specLabels.weight, camera.specs.weight || "—"],
    [specLabels.releaseYear, camera.specs.releaseYear || "—"],
  ];
}

// Only complete, valid legacy profiles are migrated. Broken current profiles
// must still fail validation instead of being silently repaired.
export function migrateLegacyRatings(value: unknown, camera: boolean): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const ratings = value as Record<string, number>;
  const oldKeys = camera
    ? [
        "resolution",
        "highIso",
        "autofocus",
        "dynamicRange",
        "handling",
        "portability",
        "colorRendering",
      ]
    : [
        "sharpness",
        "portability",
        "versatility",
        "lowLight",
        "closeUp",
        "backgroundBlur",
      ];
  const newKeys = camera
    ? ["bokeh", "lowLight", "reach", "closeFocus", "mobility", "versatility"]
    : ["resolution", "bokeh", "reach", "closeFocus", "mobility"];
  if (
    newKeys.some((key) => Object.hasOwn(ratings, key)) ||
    !oldKeys.every(
      (key) =>
        Number.isFinite(ratings[key]) &&
        ratings[key] >= 0 &&
        ratings[key] <= 10,
    )
  )
    return value;
  return {
    resolution: camera ? ratings.resolution : ratings.sharpness,
    bokeh: camera ? 0 : ratings.backgroundBlur,
    lowLight: camera ? ratings.highIso : ratings.lowLight,
    reach: 0,
    closeFocus: camera ? 0 : ratings.closeUp,
    mobility: ratings.portability,
    versatility: camera ? 0 : ratings.versatility,
    ...(camera
      ? Object.fromEntries(
          legacyCameraRatingKeys.map((key) => [key, ratings[key]]),
        )
      : {}),
  };
}
