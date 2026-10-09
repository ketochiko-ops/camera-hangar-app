import { expect, test, type Locator, type Page } from "@playwright/test";

async function settle(page: Page) {
  await page.evaluate(() =>
    document.getAnimations().forEach((animation) => animation.finish()),
  );
}

// Seek the real browser transition so assertions do not rely on wall-clock timing.
async function halfway(element: Locator) {
  return element.evaluate((node) => {
    const animation = node
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSTransition &&
          animation.transitionProperty === "width",
      );
    if (!animation) throw new Error("Expected a width transition");
    animation.pause();
    animation.currentTime =
      Number(animation.effect!.getTiming().duration) * 0.5;
    const rect = node.getBoundingClientRect();
    const parent = node.parentElement!.getBoundingClientRect();
    return {
      percent: (rect.width / parent.width) * 100,
      opacity: Number(getComputedStyle(node).opacity),
    };
  });
}

test("camera, lens and part changes interpolate the existing graph and settle on accurate values", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await settle(page);
  const board = page.getByTestId("detail-board");
  const mobility = board.getByRole("meter", { name: "MOBILITY", exact: true });
  const fill = mobility.getByTestId("rating-fill");
  await fill.evaluate((node) => {
    node.setAttribute("data-continuity", "kept");
  });
  await page
    .getByRole("button", { name: "Nikon Z fcを選択", exact: true })
    .click();
  await expect(mobility).toHaveAttribute("aria-valuenow", "9");
  await expect(fill).toHaveAttribute("data-continuity", "kept");
  const moving = await halfway(fill);
  expect(moving.percent).toBeGreaterThan(39);
  expect(moving.percent).toBeLessThan(90);
  // Retarget while still moving: the native CSS transition uses the current frame.
  await page
    .getByRole("button", { name: "Nikon Z fを選択", exact: true })
    .click();
  await expect(mobility).toHaveAttribute("aria-valuenow", "3.9");
  await settle(page);
  expect(
    await fill.evaluate(
      (node) =>
        (node.getBoundingClientRect().width /
          node.parentElement!.getBoundingClientRect().width) *
        100,
    ),
  ).toBeCloseTo(39, 1);
  await page.getByText("装備を付け替える", { exact: false }).click();
  await page
    .getByRole("button", { name: "Godox TT600を外す", exact: true })
    .click();
  await expect(mobility).toHaveAttribute("aria-valuenow", "5.4");
  const decrease = await halfway(mobility.getByTestId("rating-decrease"));
  expect(decrease.percent).toBeGreaterThan(11);
  expect(decrease.percent).toBeLessThan(26);
  await settle(page);
  const stability = board.getByRole("meter", {
    name: "STABILITY",
    exact: true,
  });
  await page
    .getByRole("button", { name: "SmallRigを外す", exact: true })
    .click();
  await expect(stability).toHaveAttribute("aria-valuenow", "7.5");
  const increase = stability.getByTestId("rating-increase");
  const fading = await halfway(increase);
  expect(fading.percent).toBeGreaterThan(0);
  expect(fading.percent).toBeLessThan(5);
  expect(fading.opacity).toBeLessThan(1);
  await settle(page);
  await expect(increase).toHaveCSS("opacity", "0");
  await expect(increase).toHaveCSS("width", "0px");
  await page
    .getByRole("button", { name: "SmallRigを装着", exact: true })
    .click();
  await expect(stability).toHaveAttribute("aria-valuenow", "8");
  const growing = await halfway(increase);
  expect(growing.percent).toBeGreaterThan(0);
  expect(growing.percent).toBeLessThan(5);
  await settle(page);

  const firstFill = board.getByRole("meter").first().getByTestId("rating-fill");
  await firstFill.evaluate((node) => {
    node.setAttribute("data-continuity", "lens-slot");
  });
  await page.getByRole("button", { name: /LENS.*LOADOUT/ }).click();
  await settle(page);
  const resolution = board.getByRole("meter", {
    name: "RESOLUTION",
    exact: true,
  });
  await expect(resolution.getByTestId("rating-fill")).toHaveAttribute(
    "data-continuity",
    "lens-slot",
  );
  await page
    .getByRole("button", {
      name: "AF-S DX Micro NIKKOR 40mm f/2.8Gを選択",
      exact: true,
    })
    .click();
  await expect(resolution).toHaveAttribute("aria-valuenow", "8");
  const lensMoving = await halfway(resolution.getByTestId("rating-fill"));
  expect(lensMoving.percent).toBeGreaterThan(70);
  expect(lensMoving.percent).toBeLessThan(80);
  await settle(page);
  await page
    .getByRole("button", { name: "この組み合わせで編成へ", exact: true })
    .click();
  await settle(page);
  const leader = page.getByRole("article", { name: "メイン機", exact: true });
  await leader
    .getByLabel("メイン機のカメラ", { exact: true })
    .selectOption("nikon-zfc");
  const detail = leader.getByRole("meter", { name: "DETAIL", exact: true });
  await expect(detail).toHaveAttribute("aria-valuenow", "6.5");
  const squadronMoving = await halfway(detail.getByTestId("rating-fill"));
  expect(squadronMoving.percent).toBeGreaterThan(65);
  expect(squadronMoving.percent).toBeLessThan(75);
  await settle(page);
});

test("reduced motion displays final values immediately for selection and parts", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const board = page.getByTestId("detail-board");
  await page
    .getByRole("button", { name: "Nikon Z fcを選択", exact: true })
    .click();
  const mobility = board.getByRole("meter", { name: "MOBILITY", exact: true });
  await expect(mobility).toHaveAttribute("aria-valuenow", "9");
  expect(
    await mobility.evaluate(
      (node) => node.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
  await expect(mobility.getByTestId("rating-fill")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await page
    .getByRole("button", { name: "Nikon Z fを選択", exact: true })
    .click();
  await page.getByText("装備を付け替える", { exact: false }).click();
  await page
    .getByRole("button", { name: "SmallRigを外す", exact: true })
    .click();
  const stability = board.getByRole("meter", {
    name: "STABILITY",
    exact: true,
  });
  await expect(stability).toHaveAttribute("aria-valuenow", "7.5");
  await expect(stability.getByTestId("rating-increase")).toHaveCSS(
    "width",
    "0px",
  );
  expect(
    await board.evaluate(
      (node) => node.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
});
