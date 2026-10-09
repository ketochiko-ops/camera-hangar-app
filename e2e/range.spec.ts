import { expect, test } from "@playwright/test";
import { sampleInventory } from "../src/data/sample";
import { STORAGE_KEY } from "../src/utils/storage";

test("each unit and the squadron gain independent wide, close-up, standard and telephoto coverage", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: /SQUADRON.*SORTIE/ }).click();
  const leader = page.getByRole("article", { name: "メイン機", exact: true });
  await leader
    .getByLabel("メイン機のカメラ", { exact: true })
    .selectOption("nikon-zf");
  await leader
    .getByLabel("メイン機のレンズ", { exact: true })
    .selectOption("z24");
  const coverage = page.getByTestId("squadron-coverage");
  const unitRange = leader.getByTestId("unit-range");
  await expect(unitRange.getByRole("meter")).toHaveCount(4);
  await expect(
    unitRange.getByText("35MM EQUIVALENT 24–70 mm", { exact: true }),
  ).toBeVisible();
  await expect(
    coverage.getByRole("meter", { name: "WIDE ANGLE", exact: true }),
  ).toHaveAttribute("aria-valuenow", "10");
  const tele = coverage.getByRole("meter", {
    name: "TELEPHOTO RANGE",
    exact: true,
  });
  await expect(tele).toHaveAttribute("aria-valuenow", "1.7");
  await page.evaluate(() =>
    document.getAnimations().forEach((a) => a.finish()),
  );
  await page
    .getByRole("button", { name: "＋ 僚機を追加", exact: true })
    .click();
  await page
    .getByLabel("僚機1のカメラ", { exact: true })
    .selectOption("nikon-d7500");
  await page.getByLabel("僚機1のレンズ", { exact: true }).selectOption("af70");
  await expect(tele).toHaveAttribute("aria-valuenow", "10");
  const moving = await tele.getByTestId("rating-fill").evaluate((node) => {
    const animation = node
      .getAnimations()
      .find(
        (a) => a instanceof CSSTransition && a.transitionProperty === "width",
      );
    if (!animation) throw new Error("Expected animated squadron coverage");
    animation.pause();
    animation.currentTime = Number(animation.effect!.getTiming().duration) / 2;
    return (
      (node.getBoundingClientRect().width /
        node.parentElement!.getBoundingClientRect().width) *
      100
    );
  });
  expect(moving).toBeGreaterThan(17);
  expect(moving).toBeLessThan(100);
  await page.evaluate(() =>
    document.getAnimations().forEach((a) => a.finish()),
  );
  await page
    .getByRole("button", { name: "＋ 僚機を追加", exact: true })
    .click();
  await page
    .getByLabel("僚機2のカメラ", { exact: true })
    .selectOption("fuji-xt5");
  await page.getByLabel("僚機2のレンズ", { exact: true }).selectOption("dx40");
  await expect(
    coverage.getByRole("meter", { name: "CLOSE-UP", exact: true }),
  ).toHaveAttribute("aria-valuenow", "9");
  await expect(
    coverage.getByText("3 / 3 UNITS", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "僚機1を削除", exact: true }).click();
  await expect(tele).toHaveAttribute("aria-valuenow", "1.7");
  await leader
    .getByLabel("メイン機のレンズ", { exact: true })
    .selectOption("af28");
  await leader.getByText("装備を付け替える", { exact: false }).click();
  await leader
    .getByRole("button", { name: "Nikon FTZ IIを外す", exact: true })
    .click();
  await expect(
    coverage.getByText("1 / 2 UNITS", { exact: true }),
  ).toBeVisible();
  await expect(
    coverage.getByRole("meter", { name: "WIDE ANGLE", exact: true }),
  ).toHaveAttribute("aria-valuenow", "2.9");
  await expect(
    unitRange.getByText(
      "マウント不一致のため、編成全体の集計から外れています。",
      { exact: true },
    ),
  ).toBeVisible();
  await leader
    .getByRole("button", { name: "Nikon FTZ IIを装着", exact: true })
    .click();
  await expect(
    coverage.getByRole("meter", { name: "WIDE ANGLE", exact: true }),
  ).toHaveAttribute("aria-valuenow", "10");
  await page.reload();
  await page.getByRole("button", { name: /SQUADRON.*SORTIE/ }).click();
  await expect(
    coverage.getByText("2 / 2 UNITS", { exact: true }),
  ).toBeVisible();
  await expect(
    coverage.getByRole("meter", { name: "CLOSE-UP", exact: true }),
  ).toHaveAttribute("aria-valuenow", "9");
  await page
    .getByRole("combobox", { name: "項目名の表示" })
    .selectOption("bilingual");
  await expect(
    coverage.getByRole("meter", { name: "WIDE ANGLE / 広角", exact: true }),
  ).toHaveAttribute("aria-valuenow", "10");
  await expect(
    coverage.getByRole("meter", { name: "CLOSE-UP / 接写", exact: true }),
  ).toHaveAttribute("aria-valuenow", "9");
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("missing selections and unknown specs explain why coverage is unavailable", async ({
  page,
}) => {
  const data = structuredClone(sampleInventory);
  data.cameras[0].specs.sensor = "Unknown sensor";
  await page.addInitScript(
    ({ data, key }) => localStorage.setItem(key, JSON.stringify(data)),
    { data, key: STORAGE_KEY },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /SQUADRON.*SORTIE/ }).click();
  const leader = page.getByRole("article", { name: "メイン機", exact: true });
  await leader
    .getByLabel("メイン機のレンズ", { exact: true })
    .selectOption("z40");
  const unitRange = leader.getByTestId("unit-range");
  await expect(unitRange.getByText(/センサー形式と焦点距離/)).toBeVisible();
  await expect(
    page
      .getByTestId("squadron-coverage")
      .getByText("0 / 1 UNITS", { exact: true }),
  ).toBeVisible();
  await leader.getByLabel("メイン機のレンズ", { exact: true }).selectOption("");
  await expect(
    unitRange.getByText("カメラとレンズを選ぶと撮影レンジを表示します。", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    unitRange.getByRole("meter", { name: "CLOSE-UP", exact: true }),
  ).toHaveAttribute("aria-valuenow", "0");
});
