import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { sampleInventory } from "../src/data/sample";
import {
  exportEquipmentCsv,
  mergeCsvImport,
  parseEquipmentCsv,
} from "../src/features/csv/inventoryCsv";

const photo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
for (const kind of ["camera", "lens"] as const) {
  test(`${kind} CSV download, preview, update and addition persist with photos`, async ({
    page,
  }) => {
    const data = structuredClone(sampleInventory);
    const items = kind === "camera" ? data.cameras : data.lenses;
    items[0].image = photo;
    await page.goto("/");
    await page.evaluate(
      (inventory) =>
        localStorage.setItem(
          "optical-arsenal:inventory:v1",
          JSON.stringify(inventory),
        ),
      data,
    );
    await page.reload();
    await page.getByRole("button", { name: /データ管理/ }).click();
    if (kind === "lens")
      await page.getByRole("button", { name: /^LENSES/ }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "CSV出力", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(
      kind === "camera" ? "cameras.csv" : "lenses.csv",
    );
    const exported = await readFile((await download.path())!, "utf8");
    const parsed = parseEquipmentCsv(exported, kind);
    expect(parsed.issues).toEqual([]);
    expect(parsed.items).toHaveLength(items.length);
    expect(exported).not.toContain("data:image");
    const updated = {
      ...items[0],
      name: `CSV Updated ${kind}`,
      summary: '調査結果, "確認済み"\n改行も保持',
    };
    const added = { ...items[1], id: "", name: `CSV New ${kind}` };
    await page
      .getByLabel(kind === "camera" ? "カメラCSVファイル" : "レンズCSVファイル")
      .setInputFiles({
        name: `${kind}.csv`,
        mimeType: "text/csv",
        buffer: Buffer.from(exportEquipmentCsv(kind, [updated, added])),
      });
    const dialog = page.getByRole("dialog", { name: "CSV読み込みの確認" });
    await expect(dialog.getByText(/追加 1件 ／ 更新 1件/)).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("optical-arsenal:inventory:v1")!)
            .cameras.length,
      ),
    ).toBe(data.cameras.length);
    await dialog.getByRole("button", { name: "2件を登録する" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("heading", { name: added.name })).toBeVisible();
    await page.reload();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("optical-arsenal:inventory:v1")!),
    );
    const saved = kind === "camera" ? stored.cameras : stored.lenses;
    expect(saved).toHaveLength(items.length + 1);
    expect(
      saved.find((item: { id: string }) => item.id === updated.id),
    ).toMatchObject({
      name: updated.name,
      summary: updated.summary,
      image: photo,
    });
    expect(kind === "camera" ? stored.lenses : stored.cameras).toEqual(
      kind === "camera" ? data.lenses : data.cameras,
    );
  });
}

test("invalid CSV and cancellation leave the archive unchanged; templates and prompts are usable", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /データ管理/ }).click();
  const items = structuredClone(sampleInventory.cameras.slice(0, 2));
  items[1].ratings.detail = 11;
  await page.getByLabel("カメラCSVファイル").setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(exportEquipmentCsv("camera", items)),
  });
  const invalid = page.getByRole("dialog", {
    name: "CSVの内容を修正してください",
  });
  await expect(invalid.getByText(/4行目.*rating_detail/)).toBeVisible();
  await expect(
    invalid.getByRole("button", { name: /件を登録する/ }),
  ).toHaveCount(0);
  await invalid
    .getByRole("button", { name: "閉じる", exact: true })
    .last()
    .click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("optical-arsenal:inventory:v1"),
    ),
  ).toBeNull();
  items[1].ratings.detail = 8;
  await page.getByLabel("カメラCSVファイル").setInputFiles({
    name: "valid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(exportEquipmentCsv("camera", items)),
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "キャンセル" })
    .click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("optical-arsenal:inventory:v1"),
    ),
  ).toBeNull();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSVテンプレート" }).click();
  const template = await readFile(
    (await (await downloadPromise).path())!,
    "utf8",
  );
  expect(template).toContain("rating_detail");
  await page.getByText("ChatGPTで登録CSVを作る", { exact: true }).click();
  await expect(page.getByLabel("カメラCSV作成の依頼文")).toHaveValue(
    /name,maker,category/,
  );
  await expect(page.getByLabel("カメラCSV作成の依頼文")).toHaveValue(
    /rating_responseはAF性能/,
  );
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("supplied handheld CSV adds 13 lenses, updates 3, and retains old photos and squadron selections", async ({
  page,
}) => {
  const oldCsv = await readFile(
    "src/data/defaults/lenses_corrected.csv",
    "utf8",
  );
  const data = mergeCsvImport(
    { ...structuredClone(sampleInventory), lenses: [] },
    parseEquipmentCsv(oldCsv, "lens"),
  );
  data.lenses[0].image = photo;
  data.squadron = {
    leader: { cameraId: "nikon-zf", lensId: "dx35" },
    wingmen: [],
  };
  await page.goto("/");
  await page.evaluate(
    (inventory) =>
      localStorage.setItem(
        "optical-arsenal:inventory:v1",
        JSON.stringify(inventory),
      ),
    data,
  );
  await page.reload();
  await page.getByRole("button", { name: /データ管理/ }).click();
  await page.getByRole("button", { name: /^LENSES/ }).click();
  await page
    .getByLabel("レンズCSVファイル")
    .setInputFiles("src/data/defaults/lenses_handheld_corrected_v2.csv");
  const dialog = page.getByRole("dialog", { name: "CSV読み込みの確認" });
  await expect(dialog.getByText(/追加 13件 ／ 更新 3件/)).toBeVisible();
  await dialog
    .getByRole("button", { name: "16件を登録する", exact: true })
    .click();
  await page.reload();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("optical-arsenal:inventory:v1")!),
  );
  expect(stored.lenses).toHaveLength(20);
  expect(
    stored.lenses.find((lens: { id: string }) => lens.id === "dx35"),
  ).toMatchObject({ image: photo, ratings: { resolution: 7, bokeh: 6.5 } });
  expect(stored.squadron).toEqual(data.squadron);
  await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
  await expect(
    page.getByRole("button", {
      name: "NIKKOR-H Auto 2.8cm F3.5を選択",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByLabel("使用カメラ").selectOption("canon-5d");
  await expect(
    page.getByRole("button", { name: "EF50mm F1.8 STMを選択", exact: true }),
  ).toBeVisible();
  await page.getByLabel("使用カメラ").selectOption("fuji-xt5");
  await expect(
    page.getByRole("button", {
      name: "FUJINON XF18-55mmF2.8-4 R LM OISを選択",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "GIZMON Utulens 32mm F16を選択", exact: true })
    .click();
  const board = page.getByTestId("detail-board");
  await expect(
    board.getByRole("definition").filter({ hasText: /^f\/16 fixed$/ }),
  ).toBeVisible();
  await expect(
    board.getByRole("meter", { name: "RESOLUTION", exact: true }),
  ).toHaveAttribute("aria-valuenow", "1.5");
});
