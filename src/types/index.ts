export const cameraRatingLabels = {
  resolution: "RESOLUTION / 解像力",
  highIso: "HIGH ISO / 高感度",
  autofocus: "AUTOFOCUS / AF性能",
  dynamicRange: "DYNAMIC RANGE / 階調",
  handling: "HANDLING / 操作性",
  portability: "PORTABILITY / 携帯性",
  colorRendering: "COLOR / 色再現",
} as const;
export const lensRatingLabels = {
  sharpness: "SHARPNESS / 解像力",
  portability: "PORTABILITY / 携帯性",
  versatility: "VERSATILITY / 汎用性",
  lowLight: "LOW LIGHT / 暗所性能",
  closeUp: "CLOSE UP / 近接性能",
  backgroundBlur: "BOKEH / ボケ量",
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
  sensor: "センサー",
  resolution: "有効画素数",
  continuousShooting: "連続撮影",
  ibis: "手ぶれ補正",
  weight: "重量",
  storageSlots: "記録メディア",
  autofocusNote: "AFシステム",
  releaseYear: "発売年",
};
