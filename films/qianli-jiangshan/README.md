# 千里江山，走出画卷 · BEYOND THE SCROLL

本目录是第一轮导演与美术审查工程。**尚未获准制作完整正片。**

- [导演方案](TREATMENT.md)：三种叙事结构、选定方案、六镜 60 秒时间表、镜头、表演与声音设计。
- [原创风格规范](style/STYLE.md)：宋韵青绿山水；以官方 `paper-lantern` 为基础的非官方扩展，不计入官方 51 种风格。
- `frames/landscape.jpg`、`pigment.jpg`、`crane.jpg`：实际 WebGL 逐帧工具渲染的 1920×1080 风格测试，不是 AI 图片。
- `preview/out/final.mp4`：4 秒、1920×1080、24fps 技术测试，Actions Artifacts 内可下载；不是完整影片。
- [美术审查记录](qa/ART-REVIEW.md)：未通过人工定稿的事项。
- `qa/technical.json`：随机时刻重复渲染和连续曲线检查的实测数据。

## 复现

先运行仓库 `scripts/setup.sh`，并安装项目固定的 FFmpeg 7.1.5（`scripts/install-ffmpeg.sh`）。然后在仓库根运行：

```sh
bash films/qianli-jiangshan/build.sh
PLAYWRIGHT_CHROME=/usr/bin/chromium node films/qianli-jiangshan/qa/review.mjs
```

若环境使用 Playwright 自带 Chromium，可省略 `PLAYWRIGHT_CHROME`。原生的 `events.mjs`、`still.mjs`、`readcheck.mjs`、`video.mjs`、`sfx.py` 和 `mux.sh` 完成事件、采样、阅读时长检查、逐帧渲染、声音合成与封装。项目没有另一套视频渲染器。

在 **Render film** 工作流中选择本分支，输入 `project=films/qianli-jiangshan/preview`、`profile=production`。这里 production 仅表示测试片使用 1080p 输出，不授权 60 秒正片。根 `project.json` 仍由 `awaiting_custom_style_review` 阻止整片构建。

原生外部项目服务器只能挂载一个工程目录，因此 preview 中的 `src`、`vendor`、`timeline.js` 是指向同一原创源码的 Git 符号链接，不复制两份实现。预览与正式规划分别导出在同一 `timeline.js` 的 REVIEW / PLAN；本轮只使用 REVIEW。

风格帧复现示例：

```sh
PLAYWRIGHT_CHROME=/usr/bin/chromium node upstream/lemo-opuscar/core/render/still.mjs "$PWD/films/qianli-jiangshan" 2.5 --q shot=landscape --size 1920x1080 --out "$PWD/films/qianli-jiangshan/out/landscape"
```

将 shot 改为 pigment 或 crane 得到另外两帧。默认无 query 是连续形态测试。帧内 TECH TEST 标签属于审查标记，不是正片字幕。

## 本轮边界

修复师表演、放大镜穿越、完整白鹤飞行长镜头、世界归卷、正式中文题字及旁白均只有导演规划，尚未动画制作。4 秒声音为原创合成音色草图，并非录制古琴，也未作为最终电影配乐验收。技术检查不能代替风格审核、故事板审核和听音审核。收到用户审核后再继续。
