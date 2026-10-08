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
  const board = page.getByTestId("detail-board");
  const ratingNames = [
    "DETAIL",
    "NIGHT",
    "LATITUDE",
    "RESPONSE",
    "STABILITY",
    "ENDURANCE",
    "MOBILITY",
  ];
  const specNames = [
    "SENSOR",
    "PIXELS",
    "MOUNT",
    "BURST",
    "MEDIA",
    "WEIGHT",
    "RELEASE",
  ];
  await expect(board.getByRole("meter")).toHaveCount(7);
  expect(
    await board
      .getByRole("meter")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("aria-label")),
      ),
  ).toEqual(ratingNames);
  expect(await board.locator("dt").allTextContents()).toEqual(specNames);
  expect(await board.locator("dd").allTextContents()).toEqual([
    "FULL FRAME CMOS",
    "24.5 MP",
    "NIKON Z",
    "14frames /s",
    "SD + microSD",
    "710 g",
    "2023",
  ]);
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
  await expect(board.getByRole("meter")).toHaveCount(7);
  expect(
    await board
      .getByRole("meter")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("aria-label")),
      ),
  ).toEqual([
    "RESOLUTION",
    "BOKEH",
    "LOW LIGHT",
    "REACH",
    "CLOSE FOCUS",
    "MOBILITY",
    "VERSATILITY",
  ]);
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
  await page.getByLabel(/^MOUNT/).fill("Personal X");
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
  await page.getByLabel(/COMPATIBLE MOUNTS/).fill("Personal X, Nikon F");
  await page.getByLabel(/FOCAL LENGTH/).fill("50 mm");
  await page.getByLabel(/MAX APERTURE/).fill("f/1.8");
  await page.getByLabel(/^WEIGHT/).fill("250 g");
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
  await page.getByLabel(/^DETAIL\b/).fill("11");
  await page.getByLabel(/^RELEASE\b/).fill("invalid");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(
    page.getByText("評価は0〜10の数値で入力してください。"),
  ).toBeVisible();
  await expect(
    page.getByText("発売年は1800〜2199の整数で入力してください。"),
  ).toBeVisible();
  await page.getByLabel(/^DETAIL\b/).fill("8");
  await page.getByLabel(/^RELEASE\b/).fill("2023");
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
  const first = page
    .getByRole("dialog", { name: "機材を比較" })
    .locator("article")
    .first();
  expect(
    await first
      .getByRole("meter")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("aria-label")),
      ),
  ).toEqual([
    "DETAIL",
    "NIGHT",
    "LATITUDE",
    "RESPONSE",
    "STABILITY",
    "ENDURANCE",
    "MOBILITY",
  ]);
  expect(await first.locator("dt").allTextContents()).toEqual([
    "SENSOR",
    "PIXELS",
    "MOUNT",
    "BURST",
    "MEDIA",
    "WEIGHT",
    "RELEASE",
  ]);
  await expect(first.getByText("14frames /s", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("legacy saved scores remain usable and new scores persist after editing", async ({
  page,
}) => {
  const inventory = await import("../src/data/sample").then((module) =>
    structuredClone(module.sampleInventory),
  );
  Object.assign(inventory.cameras[0], {
    ratings: {
      resolution: 7.5,
      highIso: 9,
      autofocus: 8,
      dynamicRange: 7,
      handling: 6,
      portability: 5,
      colorRendering: 4,
    },
  });
  const raw = JSON.stringify(inventory);
  await page.evaluate(
    (value) => localStorage.setItem("optical-arsenal:inventory:v1", value),
    raw,
  );
  await page.reload();
  const board = page.getByTestId("detail-board");
  await expect(
    board.getByRole("meter", { name: "NIGHT", exact: true }),
  ).toHaveAttribute("aria-valuenow", "9");
  await expect(
    board.getByRole("meter", { name: "STABILITY", exact: true }),
  ).toHaveAttribute("aria-valuenow", "0");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("optical-arsenal:inventory:v1"),
    ),
  ).toBe(raw);
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  await page.getByLabel(/^STABILITY\b/).fill("7.5");
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("optical-arsenal:inventory:v1")!)
        .cameras[0],
  );
  expect(saved.ratings).toMatchObject({
    stability: 7.5,
    night: 9,
    latitude: 7,
    response: 8,
    mobility: 5,
    autofocus: 8,
  });
});
for (const labelMode of ["english", "bilingual"] as const)
  for (const view of ["camera", "lens"] as const)
    for (const [ratio, width, height] of [
      ["16:9", 1600, 900],
      ["1:1", 1200, 1200],
      ["4:5", 1200, 1500],
    ] as const) {
      test(`${view} exports real PNG ${ratio} with ${labelMode} labels`, async ({
        page,
      }) => {
        const firstLabel = view === "camera" ? "DETAIL" : "RESOLUTION";
        const formattedFirstLabel =
          labelMode === "bilingual" ? `${firstLabel} / 解像性能` : firstLabel;
        if (view === "lens")
          await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
        await page
          .getByRole("combobox", { name: "項目名の表示" })
          .selectOption(labelMode);
        await expect(
          page.getByTestId("detail-board").getByRole("meter", {
            name: formattedFirstLabel,
            exact: true,
          }),
        ).toBeVisible();
        await page.getByLabel("出力サイズ").selectOption(ratio);
        // Hold font readiness so the export layout can be checked before capture.
        await page.evaluate(() => {
          const ready = document.fonts.ready;
          let release!: () => void;
          const held = new Promise<void>((resolve) => {
            release = resolve;
          });
          Object.defineProperty(document.fonts, "ready", {
            value: Promise.all([ready, held]),
            configurable: true,
          });
          (
            window as unknown as Window & { releaseExportFonts(): void }
          ).releaseExportFonts = release;
        });
        const promise = page.waitForEvent("download");
        await page
          .getByRole("button", { name: "PNG出力", exact: true })
          .click();
        const exportBoard = page.locator(
          '[aria-hidden="true"] [data-testid="detail-board"]',
        );
        await expect(
          exportBoard.locator('[role="meter"]').first(),
        ).toHaveAttribute("aria-label", formattedFirstLabel);
        await expect(
          page.getByRole("combobox", { name: "項目名の表示" }),
        ).toBeDisabled();
        const contentFits = await exportBoard.evaluate((node) => {
          const details = node.querySelector("dl")!.parentElement!;
          const bottom =
            details.getBoundingClientRect().bottom -
            parseFloat(getComputedStyle(details).paddingBottom);
          return Array.from(details.querySelectorAll('dt, dd, [role="meter"]'))
            .filter(
              (element) => element.getBoundingClientRect().bottom > bottom + 1,
            )
            .map((element) => ({
              label: element.textContent,
              bottom: element.getBoundingClientRect().bottom,
              limit: bottom,
            }));
        });
        await page.evaluate(() =>
          (
            window as unknown as Window & { releaseExportFonts(): void }
          ).releaseExportFonts(),
        );
        const download = await promise;
        expect(
          contentFits,
          `${view} ${ratio} ${labelMode} labels fit inside the detail panel`,
        ).toEqual([]);
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
test("label mode persists across reloads and works for cameras, lenses, comparison and CSV", async ({
  page,
}) => {
  const selector = page.getByRole("combobox", { name: "項目名の表示" });
  await expect(selector).toHaveValue("english");
  await selector.selectOption("bilingual");
  const board = page.getByTestId("detail-board");
  await expect(
    board.getByRole("meter", { name: "NIGHT / 低照度性能" }),
  ).toBeVisible();
  await expect(
    board.getByText("MEDIA / 記録メディア", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Nikon Z fを比較に追加").check();
  await page.getByLabel("Nikon Z fcを比較に追加").check();
  await page.getByRole("button", { name: "比較 2/3" }).click();
  const comparison = page.getByRole("dialog", { name: "機材を比較" });
  await expect(
    comparison.getByText("PIXELS / 画素数", { exact: true }),
  ).toHaveCount(2);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
  await expect(
    board.getByText("FOCAL LENGTH / 焦点距離", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(selector).toHaveValue("bilingual");
  await page.getByRole("button", { name: /データ管理/ }).click();
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  await expect(
    page.getByLabel("BURST / 連写速度", { exact: true }),
  ).toHaveValue("14frames /s");
  await expect(
    page.getByLabel("STABILITY / 手ぶれ補正性能", { exact: true }),
  ).toHaveValue("0");
  await page.getByRole("button", { name: "キャンセル" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSVテンプレート" }).click();
  const header = await readFile((await (await download).path())!, "utf8");
  expect(header).toContain("rating_night");
  expect(header).not.toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("optical-arsenal:inventory:v1"),
    ),
  ).toBeNull();
  await selector.selectOption("english");
  await page.getByRole("button", { name: /CAMERA SELECT/ }).click();
  await expect(
    board.getByRole("meter", { name: "NIGHT", exact: true }),
  ).toBeVisible();
  await expect(
    board.getByText("SENSOR / センサー", { exact: true }),
  ).toHaveCount(0);
});
test("tablet and phone do not overflow horizontally in either label mode", async ({
  page,
}) => {
  for (const mode of ["english", "bilingual"]) {
    await page
      .getByRole("combobox", { name: "項目名の表示" })
      .selectOption(mode);
    for (const width of [1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId("detail-board")).toBeVisible();
      await expect(
        page.getByRole("combobox", { name: "項目名の表示" }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
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
