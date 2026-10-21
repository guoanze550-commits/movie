import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projectConfig, taskPrompt } from "../studio/src/project.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try {
  const args = process.argv.slice(2);
  if (args.length !== 1)
    throw Error(
      "用法: bash scripts/new-film.sh /absolute/path/to/project-input.json",
    );
  const input = JSON.parse(fs.readFileSync(args[0], "utf8"));
  const catalog = JSON.parse(
    fs.readFileSync(path.join(root, "styles/catalog.json"), "utf8"),
  );
  const p = projectConfig(input, catalog),
    dir = path.join(root, "films", p.id);
  if (fs.existsSync(dir))
    throw Error("项目目录已存在，拒绝覆盖；请审核并手动更新配置");
  fs.mkdirSync(dir);
  fs.writeFileSync(
    path.join(dir, "project.json"),
    JSON.stringify(p, null, 2) + "\n",
  );
  fs.writeFileSync(path.join(dir, "TASK.md"), taskPrompt(p) + "\n");
  console.log(dir);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
