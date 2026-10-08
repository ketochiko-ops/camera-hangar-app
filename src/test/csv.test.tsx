import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InventoryProvider } from "../context/InventoryContext";
import { CsvTransfer } from "../components/CsvTransfer";
import { sampleInventory } from "../data/sample";
import { exportEquipmentCsv } from "../features/csv/inventoryCsv";

function csvFile(text: string) {
  const file = new File([text], "cameras.csv", { type: "text/csv" });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new TextEncoder().encode(text).buffer,
  });
  return file;
}
describe("CSV import persistence", () => {
  it("waits for confirmation, then saves the entire batch once", async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    render(
      <InventoryProvider
        repository={{
          load: () => ({ data: structuredClone(sampleInventory) }),
          save,
        }}
      >
        <CsvTransfer kind="camera" />
      </InventoryProvider>,
    );
    const items = sampleInventory.cameras
      .slice(0, 2)
      .map((item) => ({ ...item, name: `${item.name} updated` }));
    await user.upload(
      screen.getByLabelText("カメラCSVファイル"),
      csvFile(exportEquipmentCsv("camera", items)),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "CSV読み込みの確認",
    });
    expect(save).not.toHaveBeenCalled();
    await user.click(
      within(dialog).getByRole("button", { name: "2件を登録する" }),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].cameras[0].name).toBe(items[0].name);
    expect(save.mock.calls[0][0].cameras[1].name).toBe(items[1].name);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("keeps the preview and existing data if storage fails", async () => {
    const user = userEvent.setup();
    const initial = structuredClone(sampleInventory);
    const save = vi.fn(() => {
      throw new Error("保存容量不足");
    });
    render(
      <InventoryProvider repository={{ load: () => ({ data: initial }), save }}>
        <CsvTransfer kind="camera" />
      </InventoryProvider>,
    );
    await user.upload(
      screen.getByLabelText("カメラCSVファイル"),
      csvFile(
        exportEquipmentCsv("camera", [
          { ...initial.cameras[0], name: "Changed" },
        ]),
      ),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "CSV読み込みの確認",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "1件を登録する" }),
    );
    expect(within(dialog).getByRole("alert")).toHaveTextContent("保存容量不足");
    expect(initial.cameras[0].name).toBe("Nikon Z f");
    expect(screen.queryByText(/CSVを登録しました/)).not.toBeInTheDocument();
  });
});
