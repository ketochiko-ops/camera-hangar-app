import { createContext, useContext, useState, type ReactNode } from "react";
import type { Camera, Inventory, Lens, Squadron } from "../types";
import { prepareInventory } from "../utils/loadout";
import {
  createLocalRepository,
  type InventoryRepository,
} from "../utils/storage";
import { mergeCsvImport, type CsvImport } from "../features/csv/inventoryCsv";
type InventoryContextValue = {
  data: Inventory;
  error?: string;
  saveCamera(camera: Camera): boolean;
  saveLens(lens: Lens): boolean;
  saveSquadron(squadron: Squadron): boolean;
  importCsv(batch: CsvImport): boolean;
  remove(kind: "camera" | "lens", id: string): boolean;
  clearError(): void;
};
const InventoryContext = createContext<InventoryContextValue | null>(null);
export function InventoryProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: InventoryRepository;
}) {
  const [repo] = useState(
    () => repository ?? createLocalRepository(window.localStorage),
  );
  const [initial] = useState(() => repo.load());
  const [data, setData] = useState(initial.data);
  const [error, setError] = useState(initial.error);
  const commit = (next: Inventory) => {
    try {
      const prepared = prepareInventory(data, next);
      repo.save(prepared);
      setData(prepared);
      setError(undefined);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
      return false;
    }
  };
  // Persist before updating the UI: a quota failure must never look like a successful save.
  const saveCamera = (item: Camera) =>
    commit({
      ...data,
      cameras: data.cameras.some((c) => c.id === item.id)
        ? data.cameras.map((c) => (c.id === item.id ? item : c))
        : [...data.cameras, item],
    });
  const saveLens = (item: Lens) =>
    commit({
      ...data,
      lenses: data.lenses.some((l) => l.id === item.id)
        ? data.lenses.map((l) => (l.id === item.id ? item : l))
        : [...data.lenses, item],
    });
  const remove = (kind: "camera" | "lens", id: string) =>
    commit(
      kind === "camera"
        ? { ...data, cameras: data.cameras.filter((c) => c.id !== id) }
        : { ...data, lenses: data.lenses.filter((l) => l.id !== id) },
    );
  const importCsv = (batch: CsvImport) => {
    try {
      return commit(mergeCsvImport(data, batch));
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSVを登録できません。");
      return false;
    }
  };
  return (
    <InventoryContext.Provider
      value={{
        data,
        error,
        saveCamera,
        saveLens,
        saveSquadron: (squadron) => commit({ ...data, squadron }),
        importCsv,
        remove,
        clearError: () => setError(undefined),
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}
export function useInventory() {
  const value = useContext(InventoryContext);
  if (!value) throw new Error("InventoryProvider is required");
  return value;
}
