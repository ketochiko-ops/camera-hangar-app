import { describe, expect, it } from "vitest";
import { prepareImage, MAX_UPLOAD_BYTES } from "./image";
describe("upload preflight", () => {
  it("rejects unsupported raster formats and SVG before decoding", async () => {
    await expect(
      prepareImage(
        new File(["<svg/>"], "photo.svg", { type: "image/svg+xml" }),
      ),
    ).rejects.toThrow(/PNG/);
  });
  it("rejects files larger than 10 MiB before decoding", async () => {
    const file = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "large.png", {
      type: "image/png",
    });
    await expect(prepareImage(file)).rejects.toThrow(/10MB/);
  });
});
