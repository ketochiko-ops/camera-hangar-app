import { describe, expect, it, vi } from "vitest";
import { createLocalRepository, STORAGE_KEY } from "./storage";
import { sampleInventory } from "../data/sample";
describe("local repository", () => {
  it("adds lighting once to the four specified saved cameras without changing existing equipment, photos or raw storage", () => {
    const data = structuredClone(sampleInventory);
    delete data.defaultLightingVersion;
    data.cameras.forEach(
      (camera) =>
        (camera.additionalParts = camera.additionalParts.filter(
          (part) => part.kind !== "lighting",
        )),
    );
    data.cameras[0].image = "data:image/png;base64,cGhvdG8=";
    const before = structuredClone(data);
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    const repo = createLocalRepository(localStorage);
    const loaded = repo.load();
    expect(loaded.error).toBeUndefined();
    expect(loaded.data.defaultLightingVersion).toBe(1);
    for (const index of [0, 4, 5, 3]) {
      expect(
        loaded.data.cameras[index].additionalParts.slice(
          0,
          before.cameras[index].additionalParts.length,
        ),
      ).toEqual(before.cameras[index].additionalParts);
      expect(
        loaded.data.cameras[index].additionalParts.filter(
          (part) => part.kind === "lighting",
        ),
      ).toHaveLength(2);
      expect(loaded.data.cameras[index].ratings).toEqual(
        before.cameras[index].ratings,
      );
    }
    expect(loaded.data.cameras[0].image).toBe(before.cameras[0].image);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
    loaded.data.cameras[0].additionalParts = [];
    repo.save(loaded.data);
    expect(repo.load().data.cameras[0].additionalParts).toEqual([]);
  });
  it("does not replace full loadouts, duplicate existing lighting or attach lighting to renamed cameras", () => {
    const data = structuredClone(sampleInventory);
    delete data.defaultLightingVersion;
    data.cameras[0].additionalParts = Array.from({ length: 8 }, () => ({
      kind: "other",
      name: "Existing part",
    }));
    data.cameras[3].name = "Custom body";
    data.cameras[3].additionalParts = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const loaded = createLocalRepository(localStorage).load();
    expect(loaded.error).toBeUndefined();
    expect(loaded.data.cameras[0].additionalParts).toEqual(
      data.cameras[0].additionalParts,
    );
    expect(loaded.data.cameras[4].additionalParts).toEqual(
      data.cameras[4].additionalParts,
    );
    expect(loaded.data.cameras[3].additionalParts).toEqual([]);
  });
  it("preserves custom effects and protects invalid effects from being overwritten", () => {
    const data = structuredClone(sampleInventory);
    data.cameras[0].additionalParts[0].effects = { stability: 1, mobility: -2 };
    data.cameras[0].additionalParts[0].weightGrams = 20;
    data.cameras[0].additionalParts[0].features = ["flash"];
    let repo = createLocalRepository(localStorage);
    repo.save(data);
    expect(repo.load().data).toEqual(data);
    data.cameras[0].additionalParts[0].effects = { stability: NaN };
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    repo = createLocalRepository(localStorage);
    expect(repo.load().error).toBeTruthy();
    expect(() => repo.save(sampleInventory)).toThrow(/読み込めない/);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it("loads old camera records with the specified parts while preserving explicit empty lists and source data", () => {
    const data = structuredClone(sampleInventory);
    for (const camera of data.cameras)
      Reflect.deleteProperty(camera, "additionalParts");
    data.cameras[0].additionalParts = [];
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    const loaded = createLocalRepository(localStorage).load();
    expect(loaded.error).toBeUndefined();
    expect(loaded.data.cameras[0].additionalParts).toEqual([]);
    expect(loaded.data.cameras[4].additionalParts).toEqual(
      sampleInventory.cameras[4].additionalParts,
    );
    expect(loaded.data.cameras[5].additionalParts).toEqual(
      sampleInventory.cameras[5].additionalParts,
    );
    expect(loaded.data.cameras[1].additionalParts).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it("protects stored data containing invalid parts from being overwritten", () => {
    const data = structuredClone(sampleInventory);
    Object.assign(data.cameras[0], { additionalParts: null });
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    const repo = createLocalRepository(localStorage);
    expect(repo.load().error).toBeTruthy();
    expect(() => repo.save(sampleInventory)).toThrow(/読み込めない/);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it("seeds only a missing store", () =>
    expect(createLocalRepository(localStorage).load().data).toEqual(
      sampleInventory,
    ));
  it("round trips data and empty inventories", () => {
    const repo = createLocalRepository(localStorage);
    repo.save(sampleInventory);
    expect(repo.load().data).toEqual(sampleInventory);
    repo.save({ version: 1, cameras: [], lenses: [] });
    expect(repo.load().data.cameras).toEqual([]);
  });
  it("migrates complete legacy camera and lens scores without overwriting the original store", () => {
    const data = structuredClone(sampleInventory);
    Object.assign(data.cameras[0], {
      ratings: {
        resolution: 7.5,
        highIso: 9,
        autofocus: 8,
        dynamicRange: 7,
        handling: 6,
        portability: 5,
        colorRendering: 4,
      },
      image: "data:image/png;base64,cGhvdG8=",
    });
    Object.assign(data.lenses[0], {
      ratings: {
        sharpness: 8,
        portability: 9,
        versatility: 7,
        lowLight: 6,
        closeUp: 5,
        backgroundBlur: 4,
      },
    });
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    const repo = createLocalRepository(localStorage);
    const loaded = repo.load();
    expect(loaded.error).toBeUndefined();
    expect(loaded.data.cameras[0].ratings).toEqual({
      detail: 7.5,
      night: 9,
      latitude: 7,
      response: 8,
      stability: 0,
      endurance: 0,
      resolution: 7.5,
      bokeh: 0,
      lowLight: 9,
      reach: 0,
      closeFocus: 0,
      mobility: 5,
      versatility: 0,
      autofocus: 8,
      dynamicRange: 7,
      handling: 6,
      colorRendering: 4,
    });
    expect(loaded.data.lenses[0].ratings).toEqual({
      resolution: 8,
      bokeh: 4,
      lowLight: 6,
      reach: 0,
      closeFocus: 5,
      mobility: 9,
      versatility: 7,
    });
    expect(loaded.data.cameras[0].image).toBe(data.cameras[0].image);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
    repo.save(loaded.data);
    expect(repo.load()).toEqual({ data: loaded.data });
  });
  it("migrates the previous shared camera profile, retaining old values and the original store", () => {
    const data = structuredClone(sampleInventory);
    const previous = {
      resolution: 7,
      bokeh: 4,
      lowLight: 8,
      reach: 6,
      closeFocus: 5,
      mobility: 9,
      versatility: 3,
      autofocus: 8,
      dynamicRange: 7,
    };
    Object.assign(data.cameras[0], { ratings: previous });
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    const loaded = createLocalRepository(localStorage).load();
    expect(loaded.error).toBeUndefined();
    expect(loaded.data.cameras[0].ratings).toEqual({
      ...previous,
      detail: 7,
      night: 8,
      latitude: 7,
      response: 8,
      stability: 0,
      endurance: 0,
    });
    expect(loaded.data.lenses).toEqual(data.lenses);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it("does not fill missing current scores or repair invalid legacy scores", () => {
    const data = structuredClone(sampleInventory);
    Reflect.deleteProperty(data.cameras[0].ratings, "stability");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    expect(createLocalRepository(localStorage).load().error).toBeTruthy();
    Object.assign(data.cameras[0], {
      ratings: {
        resolution: 7,
        highIso: 11,
        autofocus: 8,
        dynamicRange: 7,
        handling: 6,
        portability: 5,
        colorRendering: 4,
      },
    });
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    expect(createLocalRepository(localStorage).load().error).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it("keeps malformed data and reports a recovery error", () => {
    localStorage.setItem(STORAGE_KEY, "broken");
    expect(createLocalRepository(localStorage).load().error).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("broken");
  });
  it("rejects invalid schema and unsupported versions", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, cameras: [], lenses: [] }),
    );
    expect(createLocalRepository(localStorage).load().error).toBeTruthy();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, cameras: [{ id: "bad" }], lenses: [] }),
    );
    expect(createLocalRepository(localStorage).load().error).toBeTruthy();
  });
  it("reports quota failure without swallowing it", () => {
    const fake = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new DOMException("Full", "QuotaExceededError");
      }),
    };
    expect(() => createLocalRepository(fake).save(sampleInventory)).toThrow(
      /容量/,
    );
  });
  it("does not overwrite unreadable data during a failed recovery", () => {
    localStorage.setItem(STORAGE_KEY, "broken");
    const repo = createLocalRepository(localStorage);
    repo.load();
    expect(() => repo.save(sampleInventory)).toThrow(/読み込めない/);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("broken");
  });
  it("rejects non-string specs and duplicate IDs", () => {
    const malformed = structuredClone(sampleInventory);
    Object.assign(malformed.cameras[0].specs, { sensor: 123 });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(malformed));
    expect(createLocalRepository(localStorage).load().error).toBeTruthy();
    const duplicate = structuredClone(sampleInventory);
    duplicate.cameras.push(duplicate.cameras[0]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(duplicate));
    expect(createLocalRepository(localStorage).load().error).toBeTruthy();
  });
});
