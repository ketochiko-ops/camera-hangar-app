import { describe, expect, it } from "vitest";
import { sampleInventory } from "../data/sample";
import { shootingRange, squadronCoverage } from "./shootingRange";

const camera = (id: string) =>
  structuredClone(sampleInventory.cameras.find((c) => c.id === id)!);
const lens = (id: string) =>
  structuredClone(sampleInventory.lenses.find((l) => l.id === id)!);

describe("shooting range coverage", () => {
  it("changes field-of-view coverage with sensor crop while keeping close-up independent", () => {
    const full = shootingRange(camera("nikon-zf"), lens("z40"));
    const aps = shootingRange(camera("nikon-zfc"), lens("z40"));
    expect(full.status).toBe("ready");
    expect(full.equivalent).toEqual({ min: 40, max: 40 });
    expect(aps.equivalent).toEqual({ min: 60, max: 60 });
    expect(full.ratings.wide).toBeGreaterThan(aps.ratings.wide);
    expect(full.ratings.telephoto).toBeLessThan(aps.ratings.telephoto);
    expect(full.ratings.closeUp).toBe(3);
    expect(aps.ratings.closeUp).toBe(3);
  });
  it("credits a zoom for focal lengths inside its range, including standard 50mm", () => {
    const result = shootingRange(camera("nikon-zf"), lens("z24"));
    expect(result.equivalent).toEqual({ min: 24, max: 70 });
    expect(result.ratings).toEqual({
      wide: 10,
      closeUp: 6,
      standard: 10,
      telephoto: 1.7,
    });
    const tele = shootingRange(camera("nikon-d7500"), lens("af70"));
    expect(tele.equivalent).toEqual({ min: 105, max: 315 });
    expect(tele.ratings.telephoto).toBe(10);
    expect(tele.ratings.wide).toBe(0);
  });
  it("uses the DX image area on full frame and separates macro capability from wide angle", () => {
    const result = shootingRange(camera("nikon-zf"), lens("dx40"));
    expect(result.equivalent).toEqual({ min: 60, max: 60 });
    expect(result.ratings.closeUp).toBe(9.5);
    expect(result.ratings.wide).toBe(2.9);
    const fish = shootingRange(camera("nikon-zf"), lens("sigma15"));
    expect(fish.ratings.wide).toBe(10);
    expect(fish.ratings.closeUp).toBe(5);
  });
  it("counts only usable combinations and responds to adapter removal without altering equipment", () => {
    const body = camera("nikon-zf");
    const optic = lens("af28");
    const before = structuredClone({ body, optic });
    expect(shootingRange(body, optic).status).toBe("ready");
    expect({ body, optic }).toEqual(before);
    body.additionalParts = body.additionalParts.filter(
      (p) => p.kind !== "adapter",
    );
    expect(shootingRange(body, optic)).toEqual({
      status: "incompatible",
      ratings: { wide: 0, closeUp: 0, standard: 0, telephoto: 0 },
    });
    expect(shootingRange(body).status).toBe("incomplete");
    expect(shootingRange(undefined, optic).status).toBe("incomplete");
  });
  it.each(["unknown", "0 mm", "70-24 mm", "24mm equivalent", "35/50 mm"])(
    "does not invent scores from unsupported focal lengths: %s",
    (value) => {
      const optic = lens("z40");
      optic.focalLength = value;
      expect(shootingRange(camera("nikon-zf"), optic).status).toBe("unknown");
    },
  );
  it.each([
    ["APS-C CMOS", "Canon", 1.6],
    ["Micro Four Thirds CMOS", "OM SYSTEM", 2],
    ["1-inch CMOS", "Nikon", 2.7],
    ["1/2.3-inch CMOS", "Nikon", undefined],
    ["Unknown CMOS", "Nikon", undefined],
  ] as const)("interprets %s crop explicitly", (sensor, maker, crop) => {
    const body = camera("nikon-zf");
    body.specs.sensor = sensor;
    body.maker = maker;
    const result = shootingRange(body, lens("z40"));
    if (crop === undefined) expect(result.status).toBe("unknown");
    else expect(result.equivalent).toEqual({ min: 40 * crop, max: 40 * crop });
  });
  it("normalizes full-width decimal zoom notation", () => {
    const optic = lens("z24");
    optic.focalLength = "２４．５〜７０ ｍｍ";
    expect(shootingRange(camera("nikon-zf"), optic).equivalent).toEqual({
      min: 24.5,
      max: 70,
    });
  });
  it("uses each range's best equipped unit and loses coverage when that wingman leaves", () => {
    const data = structuredClone(sampleInventory);
    const leader = { cameraId: "nikon-zf", lensId: "z24" };
    const tele = { cameraId: "nikon-d7500", lensId: "af70" };
    const macro = { cameraId: "fuji-xt5", lensId: "dx40" };
    const result = squadronCoverage(data, [leader, tele, macro, {}]);
    expect(result).toEqual({
      eligible: 3,
      ratings: { wide: 10, closeUp: 9.5, standard: 10, telephoto: 10 },
    });
    expect(squadronCoverage(data, [leader, macro]).ratings.telephoto).toBe(1.7);
    expect(squadronCoverage(data, [leader, leader]).ratings).toEqual(
      shootingRange(camera("nikon-zf"), lens("z24")).ratings,
    );
    expect(
      squadronCoverage(data, [{ cameraId: "canon-5d", lensId: "z40" }, {}])
        .eligible,
    ).toBe(0);
  });
});
