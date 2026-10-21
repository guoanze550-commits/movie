import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { mulberry } from "../upstream/lemo-opuscar/core/lib.js";
import {
  openDemo,
  closeServer,
} from "../upstream/lemo-opuscar/core/render/page.mjs";
const root = path.resolve("fixtures/smoke");
const { browser, page } = await openDemo(root, { w: 640, h: 360 });
try {
  assert.equal(await page.evaluate(() => window.DUR), 6);
  assert.equal(await page.evaluate(() => window.READY), true);
  await page.evaluate(() => window.render(2.4));
  const a = await page.screenshot();
  await page.evaluate(() => window.render(5));
  await page.evaluate(() => window.render(0));
  await page.evaluate(() => window.render(2.4));
  const b = await page.screenshot();
  assert.ok(a.equals(b), "frame must be independent of order");
  const random = mulberry(20261021);
  const randomTimes = Array.from(
    { length: 5 },
    () => Math.floor(random() * 144) / 24,
  );
  fs.mkdirSync("fixtures/smoke/out/random-frames", { recursive: true });
  for (const t of randomTimes) {
    await page.evaluate((t) => window.render(t), t);
    const first = await page.screenshot();
    await page.evaluate(() => window.render(0));
    await page.evaluate((t) => window.render(t), t);
    const repeated = await page.screenshot({
      path: `fixtures/smoke/out/random-frames/${t.toFixed(4)}.png`,
    });
    assert.ok(
      first.equals(repeated),
      `random frame ${t} must be deterministic`,
    );
  }
  const texts = await page.evaluate(() => window.TEXTS(0));
  assert.equal(texts[0].text, "渲染测试");
  fs.mkdirSync("reports", { recursive: true });
  fs.writeFileSync(
    "reports/determinism.json",
    JSON.stringify(
      {
        deterministic: true,
        random_seed: 20261021,
        random_frame_times: randomTimes,
        page_contract: true,
        fonts_loaded: await page.evaluate(() =>
          document.fonts.check("48px StudioCJK", "渲染测试"),
        ),
        preview_size: "640x360",
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: official page contract, seeded/deterministic seeking, Chinese font readiness",
  );
} finally {
  await browser.close();
  closeServer();
}
