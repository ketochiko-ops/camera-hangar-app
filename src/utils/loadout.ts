import { sampleInventory } from "../data/sample";
import type {
  Camera,
  CameraPart,
  Inventory,
  Lens,
  LoadoutSelection,
  Squadron,
} from "../types";
import { isCompatible } from "./domain";
import { cameraAdaptedMounts, partProfile } from "./partEffects";

export const partKey = (part: CameraPart) =>
  `${part.kind}:${part.name.normalize("NFKC").trim().toLowerCase()}`;

export function collectParts(...lists: CameraPart[][]): CameraPart[] {
  const parts = new Map<string, CameraPart>();
  for (const part of lists.flat())
    parts.set(partKey(part), structuredClone(part));
  return [...parts.values()];
}

export function partFitsCamera(part: CameraPart, camera: Camera): boolean {
  const profile = partProfile(part);
  const mountKey = (mount: string) =>
    mount.normalize("NFKC").replace(/\s/g, "").toLowerCase();
  if (profile?.adapter)
    return mountKey(profile.adapter.cameraMount) === mountKey(camera.mount);
  if (profile?.names.includes("SmallRig"))
    return camera.id === "nikon-zf" || /Z\s*f$/i.test(camera.name);
  if (profile?.names.includes("SONY VG-C3EM"))
    return /α7R\s*IIIA|a7r\s*iiia/i.test(camera.name.normalize("NFKC"));
  if (profile?.features?.includes("wirelessFlash")) {
    const variant = part.name
      .normalize("NFKC")
      .replace(/[\s_-]/g, "")
      .match(/X2T([NSFCOP])$/i)?.[1]
      .toUpperCase();
    if (variant)
      return (
        {
          N: "nikon",
          S: "sony",
          F: "fujifilm",
          C: "canon",
          O: "olympus",
          P: "pentax",
        }[variant] === camera.maker.toLowerCase()
      );
  }
  return true;
}

export function availableCameraParts(
  data: Inventory,
  camera: Camera,
): CameraPart[] {
  const equipped = new Set(camera.additionalParts.map(partKey));
  return collectParts(
    sampleInventory.cameras.flatMap((c) => c.additionalParts),
    sampleInventory.partCatalog ?? [],
    data.partCatalog ?? [],
    data.cameras.flatMap((c) => c.additionalParts),
    camera.additionalParts,
  ).filter(
    (part) => equipped.has(partKey(part)) || partFitsCamera(part, camera),
  );
}

export function cameraAcceptsLens(camera: Camera, lens: Lens): boolean {
  return isCompatible(
    lens,
    camera.mount,
    cameraAdaptedMounts(camera).map((entry) => ({
      cameraMount: camera.mount,
      lensMount: entry.mount,
    })),
  );
}

export function validSquadron(value: unknown): value is Squadron {
  if (!value || typeof value !== "object") return false;
  const squadron = value as Squadron;
  const valid = (entry: LoadoutSelection) =>
    entry &&
    typeof entry === "object" &&
    !Array.isArray(entry) &&
    (entry.cameraId === undefined || typeof entry.cameraId === "string") &&
    (entry.lensId === undefined || typeof entry.lensId === "string");
  return (
    !!valid(squadron.leader) &&
    Array.isArray(squadron.wingmen) &&
    squadron.wingmen.every(valid)
  );
}

export function normalizeSquadron(
  data: Inventory,
  squadron: Squadron,
): Squadron {
  const cameras = new Set<string>();
  const lenses = new Set<string>();
  const normalize = (entry: LoadoutSelection): LoadoutSelection => {
    const cameraId =
      entry.cameraId &&
      data.cameras.some((c) => c.id === entry.cameraId) &&
      !cameras.has(entry.cameraId)
        ? entry.cameraId
        : undefined;
    const lensId =
      cameraId &&
      entry.lensId &&
      data.lenses.some((l) => l.id === entry.lensId) &&
      !lenses.has(entry.lensId)
        ? entry.lensId
        : undefined;
    if (cameraId) cameras.add(cameraId);
    if (lensId) lenses.add(lensId);
    return { cameraId, lensId };
  };
  return {
    leader: normalize(squadron.leader),
    wingmen: squadron.wingmen.map(normalize),
  };
}

export function prepareInventory(
  previous: Inventory,
  next: Inventory,
): Inventory {
  return {
    ...next,
    partCatalog: collectParts(
      previous.partCatalog ?? [],
      previous.cameras.flatMap((c) => c.additionalParts),
      next.partCatalog ?? [],
      next.cameras.flatMap((c) => c.additionalParts),
    ),
    ...(next.squadron
      ? { squadron: normalizeSquadron(next, next.squadron) }
      : {}),
  };
}
