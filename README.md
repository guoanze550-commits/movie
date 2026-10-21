# Movie · Codex 代码动画制作工作室

基于 **官方 Lemo-Opuscar 源码** 的长期创作工程：风格展厅、项目配置、导演规范、确定性逐帧渲染、音频混音、质量报告及 GitHub 自动化。用户选定风格后，Codex 按所选规范创作；不依赖 Claude Code CLI。

**《文明未央》仅有未启动的项目配置，风格为 `unselected`。本轮没有制作其正片，也没有替用户选择风格。**

## 当前状态

- 官方 Git submodule：`upstream/lemo-opuscar`，固定版本见 [upstream/COMMIT](upstream/COMMIT)。上游 core/、styles/ 保持原样。
- 全部 51 种官方风格、10 个官方分类：索引包含中英文名称、slug、适用题材、全文规范、色彩、运动、镜头、声音、材质、引擎要求、源文件哈希与固定版本链接。
- 可交互网页：分类、中文搜索、真实官方示例帧、详情、官方视频链接、风格选择、配置下载、Codex 任务复制及非官方混合风格。
- 项目生成器：网页生成配置并下载；CLI 写入独立作品目录，拒绝覆盖已有目录。不自动生成未经导演设计的影片源码。
- 本机通过：7 个单元/集成测试、真实 Chromium UI 测试、官方逐帧渲染及 MP4 验证。详见 [reports/STATUS.md](reports/STATUS.md)、[验证日志](reports/validation.log)。
- 远程 Actions 两项作业与 Artifact 上传、重新下载和 MP4 解码已通过：[真实运行与产物](https://github.com/guoanze550-commits/movie/actions/runs/39578090995#artifacts)。公网 Pages 尚未上线：创建站点 API 返回 403，需所有者启用 GitHub Actions 来源。

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

Ubuntu FFmpeg 6 的 loudnorm 进度/时长行为导致官方 mux 将完整 WAV 判为截断。单纯校正 PTS 的实验未解决问题，已移除。CI 使用 `scripts/install-ffmpeg.sh` 从官方 FFmpeg n7.1.5 的固定 commit `3a0867c2bfda4a4d4309ca1a8cbdc6175e67f587` 编译，启用 libx264，保留原版官方校验，并缓存构建产物。构建需要 gcc/make/pkg-config/libx264-dev，限制最多四个编译任务。本机已具有 FFmpeg 7；另外验证相同源码构建。实际截断 WAV 仍需被拒绝。

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
- 官方页面接口、乱序重复定位帧完全一致、固定种子 20261021 的五个随机抽帧、中文字体实际字形覆盖。
- 首/中/尾和固定抽样时间在 640×360 与 1920×1080 之间的归一化画面误差检查。
- 0.2 秒动作连续帧、完整 144 帧短片、事件与字幕导出、官方文本可读性。
- 实际 MP4 宽高、帧率、H.264/AAC/yuv420p、时长、视听轨时差、整片解码、黑屏、运动存在、字幕时长、实测响度/真峰。

这些证明工程链路可用，不证明正式电影艺术质量。镜头表现、风格符合度、字幕遮挡、表演、主观听感和史实/素材权利仍需人工审核。3D 当前使用 SwiftShader 软件渲染，重型 3D 需要 GPU 与对应风格素材包；未声称全部 51 种风格都已逐片重渲染。

### 可选配音与音乐

基础环境包括 numpy/scipy/soundfile/soxr，可原创合成配乐并调用官方 sfx。中文配音已额外安装独立 `.venv-voice`，版本锁定在 `requirements-voice-zh.lock`，实际调用官方中文入口完成 2.364 秒语音生成与解码。为适配云环境，包装器仅使用 edge-tts 支持的代理参数，并为其 SSLContext 加载平台已有 CA；证书和主机名校验保留。

```bash
bash scripts/setup-voice-zh.sh
.venv-voice/bin/python scripts/voice-zh.py fixtures/voice-smoke/lines.json fixtures/voice-smoke/out
```

这只准备中文在线入口所需依赖，不冒充完整 voice tier。需要离线 Kokoro、ASR 或实体采样乐器时，再执行官方 `setup.sh deps voice` / `deps music` 及 fetch 工具。未声称中文 ASR/主观听感或正式片整段配音已通过；正式片须继续官方语音检查与混音验收。

## GitHub Actions 与发布

- `test.yml`：源码 push/PR/手动触发，安装固定依赖、UI 与端到端渲染验收、始终上传测试产物，并调用 render.yml 做独立渲染验收。
- `render.yml`：手动选择 `project` 与 `preview/production`，验证目录及风格状态，调用官方程序、合成与封装、质量报告；失败也收集已有日志及关键帧，保存 30 天。
- `pages.yml`：手动或 studio 源码推送后构建并发布静态 studio。需在仓库 Settings → Pages 选择 GitHub Actions，并有 Pages 发布权限。

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

原先空仓库没有 main 提交，现已创建最小 main 审核基线；完整源码在 [PR #1](https://github.com/guoanze550-commits/movie/pull/1) 中审查，原始开发历史保存在 `studio-bootstrap`。PR 未合并，没有覆盖既有 main 或重写开发分支。Pages 创建操作因集成权限返回 403；需仓库所有者在 Settings → Pages 选择 GitHub Actions 后重跑发布。

## 更新上游

只在明确维护任务中升级 submodule；审核差异，更新 `upstream/COMMIT`、Python 锁文件及风格索引，再重跑验收。普通 setup 不自动追随 main，不修改上游文件。当前官方 51 风格若以后发生增删，索引生成器会失败提示维护，而不会悄悄遗漏。

预览图是官方仓库原始海报，标明官方示例，不冒充原创作品。完整风格视频从官方发布源加载；加载失败时明确提示，仍可看本地随工程保存的真实预览图。
