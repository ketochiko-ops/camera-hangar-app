import { describe, expect, it, vi } from "vitest";
import { createLocalRepository, STORAGE_KEY } from "./storage";
import { sampleInventory } from "../data/sample";
describe("local repository", () => {
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
