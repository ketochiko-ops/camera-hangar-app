import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { App } from "../App";
import { InventoryProvider } from "../context/InventoryContext";
import { RatingBars } from "../components/RatingBars";
import { createLocalRepository } from "../utils/storage";
import { sampleInventory } from "../data/sample";
describe("UI integration", () => {
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
    await user.type(screen.getByLabelText(/^マウント/), "Test Mount");
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
    const mounts = screen.getByLabelText(/対応マウント/);
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
