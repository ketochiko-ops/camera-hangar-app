import { describe, expect, it } from "vitest";
import { sampleInventory } from "../data/sample";
import {
  cameraAdaptedMounts,
  equipmentRatings,
  getPartEffects,
} from "./partEffects";

describe("installed part effects", () => {
  it("adds the correct lens mount for each specified adapter independently of score overrides", () => {
    for (const index of [0, 4, 5]) {
      const camera = structuredClone(sampleInventory.cameras[index]);
      const adapter = camera.additionalParts.find(
        (part) => part.kind === "adapter",
      )!;
      adapter.effects = {};
      const before = structuredClone(camera);
      expect(cameraAdaptedMounts(camera)).toEqual([
        { mount: "Nikon F", adapters: [adapter.name] },
      ]);
      expect(camera).toEqual(before);
      camera.additionalParts = camera.additionalParts.filter(
        (part) => part.kind !== "adapter",
      );
      expect(cameraAdaptedMounts(camera)).toEqual([]);
    }
  });
  it("deduplicates mounts and ignores unknown, wrongly typed or mismatched adapters", () => {
    const camera = structuredClone(sampleInventory.cameras[0]);
    camera.additionalParts = [
      { kind: "adapter", name: "FTZⅡ" },
      { kind: "adapter", name: "Nikon FTZ II" },
      { kind: "adapter", name: "Unknown adapter" },
      { kind: "grip", name: "FTZ II" },
      { kind: "adapter", name: "MonsterAdapter LA-FE1" },
    ];
    expect(cameraAdaptedMounts(camera)).toEqual([
      { mount: "Nikon F", adapters: ["FTZⅡ", "Nikon FTZ II"] },
    ]);
    camera.mount = "Nikon F";
    expect(cameraAdaptedMounts(camera)).toEqual([]);
  });
  it("applies researched parts to existing cameras without changing saved body scores", () => {
    const camera = structuredClone(sampleInventory.cameras[0]);
    const before = structuredClone(camera);
    expect(equipmentRatings(camera)).toMatchObject({
      ratings: { stability: 9.5, mobility: 5.2, response: 9 },
      deltas: { stability: 0.5, mobility: -0.8, response: 0 },
    });
    expect(camera).toEqual(before);
    camera.additionalParts = [];
    expect(equipmentRatings(camera).ratings).toEqual(camera.ratings);
  });
  it("caps the vertical grip benefit and reports the actual visible increase", () => {
    expect(equipmentRatings(sampleInventory.cameras[4])).toMatchObject({
      ratings: { endurance: 10, stability: 7.5, response: 7.5, mobility: 5 },
      deltas: { endurance: 1.5, stability: 0.5, response: -1, mobility: -2 },
    });
    expect(equipmentRatings(sampleInventory.cameras[5])).toMatchObject({
      ratings: { response: 8, mobility: 7.3 },
    });
  });
  it("sums before clamping, is independent of order, and supports cancellation", () => {
    const camera = structuredClone(sampleInventory.cameras[0]);
    camera.additionalParts = [
      {
        kind: "other",
        name: "Increase",
        effects: { detail: 10, mobility: -10 },
      },
      {
        kind: "other",
        name: "Decrease",
        effects: { detail: -10, mobility: 10 },
      },
    ];
    const result = equipmentRatings(camera);
    expect(result.ratings).toEqual(camera.ratings);
    expect(result.deltas.detail).toBe(0);
    camera.additionalParts.reverse();
    expect(equipmentRatings(camera)).toEqual(result);
    camera.additionalParts.pop();
    expect(equipmentRatings(camera)).toMatchObject({
      ratings: { detail: 0, mobility: 10 },
      deltas: { detail: -7.5, mobility: 4 },
    });
  });
  it("recognizes formatting variants, leaves unknown parts neutral, and respects explicit overrides", () => {
    expect(getPartEffects({ kind: "adapter", name: "ＦＴＺⅡ" })).toEqual({
      mobility: -0.5,
    });
    expect(getPartEffects({ kind: "other", name: "SmallRig" })).toEqual({});
    expect(getPartEffects({ kind: "grip", name: "SmallRig cage" })).toEqual({});
    expect(
      getPartEffects({ kind: "grip", name: "SmallRig", effects: {} }),
    ).toEqual({});
    expect(
      getPartEffects({
        kind: "grip",
        name: "SmallRig",
        effects: { endurance: 1 },
      }),
    ).toEqual({ endurance: 1 });
  });
  it("does not change lens ratings or unmodified body precision", () => {
    expect(equipmentRatings(sampleInventory.lenses[0])).toMatchObject({
      ratings: sampleInventory.lenses[0].ratings,
      deltas: {},
    });
    const camera = structuredClone(sampleInventory.cameras[1]);
    camera.ratings.detail = 7.55;
    expect(equipmentRatings(camera).ratings.detail).toBe(7.55);
  });
});
