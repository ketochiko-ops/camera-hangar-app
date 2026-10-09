import { describe, expect, it } from "vitest";
import camerasCsv from "./defaults/cameras_corrected.csv?raw";
import lensesCsv from "./defaults/lenses_corrected.csv?raw";
import handheldLensesCsv from "./defaults/lenses_handheld_corrected_v2.csv?raw";
import { sampleInventory } from "./sample";
import {
  exportEquipmentCsv,
  mergeCsvImport,
  parseEquipmentCsv,
} from "../features/csv/inventoryCsv";
import { createLocalRepository, STORAGE_KEY } from "../utils/storage";
import { cameraDetailSpecs } from "../utils/equipmentProfile";

describe("corrected inventory defaults", () => {
  it("merges supplied lens additions and updates by ID while retaining unmatched original defaults", () => {
    const cameras = parseEquipmentCsv(camerasCsv, "camera");
    const lenses = parseEquipmentCsv(lensesCsv, "lens");
    const updates = parseEquipmentCsv(handheldLensesCsv, "lens");
    expect(cameras.issues).toEqual([]);
    expect(lenses.issues).toEqual([]);
    expect(updates.issues).toEqual([]);
    expect(cameras.items).toHaveLength(6);
    expect(lenses.items).toHaveLength(7);
    expect(updates.items).toHaveLength(16);
    expect(sampleInventory.cameras).toEqual(cameras.items);
    const expected = mergeCsvImport(
      mergeCsvImport({ version: 1, cameras: [], lenses: [] }, lenses),
      updates,
    );
    expect(sampleInventory.lenses).toHaveLength(20);
    expect(sampleInventory.lenses).toEqual(expected.lenses);
    for (const [kind, items] of [
      ["camera", sampleInventory.cameras],
      ["lens", sampleInventory.lenses],
    ] as const)
      expect(
        parseEquipmentCsv(exportEquipmentCsv(kind, items), kind).items,
      ).toEqual(items);
  });
  it("preserves mode-specific burst descriptions in detail views and initial local storage loads", () => {
    const repo = createLocalRepository(localStorage);
    const initial = repo.load();
    expect(initial.error).toBeUndefined();
    expect(initial.data).toEqual(sampleInventory);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(cameraDetailSpecs(initial.data.cameras[0])).toContainEqual([
      "BURST",
      "14 fps (高速連続撮影・拡張) / 30 fps (C30)",
    ]);
    expect(cameraDetailSpecs(initial.data.cameras[5])).toContainEqual([
      "BURST",
      "15 fps (メカ) / 20 fps (電子・1.29×クロップ)",
    ]);
  });
  it("keeps saved edits, photos, removed parts and squadron data, and allows an explicit corrected CSV update", () => {
    const saved = structuredClone(sampleInventory);
    saved.cameras[0].specs.continuousShooting = "14frames /s";
    saved.cameras[0].ratings.endurance = 6;
    saved.cameras[0].additionalParts = [];
    saved.cameras[0].image = "data:image/png;base64,cGhvdG8=";
    saved.lenses[0].name = "My lens";
    saved.lenses[0].image = "data:image/png;base64,bGVucw==";
    saved.squadron = {
      leader: { cameraId: "nikon-zf", lensId: "dx35" },
      wingmen: [{ cameraId: "fuji-xt5", lensId: "dx40" }],
    };
    const raw = JSON.stringify(saved);
    localStorage.setItem(STORAGE_KEY, raw);
    expect(createLocalRepository(localStorage).load().data).toEqual(saved);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
    const updated = mergeCsvImport(
      mergeCsvImport(saved, parseEquipmentCsv(camerasCsv, "camera")),
      parseEquipmentCsv(handheldLensesCsv, "lens"),
    );
    expect(updated.cameras[0].specs).toEqual(sampleInventory.cameras[0].specs);
    expect(updated.cameras[0].ratings).toEqual(
      sampleInventory.cameras[0].ratings,
    );
    expect(updated.cameras[0].image).toBe(saved.cameras[0].image);
    expect(updated.squadron).toEqual(saved.squadron);
    expect(updated.lenses[0].name).toBe(sampleInventory.lenses[0].name);
    expect(updated.lenses[0].ratings).toEqual(
      sampleInventory.lenses[0].ratings,
    );
    expect(updated.lenses[0].image).toBe(saved.lenses[0].image);
  });
});
