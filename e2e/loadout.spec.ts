import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("camera screen swaps parts, keeps them available after reload, and updates adapter lenses and TTL/HSS", async ({
  page,
}) => {
  const board = page.getByTestId("detail-board");
  await expect(board.getByTestId("part-feature")).toHaveCount(4);
  await expect(
    board.getByText("+ HIGH SPEED SYNC", { exact: true }),
  ).toBeVisible();
  await expect(board.getByText("+ TTL", { exact: true })).toBeVisible();
  await expect(board.getByText(/TT600 does not support TTL/)).toBeVisible();
  await page.getByText("装備を付け替える", { exact: false }).click();
  await page
    .getByRole("button", { name: "Godox X2T-Nを外す", exact: true })
    .click();
  await expect(board.getByTestId("part-feature")).toHaveCount(1);
  await expect(board.getByTestId("part-feature")).toHaveText("+ FLASH");
  await expect(board.getByTestId("part-weight")).toHaveText("+400 g");
  await expect(
    board.getByRole("meter", { name: "MOBILITY", exact: true }),
  ).toHaveAttribute("aria-valuenow", "4.2");
  await page.reload();
  await page.getByText("装備を付け替える", { exact: false }).click();
  await page
    .getByRole("button", { name: "Godox X2T-Nを装着", exact: true })
    .click();
  await expect(board.getByTestId("part-feature")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Godox X2T-Sを装着", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Nikon FTZ IIを外す", exact: true })
    .click();
  await expect(board.getByTestId("adapter-mount")).toHaveCount(0);
  await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
  await expect(
    page.getByRole("button", {
      name: "AF-S DX NIKKOR 35mm f/1.8Gを選択",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /CAMERA SELECT/ }).click();
  await page.getByText("装備を付け替える", { exact: false }).click();
  await page
    .getByRole("button", { name: "Nikon FTZ IIを装着", exact: true })
    .click();
  await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
  await expect(
    page.getByRole("button", {
      name: "AF-S DX NIKKOR 35mm f/1.8Gを選択",
      exact: true,
    }),
  ).toBeVisible();
});

test("selected camera and lens open a persistent squadron with multiple wingmen, independent equipment and mount checks", async ({
  page,
}) => {
  await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
  await page
    .getByRole("button", { name: "NIKKOR Z 40mm f/2を選択", exact: true })
    .click();
  await page.getByRole("button", { name: "この組み合わせで編成へ" }).click();
  const squadron = page.getByTestId("squadron-page");
  await expect(
    squadron.getByLabel("メイン機のカメラ", { exact: true }),
  ).toHaveValue("nikon-zf");
  await expect(
    squadron.getByLabel("メイン機のレンズ", { exact: true }),
  ).toHaveValue("z40");
  await page
    .getByRole("button", { name: "＋ 僚機を追加", exact: true })
    .click();
  await page
    .getByLabel("僚機1のカメラ", { exact: true })
    .selectOption("sony-a7r");
  await page.getByLabel("僚機1のレンズ", { exact: true }).selectOption("dx35");
  await page
    .getByRole("button", { name: "＋ 僚機を追加", exact: true })
    .click();
  await page
    .getByLabel("僚機2のカメラ", { exact: true })
    .selectOption("fuji-xt5");
  await page.getByLabel("僚機2のレンズ", { exact: true }).selectOption("dx40");
  await expect(squadron.getByTestId("squadron-unit")).toHaveCount(3);
  await expect(squadron.getByTestId("squadron-status")).toHaveText("● READY");
  await expect(
    page.getByLabel("僚機2のカメラ").locator('option[value="sony-a7r"]'),
  ).toHaveAttribute("disabled", "");
  await expect(
    page.getByLabel("僚機2のレンズ").locator('option[value="dx35"]'),
  ).toHaveAttribute("disabled", "");
  await page.reload();
  await page.getByRole("button", { name: /SQUADRON.*SORTIE/ }).click();
  await expect(squadron.getByTestId("squadron-unit")).toHaveCount(3);
  await expect(page.getByLabel("僚機2のレンズ", { exact: true })).toHaveValue(
    "dx40",
  );
  const leader = squadron.getByRole("article", {
    name: "メイン機",
    exact: true,
  });
  await page
    .getByLabel("メイン機のレンズ", { exact: true })
    .selectOption("af28");
  await leader.getByText("装備を付け替える", { exact: false }).click();
  await leader
    .getByRole("button", { name: "Nikon FTZ IIを外す", exact: true })
    .click();
  await expect(leader.getByTestId("adapter-mount")).toHaveCount(0);
  await expect(squadron.getByTestId("squadron-status")).toHaveText(
    "● INCOMPLETE",
  );
  await expect(leader.getByText(/対応するアダプターの装着/)).toBeVisible();
  await leader
    .getByRole("button", { name: "Nikon FTZ IIを装着", exact: true })
    .click();
  await expect(squadron.getByTestId("squadron-status")).toHaveText("● READY");
  await leader
    .getByRole("button", { name: "Godox TT600を外す", exact: true })
    .click();
  await expect(leader.getByTestId("part-weight")).toHaveText("+90 g");
  await expect(
    squadron
      .getByRole("article", { name: "僚機1", exact: true })
      .getByTestId("part-weight"),
  ).toHaveText("+490 g");
  await page
    .getByRole("combobox", { name: "項目名の表示" })
    .selectOption("bilingual");
  await expect(
    leader.getByText("+ HIGH SPEED SYNC / ハイスピードシンクロ", {
      exact: true,
    }),
  ).toBeVisible();
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "僚機1を削除", exact: true }).click();
  await expect(squadron.getByTestId("squadron-unit")).toHaveCount(2);
  await page.reload();
  await page.getByRole("button", { name: /SQUADRON.*SORTIE/ }).click();
  await expect(page.getByLabel("僚機1のカメラ", { exact: true })).toHaveValue(
    "fuji-xt5",
  );
  await expect(squadron.getByTestId("squadron-unit")).toHaveCount(2);
});
