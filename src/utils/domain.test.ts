import { describe, expect, it } from "vitest";
import {
  ratingPercent,
  filterLenses,
  validateEquipment,
  validBurstRate,
} from "./domain";
import { sampleInventory, emptyCamera, emptyLens } from "../data/sample";
import { getExportSize } from "../features/export/sizes";
describe("rating display", () => {
  it.each([
    [0, 0],
    [7.5, 75],
    [10, 100],
    [-2, 0],
    [12, 100],
    [NaN, 0],
  ])("maps %s to %s percent", (input, output) =>
    expect(ratingPercent(input)).toBe(output),
  );
});
describe("mount compatibility", () => {
  it("matches exact mounts and preserves all mode", () => {
    expect(filterLenses(sampleInventory.lenses, "Nikon F", true)).toHaveLength(
      5,
    );
    expect(
      filterLenses(sampleInventory.lenses, "Nikon Z", true).every((l) =>
        l.compatibleMounts.includes("Nikon Z"),
      ),
    ).toBe(true);
    expect(filterLenses(sampleInventory.lenses, "Unknown", true)).toEqual([]);
    expect(filterLenses(sampleInventory.lenses, "Unknown", false)).toEqual(
      sampleInventory.lenses,
    );
  });
  it("supports future adapter rules without changing inventory", () => {
    expect(
      filterLenses(sampleInventory.lenses, "Nikon Z", true, [
        { cameraMount: "Nikon Z", lensMount: "Nikon F" },
      ]),
    ).toHaveLength(7);
  });
});
describe("validation", () => {
  it.each([
    "14 fps (高速連続撮影・拡張) / 30 fps (C30)",
    "11 fps (高速連続撮影・拡張)",
    "15 fps (メカ) / 20 fps (電子・1.29×クロップ)",
    "約 8 コマ/秒",
    "14frames /s",
    "10–14 fps (RAW)",
    "11 fps（拡張）",
  ])("accepts mode-aware burst rate %s", (value) =>
    expect(validBurstRate(value)).toBe(true),
  );
  it.each([
    "0 fps",
    "-1 fps",
    "14 fps / 0 fps (C30)",
    "30–14 fps",
    "14 fps (未閉じ",
    "Infinity fps",
    "14 kg",
    "14 fps / -30 fps",
    "1(note)4 fps",
    "14 fps (RAW) extra",
  ])("rejects invalid burst rate %s", (value) =>
    expect(validBurstRate(value)).toBe(false),
  );
  it("accepts complete samples", () =>
    sampleInventory.cameras
      .concat([])
      .forEach((c) => expect(validateEquipment(c)).toEqual({})));
  it("requires key fields", () => {
    expect(validateEquipment(emptyCamera()).name).toBeTruthy();
    expect(validateEquipment(emptyLens()).compatibleMounts).toBeTruthy();
  });
  it("rejects nonfinite and out of range ratings", () => {
    const c = structuredClone(sampleInventory.cameras[0]);
    c.ratings.detail = 11;
    c.ratings.night = NaN;
    expect(validateEquipment(c)["ratings.detail"]).toBeTruthy();
    expect(validateEquipment(c)["ratings.night"]).toBeTruthy();
  });
  it("rejects malformed numeric fields", () => {
    const c = structuredClone(sampleInventory.cameras[0]);
    c.specs.weight = "-20";
    c.specs.releaseYear = "abc";
    expect(validateEquipment(c)["specs.weight"]).toBeTruthy();
    expect(validateEquipment(c)["specs.releaseYear"]).toBeTruthy();
    const l = structuredClone(sampleInventory.lenses[0]);
    l.maxAperture = "f/no";
    expect(validateEquipment(l).maxAperture).toBeTruthy();
  });
  it("accepts unit strings and ranges", () =>
    sampleInventory.lenses.forEach((l) =>
      expect(validateEquipment(l)).toEqual({}),
    ));
});
describe("export presets", () => {
  it.each([
    ["16:9", 1600, 900],
    ["1:1", 1200, 1200],
    ["4:5", 1200, 1500],
  ] as const)("%s has exact dimensions", (ratio, w, h) =>
    expect(getExportSize(ratio)).toEqual({ width: w, height: h }),
  );
});
