export const cameraRatingLabels = {
  resolution: "RESOLUTION",
  highIso: "HIGH ISO",
  autofocus: "AUTOFOCUS",
  dynamicRange: "DYNAMIC RANGE",
  handling: "HANDLING",
  portability: "PORTABILITY",
  colorRendering: "COLOR",
} as const;
export const lensRatingLabels = {
  sharpness: "SHARPNESS",
  portability: "PORTABILITY",
  versatility: "VERSATILITY",
  lowLight: "LOW LIGHT",
  closeUp: "CLOSE UP",
  backgroundBlur: "BOKEH",
} as const;
export type RatingKey = keyof typeof cameraRatingLabels;
export type LensRatingKey = keyof typeof lensRatingLabels;
export type Camera = {
  id: string;
  name: string;
  maker: string;
  category: string;
  role: string;
  mount: string;
  image?: string;
  summary: string;
  specs: {
    sensor: string;
    resolution: string;
    continuousShooting: string;
    ibis: string;
    weight: string;
    storageSlots: string;
    autofocusNote: string;
    releaseYear: string;
  };
  ratings: Record<RatingKey, number>;
};
export type Lens = {
  id: string;
  name: string;
  maker: string;
  compatibleMounts: string[];
  category: string;
  image?: string;
  focalLength: string;
  maxAperture: string;
  weight: string;
  summary: string;
  usageTags: string[];
  ratings: Record<LensRatingKey, number>;
};
export type Equipment = Camera | Lens;
export type EquipmentKind = "camera" | "lens";
export type Inventory = { version: 1; cameras: Camera[]; lenses: Lens[] };
export const isCamera = (item: Equipment): item is Camera => "specs" in item;
export const specLabels: Record<keyof Camera["specs"], string> = {
  sensor: "SENSOR",
  resolution: "EFFECTIVE PIXELS",
  continuousShooting: "BURST RATE",
  ibis: "IMAGE STABILIZATION",
  weight: "WEIGHT",
  storageSlots: "STORAGE MEDIA",
  autofocusNote: "AF SYSTEM",
  releaseYear: "RELEASE YEAR",
};
export const lensSpecLabels = {
  compatibleMounts: "COMPATIBLE MOUNTS",
  focalLength: "FOCAL LENGTH",
  maxAperture: "MAX APERTURE",
  weight: "WEIGHT",
} as const;
