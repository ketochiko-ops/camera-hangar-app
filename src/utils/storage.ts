import { sampleInventory } from "../data/sample";
import { validateEquipment } from "./domain";
import { specLabels, type Camera, type Inventory, type Lens } from "../types";
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
          !Array.isArray(data.lenses)
        )
          throw new Error("Invalid schema");
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
