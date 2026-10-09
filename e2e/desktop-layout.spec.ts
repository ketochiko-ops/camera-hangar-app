import { expect, test } from "@playwright/test";
import { sampleInventory } from "../src/data/sample";

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1024, 768],
] as const) {
  test(`the complete camera panel fits at ${width} × ${height} in both label modes`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const board = page.getByTestId("detail-board");
    const menu = page.getByTestId("sidebar-camera-menu");

    for (const mode of ["english", "bilingual"]) {
      await page.getByLabel("項目名の表示").selectOption(mode);
      for (const camera of sampleInventory.cameras) {
        await menu
          .getByRole("button", {
            name: `${camera.name}をサイドメニューから選択`,
            exact: true,
          })
          .click();
        await expect(
          board.getByRole("heading", { name: camera.name, exact: true }),
        ).toBeVisible();
        await expect(board).toBeInViewport({ ratio: 1 });
        expect(await page.evaluate(() => scrollY)).toBe(0);
        await expect(board.getByRole("meter")).toHaveCount(7);
        await expect(board.locator("dt")).toHaveCount(8);
        await expect(
          board.getByText("READY TO CAPTURE", { exact: true }),
        ).toBeInViewport({ ratio: 1 });
        await expect(
          board.getByText(camera.summary, { exact: true }),
        ).toBeInViewport({ ratio: 1 });
        for (const part of camera.additionalParts) {
          await expect(
            board
              .getByTestId("camera-parts")
              .getByText(part.name, { exact: true }),
          ).toBeInViewport({ ratio: 1 });
        }
        for (const feature of await board.getByTestId("part-feature").all()) {
          await expect(feature).toBeInViewport({ ratio: 1 });
        }
        // The image column has decorative overflow clipping; its content must
        // still fit naturally so that parts and function notes are not cut off.
        expect(
          await board.evaluate((element) => {
            const visual = element.children[1];
            return visual.scrollHeight <= visual.clientHeight + 1;
          }),
        ).toBe(true);
      }
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
