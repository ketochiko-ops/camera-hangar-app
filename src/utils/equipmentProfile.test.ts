import { expect, it } from "vitest";
import { sampleInventory } from "../data/sample";
import { cameraDetailSpecs } from "./equipmentProfile";

it("formats legacy units without assuming sensor technology or changing the saved spec", () => {
  const camera = structuredClone(sampleInventory.cameras[0]);
  camera.specs.sensor = "35mm フルサイズ";
  camera.specs.continuousShooting = "約 14 コマ/秒";
  const before = structuredClone(camera);
  expect(cameraDetailSpecs(camera)).toEqual([
    ["SENSOR", "FULL FRAME"],
    ["PIXELS", "24.5 MP"],
    ["ENGINE", "EXPEED 7"],
    ["MOUNT", "NIKON Z"],
    ["BURST", "~14frames /s"],
    ["MEDIA", "SD (UHS-II) + microSD (UHS-I)"],
    ["WEIGHT", "710 g"],
    ["RELEASE", "2023"],
  ]);
  expect(camera).toEqual(before);
  camera.specs.sensor = "フルサイズ CCD";
  camera.specs.continuousShooting = "12 fps";
  expect(cameraDetailSpecs(camera)[0][1]).toBe("フルサイズ CCD");
  expect(cameraDetailSpecs(camera)[4][1]).toBe("12frames /s");
});
