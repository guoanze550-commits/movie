import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { projectConfig, taskPrompt } from "../studio/src/project.js";
const catalog = JSON.parse(
  fs.readFileSync(new URL("../styles/catalog.json", import.meta.url)),
);
const base = {
  id: "test-film",
  name: "测试",
  theme: "测试主题",
  style: "ink-wash",
};
test("51 official styles have exact names, classifications, normative source and hashes", () => {
  assert.equal(catalog.length, 51);
  assert.equal(new Set(catalog.map((s) => s.slug)).size, 51);
  assert.equal(new Set(catalog.map((s) => s.category_cn)).size, 10);
  for (const s of catalog) {
    const raw = JSON.parse(
      fs.readFileSync(`upstream/lemo-opuscar/styles/${s.slug}/style.json`),
    );
    assert.equal(s.cn, raw.cn);
    assert.equal(s.en, raw.en);
    assert.equal(s.category_cn, raw.category_cn);
    const text = fs.readFileSync(s.style_path, "utf8");
    assert.equal(
      s.style_sha256,
      createHash("sha256").update(text).digest("hex"),
    );
    for (const key of ["colors", "motion", "camera", "sound", "requirements"])
      assert.ok(s[key].length > 5, `${s.slug}:${key}`);
  }
});
test("unselected film cannot generate a task or pass render gate", () => {
  for (const style of [undefined, "unselected", "not-real"])
    assert.throws(() => projectConfig({ ...base, style }, catalog), /选择风格/);
  assert.throws(() => taskPrompt({ style: "unselected" }));
  const p = JSON.parse(fs.readFileSync("films/wenming-weiyang/project.json"));
  assert.equal(p.style, "unselected");
  assert.equal(p.status, "awaiting_style");
  const run = spawnSync("python3", [
    "scripts/render-config.py",
    "films/wenming-weiyang",
    "preview",
  ]);
  assert.notEqual(run.status, 0);
  assert.match(run.stderr.toString(), /用户选择风格/);
});
test("chosen style produces correct defaults and all aspect ratios", () => {
  const p = projectConfig(base, catalog);
  assert.equal(p.duration, 30);
  assert.equal(p.fps, 24);
  assert.equal(p.width, 1920);
  assert.match(p.style_path, /ink-wash/);
  for (const [aspect, size] of [
    ["9:16", [1080, 1920]],
    ["1:1", [1080, 1080]],
  ]) {
    const p = projectConfig({ ...base, aspect }, catalog);
    assert.deepEqual([p.width, p.height], size);
  }
  assert.match(taskPrompt(p), /TREATMENT/);
});
test("custom mix is marked nonofficial and review is required", () => {
  assert.throws(
    () => projectConfig({ ...base, style: "custom-mix" }, catalog),
    /混合风格方案/,
  );
  const p = projectConfig(
    {
      ...base,
      style: "custom-mix",
      custom_style: "以钢笔淡彩为主，修改纸张材质",
    },
    catalog,
  );
  assert.equal(p.status, "awaiting_custom_style_review");
  assert.match(taskPrompt(p), /非官方混合风格/);
});
test("custom resolution respects aspect and codec pixel constraints", () => {
  const p = projectConfig({ ...base, width: 1280, height: 720 }, catalog);
  assert.equal(p.width, 1280);
  for (const width of [0, 1921, 9000])
    assert.throws(() => projectConfig({ ...base, width }, catalog));
  assert.throws(() =>
    projectConfig({ ...base, width: 1000, height: 1000 }, catalog),
  );
});
test("invalid ids, duration and parameters are rejected", () => {
  for (const id of ["../escape", "a/b", "a--b", ""])
    assert.throws(() => projectConfig({ ...base, id }, catalog));
  for (const duration of [0, NaN, 601])
    assert.throws(() => projectConfig({ ...base, duration }, catalog));
  assert.throws(() => projectConfig({ ...base, aspect: "4:3" }, catalog));
  assert.throws(() => projectConfig({ ...base, fps: 0 }, catalog));
});
test("CLI creates project + task, rejects overwriting user files", () => {
  const input = "/tmp/movie-new-film-test.json",
    id = "cli-verification";
  assert.ok(!fs.existsSync(`films/${id}`), "test directory must not exist");
  fs.writeFileSync(input, JSON.stringify({ ...base, id }));
  try {
    const run = spawnSync("bash", ["scripts/new-film.sh", input]);
    assert.equal(run.status, 0, run.stderr.toString());
    assert.ok(fs.existsSync(`films/${id}/TASK.md`));
    assert.notEqual(
      spawnSync("bash", ["scripts/new-film.sh", input]).status,
      0,
    );
  } finally {
    fs.rmSync(`films/${id}`, { recursive: true, force: true });
    fs.rmSync(input, { force: true });
  }
});
