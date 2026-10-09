export const ratingLabels = {
  resolution: "RESOLUTION",
  bokeh: "BOKEH",
  lowLight: "LOW LIGHT",
  reach: "REACH",
  closeFocus: "CLOSE FOCUS",
  mobility: "MOBILITY",
  versatility: "VERSATILITY",
} as const;
export const cameraRatingLabels = {
  detail: "DETAIL",
  night: "NIGHT",
  latitude: "LATITUDE",
  response: "AF",
  stability: "STABILITY",
  endurance: "ENDURANCE",
  mobility: "MOBILITY",
} as const;
export const lensRatingLabels = ratingLabels;
export type RatingKey = keyof typeof cameraRatingLabels;
export type LensRatingKey = keyof typeof lensRatingLabels;
// Former camera scores remain available in saved data and CSV backups.
export const legacyCameraRatingKeys = [
  "resolution",
  "bokeh",
  "lowLight",
  "reach",
  "closeFocus",
  "versatility",
  "autofocus",
  "dynamicRange",
  "handling",
  "colorRendering",
] as const;
export type Ratings = Record<RatingKey, number> &
  Partial<Record<(typeof legacyCameraRatingKeys)[number], number>>;
export const cameraPartLabels = {
  grip: "GRIP",
  adapter: "MOUNT ADAPTER",
  lighting: "LIGHTING",
  other: "OTHER",
} as const;
export type PartEffects = Partial<Record<RatingKey, number>>;
export const partFeatureLabels = {
  wirelessFlash: "WIRELESS FLASH",
  flash: "FLASH",
  hss: "HIGH SPEED SYNC",
  ttl: "TTL",
} as const;
export type PartFeature = keyof typeof partFeatureLabels;
export type CameraPart = {
  kind: keyof typeof cameraPartLabels;
  name: string;
  // Omitted: use researched reference effects. {} explicitly disables all effects.
  effects?: PartEffects;
  weightGrams?: number;
  features?: PartFeature[];
};
export const MAX_CAMERA_PARTS = 8;
export const MAX_PART_NAME_LENGTH = 64;
export type Camera = {
  id: string;
  name: string;
  maker: string;
  category: string;
  role: string;
  mount: string;
  additionalParts: CameraPart[];
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
  ratings: Ratings;
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
export type Inventory = {
  version: 1;
  defaultLightingVersion?: 1;
  cameras: Camera[];
  lenses: Lens[];
  partCatalog?: CameraPart[];
  squadron?: Squadron;
};
export type LoadoutSelection = { cameraId?: string; lensId?: string };
export type Squadron = {
  leader: LoadoutSelection;
  wingmen: LoadoutSelection[];
};
export const isCamera = (item: Equipment): item is Camera => "specs" in item;
export const specLabels: Record<keyof Camera["specs"], string> = {
  sensor: "SENSOR",
  resolution: "PIXELS",
  continuousShooting: "BURST",
  ibis: "IMAGE STABILIZATION",
  weight: "WEIGHT",
  storageSlots: "MEDIA",
  autofocusNote: "AF SYSTEM",
  releaseYear: "RELEASE",
};
export const cameraDetailSpecKeys = [
  "sensor",
  "resolution",
  "continuousShooting",
  "storageSlots",
  "weight",
  "releaseYear",
] as const;
export const lensSpecLabels = {
  compatibleMounts: "COMPATIBLE MOUNTS",
  focalLength: "FOCAL LENGTH",
  maxAperture: "MAX APERTURE",
  weight: "WEIGHT",
} as const;
