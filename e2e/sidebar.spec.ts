import { expect, test } from "@playwright/test";
import { sampleInventory } from "../src/data/sample";
import { STORAGE_KEY } from "../src/utils/storage";

test("landscape camera menu selects details from a scrolled page and preserves the saved squadron", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const menu = page.getByRole("region", { name: "登録カメラ", exact: true });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("button")).toHaveCount(6);
  const zfc = menu.getByRole("button", {
    name: "Nikon Z fcをサイドメニューから選択",
    exact: true,
  });
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await zfc.click();
  await expect(zfc).toHaveAttribute("aria-pressed", "true");
  const board = page.getByTestId("detail-board");
  await expect(
    board.getByRole("heading", { name: "Nikon Z fc", exact: true }),
  ).toBeInViewport();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(
    board.getByRole("meter", { name: "MOBILITY", exact: true }),
  ).toHaveAttribute("aria-valuenow", "9");
  await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
  await page
    .getByRole("button", { name: "NIKKOR Z 24-70mm f/4 Sを選択", exact: true })
    .click();
  await menu
    .getByRole("button", {
      name: "Nikon D7500をサイドメニューから選択",
      exact: true,
    })
    .click();
  await expect(
    board.getByRole("heading", { name: "Nikon D7500", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
  await expect(page.getByLabel("使用カメラ")).toHaveValue("nikon-d7500");
  await expect(
    page.getByRole("button", {
      name: "NIKKOR Z 24-70mm f/4 Sを選択",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "この組み合わせで編成へ", exact: true })
    .click();
  const before = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).squadron,
    STORAGE_KEY,
  );
  await menu
    .getByRole("button", {
      name: "SONY α7R IIIAをサイドメニューから選択",
      exact: true,
    })
    .click();
  await expect(
    board.getByRole("heading", { name: "SONY α7R IIIA", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).squadron,
      STORAGE_KEY,
    ),
  ).toEqual(before);
  await page
    .getByRole("combobox", { name: "項目名の表示" })
    .selectOption("bilingual");
  await expect(
    menu.getByRole("heading", {
      name: "CAMERA ROSTER / 登録カメラ",
      exact: true,
    }),
  ).toBeVisible();
});

test("camera menu follows additions, renames and deletions and supports keyboard selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const menu = page.getByRole("region", { name: "登録カメラ", exact: true });
  await page.getByRole("button", { name: /データ管理/ }).click();
  await page.getByRole("button", { name: "カメラを追加", exact: true }).click();
  await page.getByLabel(/機材名/).fill("Sidebar Camera");
  await page.getByLabel(/メーカー/).fill("Personal");
  await page.getByLabel(/^カテゴリ/).fill("Mirrorless");
  await page.getByLabel(/^MOUNT/).fill("Personal X");
  await page.getByLabel(/説明・機材メモ/).fill("Camera menu integration.");
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await expect(menu.getByRole("button")).toHaveCount(7);
  const added = menu.getByRole("button", {
    name: "Sidebar Cameraをサイドメニューから選択",
    exact: true,
  });
  await added.focus();
  await added.press("Enter");
  await expect(added).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .getByTestId("detail-board")
      .getByRole("heading", { name: "Sidebar Camera", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /データ管理/ }).click();
  await page
    .getByRole("button", { name: "Sidebar Cameraを編集", exact: true })
    .click();
  await page.getByLabel(/機材名/).fill("Renamed Camera");
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await expect(added).toHaveCount(0);
  await expect(
    menu.getByRole("button", {
      name: "Renamed Cameraをサイドメニューから選択",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Renamed Cameraを削除", exact: true })
    .click();
  await page.getByRole("button", { name: "削除する", exact: true }).click();
  await expect(menu.getByRole("button")).toHaveCount(6);
  await expect(
    menu.getByRole("button", {
      name: "Renamed Cameraをサイドメニューから選択",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    menu.getByRole("button", {
      name: "Nikon Z fをサイドメニューから選択",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("wide landscape displays a scrollable camera menu while portrait and phone layouts keep their camera cards", async ({
  page,
}) => {
  const data = structuredClone(sampleInventory);
  data.cameras.push(
    ...Array.from({ length: 24 }, (_, index) => ({
      ...structuredClone(data.cameras[0]),
      id: `additional-${index}`,
      name: `Additional camera ${index + 1} with a long registered equipment name`,
    })),
  );
  await page.addInitScript(
    ({ data, key }) => localStorage.setItem(key, JSON.stringify(data)),
    { data, key: STORAGE_KEY },
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const menu = page.getByTestId("sidebar-camera-menu");
  await expect(menu.getByRole("button")).toHaveCount(30);
  expect(
    await menu
      .locator("ul")
      .evaluate((list) => list.scrollHeight > list.clientHeight),
  ).toBe(true);
  await menu.getByRole("button").last().click();
  await expect(
    page
      .getByTestId("detail-board")
      .getByRole("heading", { name: data.cameras.at(-1)!.name, exact: true }),
  ).toBeVisible();
  expect(
    await menu.locator("ul").evaluate((list) => list.scrollTop),
  ).toBeGreaterThan(0);
  for (const [width, height, visible] of [
    [1366, 768, true],
    [1024, 768, true],
    [1024, 1366, false],
    [768, 1024, false],
    [390, 844, false],
    [320, 844, false],
  ] as const) {
    await page.setViewportSize({ width, height });
    if (visible) await expect(menu).toBeVisible();
    else await expect(menu).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(
    page.getByRole("button", { name: "Nikon Z fを選択", exact: true }),
  ).toBeVisible();
});
