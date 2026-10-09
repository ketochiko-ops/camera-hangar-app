import type { Camera } from "../types";

// Manufacturer specifications and sources: docs/image-processors.md.
export const cameraImageProcessors: Record<
  string,
  { name: string; value: string }
> = {
  "nikon-zf": { name: "Nikon Z f", value: "EXPEED 7" },
  "nikon-zfc": { name: "Nikon Z fc", value: "EXPEED 6" },
  "nikon-d7500": { name: "Nikon D7500", value: "EXPEED 5" },
  "canon-5d": { name: "Canon EOS 5D Mark IV", value: "DIGIC 6+" },
  "sony-a7r": { name: "SONY α7R IIIA", value: "BIONZ X" },
  "fuji-xt5": { name: "FUJIFILM X-T5", value: "X-Processor 5" },
};

export function defaultCameraImageProcessor(
  camera: Pick<Camera, "id" | "name">,
) {
  const reference = Object.hasOwn(cameraImageProcessors, camera.id)
    ? cameraImageProcessors[camera.id]
    : undefined;
  return reference?.name === camera.name ? reference.value : "";
}
