import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { App } from "../App";
import { InventoryProvider } from "../context/InventoryContext";
import { RatingBars } from "../components/RatingBars";
import { createLocalRepository } from "../utils/storage";
import { sampleInventory } from "../data/sample";
import { LABEL_MODE_KEY } from "../context/LabelModeContext";
import { STORAGE_KEY } from "../utils/storage";
describe("UI integration", () => {
  it("switches detail, comparison and editor labels, remembers the choice, and keeps equipment data unchanged", async () => {
    const user = userEvent.setup();
    const inventory = JSON.stringify(sampleInventory);
    localStorage.setItem(STORAGE_KEY, inventory);
    const app = () => (
      <InventoryProvider>
        <App />
      </InventoryProvider>
    );
    let view = render(app());
    const selector = screen.getByRole("combobox", { name: "項目名の表示" });
    expect(selector).toHaveValue("english");
    await user.selectOptions(selector, "bilingual");
    expect(
      within(screen.getByTestId("detail-board")).getByRole("meter", {
        name: "NIGHT / 低照度性能",
      }),
    ).toBeVisible();
    expect(screen.getByRole("meter", { name: "AF / AF性能" })).toHaveAttribute(
      "aria-valuenow",
      "9",
    );
    expect(
      within(screen.getByTestId("detail-board")).getByText("PIXELS / 画素数"),
    ).toBeVisible();
    await user.click(screen.getByLabelText("Nikon Z fを比較に追加"));
    await user.click(screen.getByLabelText("Nikon Z fcを比較に追加"));
    await user.click(screen.getByRole("button", { name: "比較 2/3" }));
    expect(
      within(screen.getByRole("dialog")).getAllByText("SENSOR / センサー"),
    ).toHaveLength(2);
    expect(
      within(screen.getByRole("dialog")).getAllByRole("meter", {
        name: "AF / AF性能",
      }),
    ).toHaveLength(2);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "閉じる",
      }),
    );
    await user.click(screen.getByRole("button", { name: /データ管理/ }));
    await user.click(screen.getByRole("button", { name: "Nikon Z fを編集" }));
    expect(screen.getByLabelText("STABILITY / 手ぶれ補正性能")).toHaveValue(9);
    expect(screen.getByLabelText("AF / AF性能")).toHaveValue(9);
    expect(screen.getByLabelText("PIXELS / 画素数")).toHaveValue("24.5 MP");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    await user.click(screen.getByRole("button", { name: /^LENSES/ }));
    await user.click(
      screen.getByRole("button", { name: "NIKKOR Z 40mm f/2を編集" }),
    );
    expect(screen.getByLabelText(/^FOCAL LENGTH \/ 焦点距離/)).toHaveValue(
      "40 mm",
    );
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    view.unmount();
    view = render(app());
    expect(screen.getByRole("combobox", { name: "項目名の表示" })).toHaveValue(
      "bilingual",
    );
    expect(
      screen.getByRole("meter", { name: "MOBILITY / 携行性" }),
    ).toBeVisible();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "項目名の表示" }),
      "english",
    );
    expect(screen.getByRole("meter", { name: "MOBILITY" })).toBeVisible();
    expect(screen.queryByText("SENSOR / センサー")).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(inventory);
    expect(localStorage.getItem(LABEL_MODE_KEY)).toBe("english");
  });
  it("allows label switching even when browser preference storage is unavailable", async () => {
    const read = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("Storage blocked");
      });
    const write = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage blocked");
      });
    try {
      const user = userEvent.setup();
      render(
        <InventoryProvider
          repository={{ load: () => ({ data: sampleInventory }), save() {} }}
        >
          <App />
        </InventoryProvider>,
      );
      await user.selectOptions(
        screen.getByRole("combobox", { name: "項目名の表示" }),
        "bilingual",
      );
      expect(
        screen.getByRole("meter", { name: "STABILITY / 手ぶれ補正性能" }),
      ).toBeVisible();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } finally {
      read.mockRestore();
      write.mockRestore();
    }
  });
  it("renders accessible horizontal rating bars", () => {
    render(
      <RatingBars
        ratings={{ resolution: 7.5 }}
        labels={{ resolution: "解像力" }}
      />,
    );
    expect(screen.getByRole("meter", { name: "解像力" })).toHaveAttribute(
      "aria-valuenow",
      "7.5",
    );
    expect(screen.getByText("7.5")).toBeVisible();
  });
  it("selects cameras and filters mount-compatible lenses", async () => {
    const user = userEvent.setup();
    render(
      <InventoryProvider>
        <App />
      </InventoryProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Nikon D7500を選択" }));
    expect(
      within(screen.getByTestId("detail-board")).getByRole("heading", {
        name: "Nikon D7500",
      }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: /LENS.*LOADOUT/ }));
    expect(
      screen.getByRole("button", { name: "AF-S DX 35mm f/1.8Gを選択" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "NIKKOR Z 40mm f/2を選択" }),
    ).not.toBeInTheDocument();
  });
  it("blocks invalid save, then persists a new camera", async () => {
    const user = userEvent.setup();
    render(
      <InventoryProvider>
        <App />
      </InventoryProvider>,
    );
    await user.click(screen.getByRole("button", { name: /データ管理/ }));
    await user.click(screen.getByRole("button", { name: "カメラを追加" }));
    await user.click(screen.getByRole("button", { name: "保存する" }));
    expect(
      screen.getAllByText("必須項目を入力してください。").length,
    ).toBeGreaterThan(0);
    await user.type(screen.getByLabelText(/機材名/), "Test Camera");
    await user.type(screen.getByLabelText(/メーカー/), "Test");
    await user.type(screen.getByLabelText(/^カテゴリ/), "Mirrorless");
    await user.type(screen.getByLabelText(/^MOUNT/), "Test Mount");
    await user.type(screen.getByLabelText(/説明・機材メモ/), "My camera");
    await user.click(screen.getByRole("button", { name: "保存する" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      createLocalRepository(localStorage).load().data.cameras.at(-1)?.name,
    ).toBe("Test Camera");
  });
  it("shows a save error and retains the editor when quota is exhausted", async () => {
    const user = userEvent.setup();
    render(
      <InventoryProvider
        repository={{
          load: () => ({ data: sampleInventory }),
          save: () => {
            throw new Error("保存容量不足");
          },
        }}
      >
        <App />
      </InventoryProvider>,
    );
    await user.click(screen.getByRole("button", { name: /データ管理/ }));
    await user.click(screen.getByRole("button", { name: "Nikon Z fを編集" }));
    await user.click(screen.getByRole("button", { name: "保存する" }));
    expect(
      within(screen.getByRole("dialog")).getByText("保存容量不足"),
    ).toBeVisible();
  });
  it("preserves commas while typing multiple lens mounts and tags", async () => {
    const user = userEvent.setup();
    render(
      <InventoryProvider>
        <App />
      </InventoryProvider>,
    );
    await user.click(screen.getByRole("button", { name: /データ管理/ }));
    await user.click(screen.getByRole("button", { name: /^LENSES/ }));
    await user.click(
      screen.getByRole("button", { name: "NIKKOR Z 40mm f/2を編集" }),
    );
    const mounts = screen.getByLabelText(/COMPATIBLE MOUNTS/);
    await user.clear(mounts);
    await user.type(mounts, "Nikon Z, Nikon F");
    expect(mounts).toHaveValue("Nikon Z, Nikon F");
    const tags = screen.getByLabelText(/用途タグ/);
    await user.clear(tags);
    await user.type(tags, "street, portrait, street");
    await user.click(screen.getByRole("button", { name: "保存する" }));
    const saved = createLocalRepository(localStorage)
      .load()
      .data.lenses.find((l) => l.id === "z40");
    expect(saved?.compatibleMounts).toEqual(["Nikon Z", "Nikon F"]);
    expect(saved?.usageTags).toEqual(["street", "portrait"]);
  });
});
