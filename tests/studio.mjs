import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { chromium } from "../upstream/lemo-opuscar/node_modules/playwright-core/index.mjs";
import { serve } from "../upstream/lemo-opuscar/core/render/serve.mjs";
const { server, port } = await serve(path.resolve("studio"));
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROME ||
    (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(
    () => document.querySelectorAll(".card").length === 51,
  );
  assert.equal(await page.locator("#categories button").count(), 11);
  await page.locator("button[type=submit]").click();
  await page.getByRole("alert").filter({ hasText: "需要先选择风格" }).waitFor();
  await page.getByRole("button", { name: "东方传统", exact: true }).click();
  assert.equal(await page.locator(".card").count(), 4);
  await page.getByRole("button", { name: "全部", exact: true }).click();
  await page.locator("#search").fill("水墨");
  assert.equal(await page.locator(".card").count(), 1);
  await page.locator(".card").click();
  await page.locator("dialog[open]").waitFor();
  assert.match(await page.locator("#detail-body").innerText(), /运动特点/);
  await page.locator("#choose").click();
  assert.match(await page.locator("#selected").innerText(), /ink-wash/);
  await page.locator("button[type=submit]").click();
  await page.locator("#output").waitFor({ state: "visible" });
  assert.match(await page.locator("#task").inputValue(), /ink-wash/);
  const download = page.waitForEvent("download");
  await page.locator("#download").click();
  const d = await download;
  const data = JSON.parse(fs.readFileSync(await d.path()));
  assert.equal(data.style, "ink-wash");
  assert.equal(data.id, "wenming-weiyang");
  await page.locator("#mix").click();
  await page.locator("button[type=submit]").click();
  assert.match(await page.locator("#form-error").innerText(), /混合风格方案/);
  await page.locator("[name=custom_style]").fill("瑞士排版为主，借鉴钢笔线条");
  await page.locator("button[type=submit]").click();
  assert.match(await page.locator("#task").inputValue(), /非官方混合风格/);
  await page.locator("#search").fill("");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  fs.mkdirSync("reports", { recursive: true });
  await page.screenshot({ path: "reports/studio.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 51 cards, 10 categories, Chinese search, style gating, details, selection, JSON download, custom mix, mobile layout, no JS errors",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
