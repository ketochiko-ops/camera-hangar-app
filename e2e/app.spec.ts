import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function openManagement(page: Page) {
  await page.getByRole("button", { name: /データ管理/ }).click();
}
async function fillBase(page: Page, name: string) {
  await page.getByLabel(/機材名/).fill(name);
  await page.getByLabel(/メーカー/).fill("Personal");
  await page.getByLabel(/^カテゴリ/).fill("Original");
  await page.getByLabel(/説明・機材メモ/).fill("私の機材。撮影用のメモ。");
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("sample cameras, selection and compatible lens flow", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "Nikon Z fを選択" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "FUJIFILM X-T5を選択" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nikon D7500を選択" }).click();
  await expect(
    page
      .getByTestId("detail-board")
      .getByRole("heading", { name: "Nikon D7500" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
  await expect(
    page.getByRole("button", { name: "NIKKOR Z 40mm f/2を選択" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "AF-S DX Micro 40mm f/2.8Gを選択" })
    .click();
  await expect(
    page
      .getByTestId("detail-board")
      .getByRole("heading", { name: "AF-S DX Micro 40mm f/2.8G" }),
  ).toBeVisible();
  await page.getByLabel("対応レンズのみ表示").uncheck();
  await expect(
    page.getByRole("button", { name: "NIKKOR Z 40mm f/2を選択" }),
  ).toBeVisible();
  await page.getByLabel("使用カメラ").selectOption("canon-5d");
  await page.getByLabel("対応レンズのみ表示").check();
  await expect(
    page.getByRole("heading", { name: "表示できるレンズがありません" }),
  ).toBeVisible();
});
test("camera and lens CRUD persist across reload", async ({ page }) => {
  await openManagement(page);
  await page.getByRole("button", { name: "カメラを追加" }).click();
  await fillBase(page, "My Camera");
  await page.getByLabel(/^マウント/).fill("Personal X");
  await page.getByRole("button", { name: "保存する" }).click();
  await page.getByRole("button", { name: /CAMERA SELECT/ }).click();
  await page.getByRole("button", { name: "My Cameraを選択" }).click();
  await expect(
    page
      .getByTestId("detail-board")
      .getByRole("heading", { name: "My Camera" }),
  ).toBeVisible();
  await openManagement(page);
  await page.getByRole("button", { name: /^LENSES/ }).click();
  await page.getByRole("button", { name: "レンズを追加" }).click();
  await fillBase(page, "My Lens");
  await page.getByLabel(/対応マウント/).fill("Personal X, Nikon F");
  await page.getByLabel(/焦点距離/).fill("50 mm");
  await page.getByLabel(/開放F値/).fill("f/1.8");
  await page.getByLabel(/^重量/).fill("250 g");
  await page.getByRole("button", { name: "保存する" }).click();
  await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
  await page.getByRole("button", { name: "My Lensを選択" }).click();
  await expect(
    page.getByTestId("detail-board").getByRole("heading", { name: "My Lens" }),
  ).toBeVisible();
  await page.reload();
  await openManagement(page);
  await page.getByRole("button", { name: "My Cameraを編集" }).click();
  await page.getByLabel(/機材名/).fill("Updated Camera");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(
    page.getByRole("heading", { name: "Updated Camera" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^LENSES/ }).click();
  await page.getByRole("button", { name: "My Lensを編集" }).click();
  await page.getByLabel(/機材名/).fill("Updated Lens");
  await page.getByRole("button", { name: "保存する" }).click();
  await page.getByRole("button", { name: "Updated Lensを削除" }).click();
  await page.getByRole("button", { name: "削除する", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Updated Lens" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: /^CAMERAS/ }).click();
  await page.getByRole("button", { name: "Updated Cameraを削除" }).click();
  await page.getByRole("button", { name: "削除する", exact: true }).click();
  await page.reload();
  await openManagement(page);
  await expect(
    page.getByRole("heading", { name: "Updated Camera" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /^LENSES/ }).click();
  await expect(page.getByRole("heading", { name: "Updated Lens" })).toHaveCount(
    0,
  );
});
test("form errors and local photo upload", async ({ page }) => {
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  await page.getByLabel("RESOLUTION / 解像力").fill("11");
  await page.getByLabel("発売年").fill("invalid");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(
    page.getByText("評価は0〜10の数値で入力してください。"),
  ).toBeVisible();
  await expect(
    page.getByText("発売年は1800〜2199の整数で入力してください。"),
  ).toBeVisible();
  await page.getByLabel("RESOLUTION / 解像力").fill("8");
  await page.getByLabel("発売年").fill("2023");
  await page.getByLabel("機材画像をアップロード").setInputFiles({
    name: "invalid.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(
    page.getByText("PNG / JPEG / WebP画像を選んでください。"),
  ).toBeVisible();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  await page.getByLabel("機材画像をアップロード").setInputFiles({
    name: "my-photo.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(
    page.getByRole("dialog").getByRole("img", { name: "Nikon Z fの写真" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  await expect(
    page
      .getByTestId("detail-board")
      .getByRole("img", { name: "Nikon Z fの写真" }),
  ).toBeVisible();
});
test("compares up to three cameras", async ({ page }) => {
  await page.getByLabel("Nikon Z fを比較に追加").check();
  await page.getByLabel("Nikon Z fcを比較に追加").check();
  await page.getByLabel("Nikon D7500を比較に追加").check();
  await expect(page.getByLabel("FUJIFILM X-T5を比較に追加")).toBeDisabled();
  await page.getByRole("button", { name: "比較 3/3" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "機材を比較" })
      .getByRole("heading", { name: "Nikon Z f", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
for (const view of ["camera", "lens"] as const)
  for (const [ratio, width, height] of [
    ["16:9", 1600, 900],
    ["1:1", 1200, 1200],
    ["4:5", 1200, 1500],
  ] as const) {
    test(`${view} exports real PNG ${ratio}`, async ({ page }) => {
      if (view === "lens")
        await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
      await page.getByLabel("出力サイズ").selectOption(ratio);
      const promise = page.waitForEvent("download");
      await page.getByRole("button", { name: "PNG出力", exact: true }).click();
      const download = await promise;
      expect(download.suggestedFilename()).toMatch(/\.png$/);
      const path = await download.path();
      expect(path).toBeTruthy();
      const data = await readFile(path!);
      expect(data.subarray(1, 4).toString()).toBe("PNG");
      expect(data.readUInt32BE(16)).toBe(width);
      expect(data.readUInt32BE(20)).toBe(height);
      expect(data.length).toBeGreaterThan(10000);
      await expect(page.getByText("PNGを保存しました。")).toBeVisible();
      // Decode the image in a browser to ensure the download is readable raster data.
      const decoded = await page.evaluate(async (base64) => {
        const img = new Image();
        img.src = `data:image/png;base64,${base64}`;
        await img.decode();
        return [img.naturalWidth, img.naturalHeight];
      }, data.toString("base64"));
      expect(decoded).toEqual([width, height]);
    });
  }
test("tablet and phone do not overflow horizontally", async ({ page }) => {
  for (const width of [1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByTestId("detail-board")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
test("empty archive remains empty after deleting all cameras", async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem(
      "optical-arsenal:inventory:v1",
      JSON.stringify({ version: 1, cameras: [], lenses: [] }),
    ),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "カメラが登録されていません" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Nikon Z fを選択" }),
  ).toHaveCount(0);
});
