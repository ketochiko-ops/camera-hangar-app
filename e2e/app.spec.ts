import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { sampleInventory } from "../src/data/sample";
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
  // Keep the original camera/adapter flows independent of the new lighting defaults.
  const baseline = structuredClone(sampleInventory);
  baseline.cameras.forEach(
    (camera) =>
      (camera.additionalParts = camera.additionalParts.filter(
        (part) => part.kind !== "lighting",
      )),
  );
  await page.addInitScript((data) => {
    if (localStorage.getItem("optical-arsenal:inventory:v1") === null)
      localStorage.setItem(
        "optical-arsenal:inventory:v1",
        JSON.stringify(data),
      );
  }, baseline);
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
    "AF",
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
    "FULL FRAME BSI CMOS",
    "24.5 MP",
    "NIKON Z + NIKON F",
    "14 fps (高速連続撮影・拡張) / 30 fps (C30)",
    "SD (UHS-II) + microSD (UHS-I)",
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
    .getByRole("button", { name: "AF-S DX Micro NIKKOR 40mm f/2.8Gを選択" })
    .click();
  await expect(
    page
      .getByTestId("detail-board")
      .getByRole("heading", { name: "AF-S DX Micro NIKKOR 40mm f/2.8G" }),
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
    "AF",
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
  await expect(
    first.getByText("14 fps (高速連続撮影・拡張) / 30 fps (C30)", {
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("camera parts can be added, validated, removed and retained across reloads", async ({
  page,
}) => {
  const board = page.getByTestId("detail-board");
  await expect(
    board.getByTestId("camera-parts").getByText("SmallRig", { exact: true }),
  ).toBeVisible();
  await expect(board.getByText("Nikon FTZ II", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "SONY α7R IIIAを選択" }).click();
  await expect(board.getByText("SONY VG-C3EM", { exact: true })).toBeVisible();
  await expect(
    board.getByText("MonsterAdapter LA-FE1", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "FUJIFILM X-T5を選択" }).click();
  await expect(
    board.getByText("Fringer FR-FTX2", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "項目名の表示" })
    .selectOption("bilingual");
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  await expect(
    page.getByRole("heading", { name: /ADDITIONAL PARTS \/ 追加パーツ/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "追加パーツを追加" }).click();
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /追加パーツは8個まで/ }),
  ).toBeVisible();
  const name = '追加アダプター, "F | Z"';
  await page.getByLabel("追加パーツ3の種類").selectOption("adapter");
  await page.getByLabel("追加パーツ3の名称").fill(name);
  for (let index = 4; index <= 8; index++) {
    await page.getByRole("button", { name: "追加パーツを追加" }).click();
    await page
      .getByLabel(`追加パーツ${index}の名称`)
      .fill(`Custom part ${index}`);
  }
  await expect(
    page.getByRole("button", { name: "追加パーツを追加" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  await page.getByRole("button", { name: /CAMERA SELECT/ }).click();
  await expect(
    board.getByTestId("camera-parts").getByRole("listitem"),
  ).toHaveCount(8);
  await expect(board.getByText(name, { exact: true })).toBeVisible();
  await page.getByLabel("Nikon Z fを比較に追加").check();
  await page.getByLabel("SONY α7R IIIAを比較に追加").check();
  await page.getByRole("button", { name: "比較 2/3" }).click();
  await expect(
    page.getByRole("dialog").getByTestId("camera-parts"),
  ).toHaveCount(2);
  await expect(
    page.getByRole("dialog").getByText("SONY VG-C3EM", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  for (let index = 0; index < 8; index++)
    await page
      .getByRole("button", { name: "追加パーツ1を削除", exact: true })
      .click();
  await expect(
    page.getByRole("button", { name: "追加パーツを追加" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("optical-arsenal:inventory:v1")!)
        .cameras[0].additionalParts,
  );
  expect(stored).toEqual([]);
  await expect(board.getByTestId("camera-parts")).toHaveCount(0);
});
test("adapted lens mounts appear in blue in detail and comparison and disappear after removal", async ({
  page,
}) => {
  const board = page.getByTestId("detail-board");
  for (const [name, mount] of [
    ["Nikon Z f", "NIKON Z"],
    ["SONY α7R IIIA", "SONY E"],
    ["FUJIFILM X-T5", "FUJIFILM X"],
  ]) {
    await page.getByRole("button", { name: `${name}を選択` }).click();
    const addition = board.getByTestId("adapter-mount");
    await expect(addition).toHaveText("+ NIKON F");
    await expect(addition).toHaveCSS("color", "rgb(115, 216, 255)");
    await expect(addition.locator("..").locator("..")).toHaveText(
      `${mount} + NIKON F`,
    );
  }
  await page
    .getByRole("combobox", { name: "項目名の表示" })
    .selectOption("bilingual");
  await expect(
    board.locator("dt").filter({ hasText: /^MOUNT \/ マウント$/ }),
  ).toBeVisible();
  await page.getByLabel("Nikon Z fを比較に追加").check();
  await page.getByLabel("SONY α7R IIIAを比較に追加").check();
  await page.getByRole("button", { name: "比較 2/3" }).click();
  await expect(
    page.getByRole("dialog").getByTestId("adapter-mount"),
  ).toHaveCount(2);
  await expect(
    page.getByRole("dialog").getByTestId("adapter-mount").first(),
  ).toHaveCSS("color", "rgb(115, 216, 255)");
  await page.keyboard.press("Escape");
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  await page
    .getByRole("button", { name: "追加パーツ2を削除", exact: true })
    .click();
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  await expect(board.getByTestId("adapter-mount")).toHaveCount(0);
  await expect(
    board.locator("dd").filter({ hasText: /^NIKON Z$/ }),
  ).toHaveCount(1);
  const camera = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("optical-arsenal:inventory:v1")!)
        .cameras[0],
  );
  expect(camera.mount).toBe("Nikon Z");
});
test("part effects change ratings, colors and comparison while preserving body scores", async ({
  page,
}) => {
  const fixture = structuredClone(sampleInventory);
  fixture.cameras.forEach((camera) => {
    camera.additionalParts = camera.additionalParts.filter(
      (part) => part.kind !== "lighting",
    );
  });
  Object.assign(fixture.cameras[0].ratings, { stability: 9, mobility: 6 });
  Object.assign(fixture.cameras[4].ratings, {
    stability: 7,
    endurance: 8.5,
    response: 8.5,
  });
  await page.evaluate(
    (value) => localStorage.setItem("optical-arsenal:inventory:v1", value),
    JSON.stringify(fixture),
  );
  await page.reload();
  const board = page.getByTestId("detail-board");
  const meter = (name: string) =>
    board.getByRole("meter", { name, exact: true });
  await expect(meter("STABILITY")).toHaveAttribute("aria-valuenow", "9.5");
  await expect(meter("STABILITY")).toHaveAttribute(
    "aria-valuetext",
    "9.0 → 9.5 (+0.5)",
  );
  await expect(meter("STABILITY")).toHaveAttribute("data-change", "increase");
  await expect(meter("MOBILITY")).toHaveAttribute("aria-valuenow", "5.2");
  await expect(meter("MOBILITY")).toHaveAttribute("data-change", "decrease");
  await expect(board.locator('strong[data-change="increase"]')).toHaveCSS(
    "color",
    "rgb(115, 216, 255)",
  );
  await expect(board.locator('strong[data-change="decrease"]')).toHaveCSS(
    "color",
    "rgb(255, 147, 153)",
  );
  await page.getByRole("button", { name: "SONY α7R IIIAを選択" }).click();
  await expect(meter("ENDURANCE")).toHaveAttribute("aria-valuenow", "10");
  await expect(meter("ENDURANCE")).toHaveAttribute(
    "aria-valuetext",
    "8.5 → 10.0 (+1.5)",
  );
  await expect(meter("AF")).toHaveAttribute("aria-valuenow", "7.5");
  await page.getByRole("button", { name: "Nikon Z fを選択" }).click();
  await page.setViewportSize({ width: 320, height: 844 });
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  const part = page.getByRole("group", { name: "PART 01", exact: true });
  await part.locator("summary").click();
  const correction = page.getByLabel("追加パーツ1のSTABILITY補正", {
    exact: true,
  });
  await correction.fill("11");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /補正は各評価項目/ }),
  ).toBeVisible();
  await correction.fill("1");
  await part.getByRole("button", { name: "参考値に戻す" }).click();
  await expect(correction).toHaveValue("0.5");
  await correction.fill("0.8");
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  await expect(meter("STABILITY")).toHaveAttribute("aria-valuenow", "9.8");
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("optical-arsenal:inventory:v1")!)
        .cameras[0],
  );
  expect(stored.ratings).toMatchObject({ stability: 9, mobility: 6 });
  expect(stored.additionalParts[0].effects).toEqual({
    stability: 0.8,
    mobility: -0.3,
  });
  await page.getByLabel("Nikon Z fを比較に追加").check();
  await page.getByLabel("SONY α7R IIIAを比較に追加").check();
  await page.getByRole("button", { name: "比較 2/3" }).click();
  const first = page.getByRole("dialog").locator("article").first();
  await expect(
    first.getByRole("meter", { name: "STABILITY", exact: true }),
  ).toHaveAttribute("aria-valuenow", "9.8");
  await expect(
    first.getByTestId("rating-delta").filter({ hasText: "+0.8" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  await page
    .getByRole("button", { name: "追加パーツ1を削除", exact: true })
    .click();
  await page
    .getByRole("button", { name: "追加パーツ1を削除", exact: true })
    .click();
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  await expect(meter("STABILITY")).toHaveAttribute("aria-valuenow", "9");
  await expect(meter("MOBILITY")).toHaveAttribute("aria-valuenow", "6");
  await expect(board.getByTestId("rating-delta")).toHaveCount(0);
});
test("lighting defaults upgrade saved cameras, add features and weight, and can be edited or removed", async ({
  page,
}) => {
  const previous = structuredClone(sampleInventory);
  delete previous.defaultLightingVersion;
  previous.cameras.forEach(
    (camera) =>
      (camera.additionalParts = camera.additionalParts.filter(
        (part) => part.kind !== "lighting",
      )),
  );
  const raw = JSON.stringify(previous);
  await page.evaluate(
    (value) => localStorage.setItem("optical-arsenal:inventory:v1", value),
    raw,
  );
  await page.reload();
  const board = page.getByTestId("detail-board");
  for (const [name, variant] of [
    ["Nikon Z f", "N"],
    ["SONY α7R IIIA", "S"],
    ["FUJIFILM X-T5", "F"],
    ["Canon EOS 5D Mark IV", "C"],
  ]) {
    await page.getByRole("button", { name: `${name}を選択` }).click();
    await expect(
      board.getByText(`Godox X2T-${variant}`, { exact: true }),
    ).toBeVisible();
    await expect(board.getByText("Godox TT600", { exact: true })).toBeVisible();
    await expect(board.getByTestId("part-feature")).toHaveCount(4);
    await expect(board.getByTestId("part-feature").first()).toHaveCSS(
      "color",
      "rgb(115, 216, 255)",
    );
    await expect(board.getByTestId("part-weight")).toHaveText("+490 g");
    await expect(board.getByTestId("part-weight")).toHaveCSS(
      "color",
      "rgb(255, 147, 153)",
    );
  }
  expect(
    await page.evaluate(() =>
      localStorage.getItem("optical-arsenal:inventory:v1"),
    ),
  ).toBe(raw);
  await page.getByRole("button", { name: "Nikon Z fを選択" }).click();
  await page
    .getByRole("combobox", { name: "項目名の表示" })
    .selectOption("bilingual");
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(
    board.getByRole("heading", {
      name: "ADDITIONAL FUNCTIONS / 追加機能",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    board
      .getByTestId("part-feature")
      .filter({ hasText: "WIRELESS FLASH / 無線ストロボ使用可" }),
  ).toBeVisible();
  await expect(
    board
      .getByTestId("part-feature")
      .filter({ hasText: /^\+ FLASH \/ ストロボ使用可$/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  const trigger = page.getByRole("group", { name: "PART 03", exact: true });
  await trigger.locator("summary").click();
  await expect(
    page.getByLabel("追加パーツ3の追加重量", { exact: true }),
  ).toHaveValue("90");
  await page.getByLabel("追加パーツ3の追加重量", { exact: true }).fill("110");
  await page
    .getByLabel("追加パーツ3のMOBILITY補正", { exact: true })
    .fill("-0.4");
  await page
    .getByLabel("追加パーツ3のWIRELESS FLASH機能", { exact: true })
    .uncheck();
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  await expect(board.getByTestId("part-weight")).toHaveText("+510 g");
  await expect(board.getByTestId("part-feature")).toHaveCount(3);
  await expect(
    board.getByRole("meter", { name: "MOBILITY / 携行性", exact: true }),
  ).toHaveAttribute("aria-valuenow", "3.8");
  await page.getByLabel("Nikon Z fを比較に追加").check();
  await page.getByLabel("SONY α7R IIIAを比較に追加").check();
  await page.getByRole("button", { name: "比較 2/3" }).click();
  await expect(
    page.getByRole("dialog").getByTestId("part-feature"),
  ).toHaveCount(7);
  await expect(
    page.getByRole("dialog").getByTestId("part-weight").first(),
  ).toHaveText("+510 g");
  await page.keyboard.press("Escape");
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  await trigger.locator("summary").click();
  await trigger.getByRole("button", { name: "参考値に戻す" }).click();
  await expect(
    page.getByLabel("追加パーツ3の追加重量", { exact: true }),
  ).toHaveValue("90");
  await expect(
    page.getByLabel("追加パーツ3のWIRELESS FLASH機能", { exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "追加パーツ4を削除", exact: true })
    .click();
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  await expect(board.getByTestId("part-weight")).toHaveText("+90 g");
  await expect(board.getByTestId("part-feature")).toHaveCount(3);
  await expect(board.getByTestId("part-feature").first()).toContainText(
    "WIRELESS FLASH",
  );
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  await page
    .getByRole("button", { name: "追加パーツ3を削除", exact: true })
    .click();
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  await expect(board.getByTestId("part-weight")).toHaveCount(0);
  await expect(board.getByTestId("part-feature")).toHaveCount(0);
  await expect(
    board
      .getByTestId("camera-features")
      .getByText("NONE / なし", { exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("optical-arsenal:inventory:v1")!),
  );
  expect(saved.defaultLightingVersion).toBe(1);
  expect(saved.cameras[0].specs.weight).toBe("710 g");
  expect(saved.cameras[0].ratings.mobility).toBe(6.5);
  await openManagement(page);
  await page.getByRole("button", { name: "Nikon Z fを編集" }).click();
  await page.getByRole("button", { name: "X2-Tを追加", exact: true }).click();
  await page.getByRole("button", { name: "TT600を追加", exact: true }).click();
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  await expect(board.getByTestId("part-feature")).toHaveCount(4);
  await expect(board.getByTestId("part-weight")).toHaveText("+490 g");
});
test("legacy saved scores remain usable and new scores persist after editing", async ({
  page,
}) => {
  const inventory = await import("../src/data/sample").then((module) =>
    structuredClone(module.sampleInventory),
  );
  Object.assign(inventory.cameras[0], {
    additionalParts: [],
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
        if (view === "camera") {
          const inventory = await import("../src/data/sample").then((module) =>
            structuredClone(module.sampleInventory),
          );
          inventory.cameras[0].additionalParts = Array.from(
            { length: 8 },
            (_, index) => ({
              kind: index % 2 ? "adapter" : "grip",
              name: `Part ${index + 1}: ${"Long equipment name with spaces ".repeat(2)}`.slice(
                0,
                64,
              ),
              effects:
                index === 0
                  ? { stability: 0.5, mobility: -0.8, endurance: 2 }
                  : {},
              weightGrams: index === 0 ? 490 : 0,
              features:
                index === 0 ? ["wirelessFlash", "hss", "ttl", "flash"] : [],
            }),
          );
          inventory.cameras[0].additionalParts[1].name = "Nikon FTZ II";
          await page.evaluate(
            (value) =>
              localStorage.setItem("optical-arsenal:inventory:v1", value),
            JSON.stringify(inventory),
          );
          await page.reload();
        }
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
        if (view === "camera")
          await expect(
            exportBoard.getByRole("meter", {
              name: labelMode === "bilingual" ? "AF / AF性能" : "AF",
              exact: true,
              includeHidden: true,
            }),
          ).toHaveAttribute("aria-valuenow", "9");
        if (view === "camera") {
          await expect(exportBoard.getByTestId("part-feature")).toHaveCount(4);
          await expect(exportBoard.getByTestId("part-weight")).toHaveText(
            "+490 g",
          );
          await expect(exportBoard.getByTestId("adapter-mount")).toHaveText(
            "+ NIKON F",
          );
          await expect(exportBoard.getByTestId("adapter-mount")).toHaveCSS(
            "color",
            "rgb(115, 216, 255)",
          );
          await expect(exportBoard.getByTestId("rating-delta")).toHaveCount(3);
          await expect(
            exportBoard.locator('[role="meter"][data-change="increase"]'),
          ).toHaveCount(2);
          await expect(
            exportBoard.locator('[role="meter"][data-change="decrease"]'),
          ).toHaveCount(1);
          await expect(
            exportBoard.getByTestId("camera-parts").locator("li"),
          ).toHaveCount(8);
          const bounds = await exportBoard
            .getByTestId("camera-parts")
            .evaluate((panel) => {
              const visual = panel.parentElement!.parentElement!;
              const rect = visual.getBoundingClientRect();
              const card = panel.getBoundingClientRect();
              const image = visual
                .querySelector("svg, img")!
                .getBoundingClientRect();
              const features = visual
                .querySelector('[data-testid="camera-features"]')!
                .getBoundingClientRect();
              return {
                inside: card.top >= rect.top && card.bottom <= rect.bottom,
                noOverlap: image.bottom <= card.top + 1,
                featuresInside:
                  features.top >= card.bottom && features.bottom <= rect.bottom,
              };
            });
          expect(bounds).toEqual({
            inside: true,
            noOverlap: true,
            featuresInside: true,
          });
        }
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
  const initialInventory = await page.evaluate(() =>
    localStorage.getItem("optical-arsenal:inventory:v1"),
  );
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
  ).toHaveValue("14 fps (高速連続撮影・拡張) / 30 fps (C30)");
  await expect(
    page.getByLabel("STABILITY / 撮影安定性", { exact: true }),
  ).toHaveValue("9.5");
  await expect(page.getByLabel("AF / AF性能", { exact: true })).toHaveValue(
    "9",
  );
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
  ).toBe(initialInventory);
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
