import {
  cameraRatingLabels,
  isCamera,
  type CameraPart,
  type Camera,
  type Equipment,
  type PartEffects,
  type RatingKey,
} from "../types";
import { ratingPercent } from "./domain";

const normalize = (name: string) =>
  name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ⅱ/g, "ii")
    .replace(/[\s_-]/g, "");

// App reference scores, not measured manufacturer ratings. See docs/part-effects.md.
const profiles: {
  kind: CameraPart["kind"];
  names: string[];
  effects: PartEffects;
  source: string;
  adapter?: { cameraMount: string; lensMount: string };
}[] = [
  {
    kind: "grip",
    names: ["SmallRig", "SmallRig 4262", "SmallRig Zf 4262"],
    effects: { stability: 0.5, mobility: -0.3 },
    source:
      "https://www.smallrig.com/SmallRig-L-Shape-Handle-for-Nikon-Zf-4262.html",
  },
  {
    kind: "adapter",
    names: ["Nikon FTZ II", "FTZ II"],
    adapter: { cameraMount: "Nikon Z", lensMount: "Nikon F" },
    effects: { mobility: -0.5 },
    source: "https://imaging.nikon.com/imaging/lineup/accessory/camera/ftz_2/",
  },
  {
    kind: "grip",
    names: ["SONY VG-C3EM", "VG-C3EM"],
    effects: { stability: 0.5, endurance: 2, mobility: -1.5 },
    source:
      "https://www.sony.com.sg/electronics/interchangeable-lens-cameras-vertical-grips/vg-c3em",
  },
  {
    kind: "adapter",
    names: ["MonsterAdapter LA-FE1", "Monster Adapter LA-FE1", "LA-FE1"],
    adapter: { cameraMount: "Sony E", lensMount: "Nikon F" },
    effects: { response: -1, mobility: -0.5 },
    source:
      "https://www.monsteradapter.com/products/la-fe1-nikon-f-mount-lenses-to-sony-e-mount-cameras-adapter",
  },
  {
    kind: "adapter",
    names: ["Fringer FR-FTX2", "FR-FTX2", "Fringer NF-FX II"],
    adapter: { cameraMount: "Fujifilm X", lensMount: "Nikon F" },
    effects: { response: -0.5, mobility: -0.7 },
    source: "https://www.fringeradapter.com/nikon-f-to-fujifilm-x",
  },
];
export function partProfile(part: CameraPart) {
  return profiles.find(
    (profile) =>
      profile.kind === part.kind &&
      profile.names.some((name) => normalize(name) === normalize(part.name)),
  );
}
export function getPartEffects(part: CameraPart): PartEffects {
  return part.effects ?? partProfile(part)?.effects ?? {};
}
export function cameraAdaptedMounts(camera: Camera) {
  const mounts = new Map<string, { mount: string; adapters: string[] }>();
  for (const part of camera.additionalParts) {
    const adapter = partProfile(part)?.adapter;
    if (!adapter || normalize(adapter.cameraMount) !== normalize(camera.mount))
      continue;
    const key = normalize(adapter.lensMount);
    if (key === normalize(camera.mount)) continue;
    const entry = mounts.get(key) ?? { mount: adapter.lensMount, adapters: [] };
    if (!entry.adapters.includes(part.name)) entry.adapters.push(part.name);
    mounts.set(key, entry);
  }
  return [...mounts.values()];
}
export function equipmentRatings(item: Equipment) {
  const base = Object.fromEntries(
    Object.entries(item.ratings).map(([key, value]) => [
      key,
      ratingPercent(value) / 10,
    ]),
  );
  const ratings = { ...base };
  const deltas: Record<string, number> = {};
  if (isCamera(item)) {
    for (const key of Object.keys(cameraRatingLabels) as RatingKey[]) {
      const requested = item.additionalParts.reduce(
        (total, part) => total + (getPartEffects(part)[key] ?? 0),
        0,
      );
      // Sum before clamping: order of installation must not affect the result.
      ratings[key] =
        Math.round(Math.max(0, Math.min(10, base[key] + requested)) * 1e8) /
        1e8;
      deltas[key] = Math.round((ratings[key] - base[key]) * 1e8) / 1e8;
    }
  }
  return { ratings, base, deltas };
}
