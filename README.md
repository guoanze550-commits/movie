# Movie · Codex 代码动画制作工作室

基于 **官方 Lemo-Opuscar 源码** 的长期创作工程：风格展厅、项目配置、导演规范、确定性逐帧渲染、音频混音、质量报告及 GitHub 自动化。用户选定风格后，Codex 按所选规范创作；不依赖 Claude Code CLI。

**《文明未央》仅有未启动的项目配置，风格为 `unselected`。本轮没有制作其正片，也没有替用户选择风格。**

## 当前状态

- 官方 Git submodule：`upstream/lemo-opuscar`，固定版本见 [upstream/COMMIT](upstream/COMMIT)。上游 core/、styles/ 保持原样。
- 全部 51 种官方风格、10 个官方分类：索引包含中英文名称、slug、适用题材、全文规范、色彩、运动、镜头、声音、材质、引擎要求、源文件哈希与固定版本链接。
- 可交互网页：分类、中文搜索、真实官方示例帧、详情、官方视频链接、风格选择、配置下载、Codex 任务复制及非官方混合风格。
- 项目生成器：网页生成配置并下载；CLI 写入独立作品目录，拒绝覆盖已有目录。不自动生成未经导演设计的影片源码。
- 本机通过：7 个单元/集成测试、真实 Chromium UI 测试、官方逐帧渲染及 MP4 验证。详见 [reports/STATUS.md](reports/STATUS.md)、[验证日志](reports/validation.log)。
- 远程 Actions、可下载 Artifacts 和公网 Pages 必须另外核实；工作流文件存在不等于已运行或已发布。禁止把未核实 URL 当交付网站。

## 快速开始

需要 Node.js 20+、Python 3.11+、FFmpeg/FFprobe。Ubuntu CI 使用 Node 24、Python 3.12 和 `ubuntu-24.04`。

```bash
git clone --recurse-submodules https://github.com/guoanze550-commits/movie.git
cd movie
bash scripts/setup.sh
bash scripts/verify.sh
npm run studio
```

`npm run studio` 在本地 8080 端口提供 `studio/` 静态工作台。云环境验收通过本地 HTTP 与浏览器测试完成，不提供虚构公网预览。无后端、无服务密钥；浏览器下载配置后须保存进仓库。

安装脚本使用 submodule 固定 SHA、官方 npm lockfile 和本工程 `requirements-core.lock`（包含全部 Python 传递依赖）。可重复运行。默认缓存写入仓库忽略的 `.cache/`。首次浏览器下载需要 `cdn.playwright.dev`；如果已有 Chromium，脚本通过官方支持的 `PLAYWRIGHT_CHROME` 使用它。可显式指定该变量。本次实际渲染使用系统 Chromium 154。未关闭 TLS、签名或校验。

已真实尝试官方 `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps`：默认 npm 缓存不可写；修正缓存后，浏览器 CDN 被网络策略拒绝。因此可复现安装脚本采用官方锁文件 `npm ci`、固定 Python venv 和受支持的现有 Chromium 覆盖路径，仍使用原版官方渲染程序。未修改上游实现。

## 选风格与创建项目

1. 在展厅查看 51 张卡片和官方 STYLE.md；无风格会阻止生成任务。
2. 点击“选择此风格”，确认中文名和 slug。
3. 填写名称、主题、时长、画幅、分辨率、帧率、语言、配音、字幕与故事板审核；默认 30 秒、1920×1080、24fps、16:9、中文、原创配乐。竖屏 1080×1920，方形 1080×1080。
4. 下载 `project.json` 并复制 Codex 任务。网页不会直接写 GitHub 或开始渲染。CLI 创建新目录：

```bash
bash scripts/new-film.sh /absolute/path/to/project-input.json
```

输入 JSON 至少含 `id`（英文小写/数字/连字符）、`name`、`theme`、`style`（官方 slug）。其余参数与网页相同。CLI 生成 `films/<id>/project.json` 和 `TASK.md`。既有《文明未央》请用户选定后审核更新配置；CLI 不覆盖已有目录。

原创混合风格标注“非官方”，配置状态为 `awaiting_custom_style_review`；先依据上游 `MY-STYLES.md` 建立独立完整 STYLE.md 和变更记录，渲染测试帧，经用户确认后才能制作。不要更名冒充官方第 52 种风格。

## 制作与渲染

详见 [AGENTS.md](AGENTS.md)。先读官方指南与所选风格全文，再写 `TREATMENT.md`（三个叙事候选、分镜、镜头、情绪弧、精确时间线、音乐节拍和声音表），之后才读 Demo 的技术。用户要求故事板先审时必须等待批准。

作品需提供：`project.json`、`index.html`、`mix.py`、`TREATMENT.md`、`CREDITS`，有字幕时提供 `subtitles.json`。页面实现 `window.render(t)`、`DUR`、`READY`、`EV` 及用于可读性检查的 `TEXTS(t)`。字体自托管。全部随机量固定种子；画面/音乐/音效/字幕共享时间线。

```bash
bash scripts/render.sh films/my-film preview
bash scripts/render.sh films/my-film production
# 技术验收片，不代表正式作品或某一官方风格的完整艺术示范
bash scripts/render.sh fixtures/smoke preview
```

`preview` 将最长边限制为 640 像素，`production` 使用项目尺寸；二者使用相同代码和时间线。脚本调用**原版官方** events、still、readcheck、video、srt、mux；使用 `LEMO_COLOR=bt709`，双遍 loudnorm，质量失败返回非零。重跑会更新该项目 out/ 与 stills/ 下的生成文件。

输出：`out/final.mp4`、`video.mp4`、分轨 WAV、字幕、`quality.json`、`loudness.log`、`build.log`，关键帧在 `stills/`。影片、音频默认不提交 Git；Actions Artifacts 承载大文件。

技术测试包含中文自托管 Noto Sans CJK SC 字体子集，完整字体版权和 SIL OFL 见 `fixtures/smoke/fonts/OFL.txt`。正式片必须按自身用字另做覆盖检查，不能用该四字子集替代完整中文字体。

## 验收与限制

`bash scripts/verify.sh` 依次运行：

- 51 风格元数据、分类、源规范哈希；无风格门禁、混合风格审核门禁、参数边界、CLI 拒绝覆盖。
- 浏览器验证全部卡片、分类、搜索、详情、选择、下载、混合风格、移动端无横向溢出、无 JavaScript 错误。
- 官方页面接口、乱序重复定位帧完全一致、中文字体实际字形覆盖。
- 首/中/尾和固定抽样时间在 640×360 与 1920×1080 之间的归一化画面误差检查。
- 0.2 秒动作连续帧、完整 144 帧短片、事件与字幕导出、官方文本可读性。
- 实际 MP4 宽高、帧率、H.264/AAC/yuv420p、时长、视听轨时差、整片解码、黑屏、运动存在、字幕时长、实测响度/真峰。

这些证明工程链路可用，不证明正式电影艺术质量。镜头表现、风格符合度、字幕遮挡、表演、主观听感和史实/素材权利仍需人工审核。3D 当前使用 SwiftShader 软件渲染，重型 3D 需要 GPU 与对应风格素材包；未声称全部 51 种风格都已逐片重渲染。

### 可选配音与音乐

基础环境包括 numpy/scipy/soundfile/soxr，可原创合成配乐并调用官方 sfx。按需在上游执行官方 `setup.sh deps voice` 或 `deps music`，并使用官方 TTS/ASR、采样器与乐器下载工具。仅用基础合成不下载数百 MB 模型/乐器。中文在线 voice 使用 edge-tts，依赖 Microsoft 语音服务；本环境网络策略拒绝 `speech.platform.bing.com`，未生成中文语音或验收 ASR。默认项目“配音开启”是创作需求，不表示服务已验证。该项阻塞未来配音作品，不阻塞无配音的部署测试。

## GitHub Actions 与发布

- `test.yml`：push/PR/手动触发，安装固定依赖、UI 与端到端渲染验收、始终上传测试产物。
- `render.yml`：手动选择 `project` 与 `preview/production`，验证目录及风格状态，调用官方程序、合成与封装、质量报告；失败也收集已有日志及关键帧，保存 30 天。
- `pages.yml`：手动构建并发布静态 studio。需在仓库 Settings → Pages 选择 GitHub Actions，并有 Pages 发布权限。

上传后工作流通过官方 download-artifact 重新下载产物，并对下载副本执行完整解码、码流检查和 SHA256 记录；这一步必须实际成功才算远程产物验收。

GitHub Actions 引用已锁定到真实远程 tag SHA（见 `reports/actions-lock.json`）。输入通过环境变量传递，不插值执行 shell；渲染脚本拒绝目录穿越和未选风格。

有权限后实际执行并核实：

```bash
gh workflow run render.yml --ref studio-bootstrap -f project=fixtures/smoke -f profile=preview
gh run list --workflow render.yml
gh run watch RUN_ID --exit-status
gh run download RUN_ID --dir downloaded-artifacts
# 查看真实 quality.json、ffprobe/ffmpeg 解码；不是仅检查工作流绿灯
gh workflow run pages.yml --ref studio-bootstrap
```

首次空仓库没有 main 的提交，无法创建以 main 为 base 的普通 PR；开发保存在 `studio-bootstrap`，不伪造 PR。远程推送/API/工作流的实际结果以 `reports/STATUS.md` 为准。需要先建立用户认可的默认分支，再进行常规 PR 审核。没有将配置保存、源码提交或工作流文件存在说成已发布网站。

## 更新上游

只在明确维护任务中升级 submodule；审核差异，更新 `upstream/COMMIT`、Python 锁文件及风格索引，再重跑验收。普通 setup 不自动追随 main，不修改上游文件。当前官方 51 风格若以后发生增删，索引生成器会失败提示维护，而不会悄悄遗漏。

预览图是官方仓库原始海报，标明官方示例，不冒充原创作品。完整风格视频从官方发布源加载；加载失败时明确提示，仍可看本地随工程保存的真实预览图。
