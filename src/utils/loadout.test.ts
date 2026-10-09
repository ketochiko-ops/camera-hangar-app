import { describe, expect, it } from "vitest";
import { sampleInventory } from "../data/sample";
import {
  availableCameraParts,
  cameraAcceptsLens,
  normalizeSquadron,
  partFitsCamera,
  prepareInventory,
  validSquadron,
} from "./loadout";
import { createLocalRepository, STORAGE_KEY } from "./storage";
import type { CameraPart } from "../types";

describe("loadouts and squadron", () => {
  it("retains removed custom parts with their overrides across saves and reloads", () => {
    const before = structuredClone(sampleInventory);
    const custom: CameraPart = {
      kind: "other",
      name: "Custom kit",
      effects: { mobility: -0.4 },
      weightGrams: 25,
      features: ["hss"],
    };
    before.cameras[0].additionalParts.push(custom);
    const next = structuredClone(before);
    next.cameras[0].additionalParts = [];
    const saved = prepareInventory(before, next);
    const repo = createLocalRepository(localStorage);
    repo.save(saved);
    const loaded = repo.load();
    expect(loaded.error).toBeUndefined();
    expect(loaded.data.cameras[0].additionalParts).toEqual([]);
    expect(
      availableCameraParts(loaded.data, loaded.data.cameras[0]),
    ).toContainEqual(custom);
    expect(before.cameras[0].additionalParts).toContainEqual(custom);
  });
  it("offers matching grips, adapters and X2T variants and lets a mismatched equipped part be removed", () => {
    const data = structuredClone(sampleInventory);
    const names = availableCameraParts(data, data.cameras[0]).map(
      (p) => p.name,
    );
    expect(names).toContain("Godox X2T-N");
    expect(names).not.toContain("Godox X2T-S");
    expect(names).not.toContain("SONY VG-C3EM");
    expect(names).not.toContain("Fringer FR-FTX2");
    expect(
      partFitsCamera(
        { kind: "adapter", name: "Nikon FTZ II" },
        { ...data.cameras[0], mount: "NIKON Z" },
      ),
    ).toBe(true);
    const wrong: CameraPart = { kind: "lighting", name: "Godox X2T-S" };
    expect(partFitsCamera(wrong, data.cameras[0])).toBe(false);
    data.cameras[0].additionalParts.push(wrong);
    expect(availableCameraParts(data, data.cameras[0])).toContainEqual(wrong);
  });
  it("enables Nikon F lenses only while a matching adapter is attached", () => {
    const camera = structuredClone(sampleInventory.cameras[0]);
    expect(cameraAcceptsLens(camera, sampleInventory.lenses[0])).toBe(true);
    camera.additionalParts = [];
    expect(cameraAcceptsLens(camera, sampleInventory.lenses[0])).toBe(false);
    expect(cameraAcceptsLens(camera, sampleInventory.lenses[5])).toBe(true);
  });
  it("keeps multiple wingmen, removes stale references and prevents duplicate camera and lens assignment", () => {
    const data = structuredClone(sampleInventory);
    const squadron = {
      leader: { cameraId: "nikon-zf", lensId: "z40" },
      wingmen: [
        { cameraId: "sony-a7r", lensId: "dx35" },
        { cameraId: "fuji-xt5", lensId: "dx40" },
        { cameraId: "nikon-zf", lensId: "af28" },
        { cameraId: "nikon-d7500", lensId: "z40" },
      ],
    };
    const clean = normalizeSquadron(data, squadron);
    expect(clean.wingmen).toHaveLength(4);
    expect(clean.wingmen[0]).toEqual(squadron.wingmen[0]);
    expect(clean.wingmen[1]).toEqual(squadron.wingmen[1]);
    expect(clean.wingmen[2]).toEqual({
      cameraId: undefined,
      lensId: undefined,
    });
    expect(clean.wingmen[3]).toEqual({
      cameraId: "nikon-d7500",
      lensId: undefined,
    });
    data.cameras = data.cameras.filter((c) => c.id !== "sony-a7r");
    data.lenses = data.lenses.filter((l) => l.id !== "z40");
    expect(normalizeSquadron(data, clean).leader.lensId).toBeUndefined();
    expect(normalizeSquadron(data, clean).wingmen[0]).toEqual({
      cameraId: undefined,
      lensId: undefined,
    });
  });
  it("round trips squadron data and protects malformed catalog and squadron storage", () => {
    const data = structuredClone(sampleInventory);
    data.squadron = {
      leader: { cameraId: "nikon-zf", lensId: "z40" },
      wingmen: [{ cameraId: "nikon-d7500", lensId: "dx35" }],
    };
    const repo = createLocalRepository(localStorage);
    repo.save(data);
    expect(repo.load().data.squadron).toEqual(data.squadron);
    expect(validSquadron({ leader: null, wingmen: [] })).toBe(false);
    expect(validSquadron({ leader: {}, wingmen: [{ cameraId: 123 }] })).toBe(
      false,
    );
    for (const extra of [
      { squadron: { leader: {}, wingmen: null } },
      {
        partCatalog: [{ kind: "other", name: "broken", features: ["invalid"] }],
      },
    ]) {
      const raw = JSON.stringify({ ...data, ...extra });
      localStorage.setItem(STORAGE_KEY, raw);
      const broken = createLocalRepository(localStorage);
      expect(broken.load().error).toBeTruthy();
      expect(() => broken.save(sampleInventory)).toThrow(/保護/);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
    }
  });
});
