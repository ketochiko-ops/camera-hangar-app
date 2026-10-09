import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { sampleInventory } from "../src/data/sample";
import { STORAGE_KEY } from "../src/utils/storage";

test("old saved cameras gain engines without losing edits, and engine edits persist in the UI and CSV", async ({
  page,
}) => {
  const data = structuredClone(sampleInventory);
  data.cameras.forEach((camera) =>
    Reflect.deleteProperty(camera.specs, "imageProcessor"),
  );
  data.cameras[0].ratings.night = 6;
  data.cameras[0].summary = "My saved camera notes.";
  data.squadron = {
    leader: { cameraId: "nikon-zf", lensId: "z40" },
    wingmen: [],
  };
  const original = JSON.stringify(data);
  await page.addInitScript(
    ({ key, value }) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: original },
  );
  await page.goto("/");
  const board = page.getByTestId("detail-board");
  await expect(board.getByText("ENGINE", { exact: true })).toBeVisible();
  await expect(board.getByText("EXPEED 7", { exact: true })).toBeVisible();
  await expect(
    board.getByRole("meter", { name: "NIGHT", exact: true }),
  ).toHaveAttribute("aria-valuenow", "6");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe(original);
  await page.getByLabel("項目名の表示").selectOption("bilingual");
  await expect(
    board.getByText("ENGINE / 映像エンジン", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /データ管理/ }).click();
  await page
    .getByRole("button", { name: "Nikon Z fを編集", exact: true })
    .click();
  await expect(
    page.getByLabel("ENGINE / 映像エンジン", { exact: true }),
  ).toHaveValue("EXPEED 7");
  await page
    .getByLabel("ENGINE / 映像エンジン", { exact: true })
    .fill("Custom Engine 2");
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await page.reload();
  await expect(
    board.getByText("Custom Engine 2", { exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    STORAGE_KEY,
  );
  expect(saved.cameras[0].ratings.night).toBe(6);
  expect(saved.cameras[0].summary).toBe("My saved camera notes.");
  expect(saved.squadron).toEqual(data.squadron);
  await page.getByRole("button", { name: /データ管理/ }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV出力", exact: true }).click();
  const csv = await readFile((await (await downloading).path())!, "utf8");
  expect(csv).toContain("image_processor");
  expect(csv).toContain("Custom Engine 2");
});
