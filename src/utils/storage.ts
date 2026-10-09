import { sampleInventory } from "../data/sample";
import { defaultCameraImageProcessor } from "../data/cameraImageProcessors";
import { validateEquipment, validCameraParts } from "./domain";
import { normalizeSquadron, validSquadron } from "./loadout";
import { migrateLegacyRatings } from "./equipmentProfile";
import {
  MAX_CAMERA_PARTS,
  specLabels,
  type Camera,
  type Inventory,
  type Lens,
} from "../types";
import { partProfile } from "./partEffects";
export const STORAGE_KEY = "optical-arsenal:inventory:v1";
export interface InventoryRepository {
  load(): { data: Inventory; error?: string };
  save(data: Inventory): void;
}
// UI depends on this contract so IndexedDB can replace this adapter in future.
export function createLocalRepository(
  storage: Pick<Storage, "getItem" | "setItem">,
): InventoryRepository {
  let readFailed = false;
  return {
    load() {
      try {
        const raw = storage.getItem(STORAGE_KEY);
        readFailed = false;
        if (raw === null) return { data: structuredClone(sampleInventory) };
        const data = JSON.parse(raw) as Inventory;
        if (
          data.version !== 1 ||
          !Array.isArray(data.cameras) ||
          !Array.isArray(data.lenses) ||
          (Object.hasOwn(data, "partCatalog") &&
            !validCameraParts(data.partCatalog, Infinity)) ||
          (Object.hasOwn(data, "squadron") && !validSquadron(data.squadron)) ||
          (Object.hasOwn(data, "defaultLightingVersion") &&
            data.defaultLightingVersion !== 1)
        )
          throw new Error("Invalid schema");
        for (const [items, camera] of [
          [data.cameras, true],
          [data.lenses, false],
        ] as const) {
          for (const item of items) {
            if (item && typeof item === "object") {
              if (
                camera &&
                "specs" in item &&
                item.specs &&
                typeof item.specs === "object" &&
                !Array.isArray(item.specs) &&
                !Object.hasOwn(item.specs, "imageProcessor")
              )
                item.specs.imageProcessor = defaultCameraImageProcessor(item);
              item.ratings = migrateLegacyRatings(
                item.ratings,
                camera,
              ) as Camera["ratings"];
              if (camera && !Object.hasOwn(item, "additionalParts"))
                (item as Camera).additionalParts = structuredClone(
                  sampleInventory.cameras.find(
                    (sample) =>
                      sample.id === item.id && sample.name === item.name,
                  )?.additionalParts ?? [],
                );
            }
          }
        }
        const valid = (items: (Camera | Lens)[], camera: boolean) =>
          items.every(
            (item) =>
              typeof item.id === "string" &&
              item.id.length > 0 &&
              "specs" in item === camera &&
              typeof item.ratings === "object" &&
              [item.name, item.maker, item.category, item.summary].every(
                (value) => typeof value === "string",
              ) &&
              (camera
                ? [
                    (item as Camera).role,
                    (item as Camera).mount,
                    ...Object.keys(specLabels).map(
                      (key) =>
                        (item as Camera).specs[key as keyof Camera["specs"]],
                    ),
                  ].every((value) => typeof value === "string")
                : [
                    (item as Lens).focalLength,
                    (item as Lens).maxAperture,
                    (item as Lens).weight,
                  ].every((value) => typeof value === "string")) &&
              (camera ||
                (Array.isArray((item as Lens).compatibleMounts) &&
                  Array.isArray((item as Lens).usageTags) &&
                  (item as Lens).usageTags.every(
                    (tag) => typeof tag === "string",
                  ) &&
                  (item as Lens).compatibleMounts.every(
                    (mount) => typeof mount === "string",
                  ))) &&
              Object.keys(validateEquipment(item)).length === 0,
          );
        if (
          !valid(data.cameras, true) ||
          !valid(data.lenses, false) ||
          new Set([...data.cameras, ...data.lenses].map((i) => i.id)).size !==
            data.cameras.length + data.lenses.length
        )
          throw new Error("Invalid records");
        if (
          [...data.cameras, ...data.lenses].some(
            (i) =>
              i.image !== undefined &&
              !/^data:image\/(png|jpeg|webp);base64,/.test(i.image),
          )
        )
          throw new Error("Invalid image");
        if (data.defaultLightingVersion !== 1) {
          for (const camera of data.cameras) {
            const defaults =
              sampleInventory.cameras
                .find(
                  (sample) =>
                    sample.id === camera.id && sample.name === camera.name,
                )
                ?.additionalParts.filter((part) => part.kind === "lighting") ??
              [];
            for (const part of defaults) {
              if (camera.additionalParts.length >= MAX_CAMERA_PARTS) break;
              if (
                !camera.additionalParts.some(
                  (existing) => partProfile(existing) === partProfile(part),
                )
              )
                camera.additionalParts.push(structuredClone(part));
            }
          }
          // Persist only with the next successful user save. Later removals stay removed.
          data.defaultLightingVersion = 1;
        }
        if (data.squadron)
          data.squadron = normalizeSquadron(data, data.squadron);
        return { data };
      } catch {
        readFailed = true;
        return {
          data: { version: 1, cameras: [], lenses: [] },
          error:
            "保存データを読み込めません。元のデータは保持しています。ブラウザの保存設定、またはデータ形式をご確認ください。",
        };
      }
    },
    save(data) {
      if (readFailed)
        throw new Error(
          "読み込めない保存データを保護するため、上書きを停止しています。元のデータをバックアップし、復旧または保存キーの削除後に再読み込みしてください。",
        );
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        throw new Error(
          "保存できません。ブラウザの保存容量または設定をご確認ください。画像を小さくして再試行できます。",
        );
      }
    },
  };
}
