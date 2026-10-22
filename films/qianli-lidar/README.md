# 千里江山：数字苏醒 · LiDAR 视觉重制

本目录只包含首轮 **7秒、1920×1080、24fps** 视觉测试。完整45秒正片没有开始，`production_authorized=false`，必须等待用户审核画面。

采用官方 **LiDAR Survey / 点云测绘**，真实 WebGL 三维点、空间分类、深度遮挡、扫描与切面；全部数据为 **艺术重建 · 非实测**。不声称历史地形复原、真实激光回波、考古发现或测量精度。

旧青绿纸雕方向停止。`films/qianli-jiangshan/` 原始审查资料从 `film/qianli-jiangshan-review` 原样保留，未覆盖也未继续制作。

## 审查材料

- `TREATMENT.md`：三种结构、选择理由、45秒四阶段规划、本轮7秒逐秒镜头与声音。
- `frames/mountain.jpg`：高密度三维山体；`valley.jpg`：低机位入谷；`scan.jpg`：点云/实体同址扫描。
- `out/final.mp4`：官方逐帧工具生成的7秒测试视频，H.264/AAC。使用GitHub Actions Artifacts交付，不提交视频/音轨到Git。
- `TECHNICAL.md`、`FACTS.md`、`CREDITS.md`：技术、真实性、来源及许可。
- `qa/data.json`、`qa/technical.json`、`out/frame-continuity.json`、`out/quality.json`：数据、空间、全帧和封装实测结果。
- `qa/ART-REVIEW.md`：人工画面审查和未定稿项目。自动绿色检查不表示已经达到顶级展览美术标准。

## 单命令复现

完成仓库 `scripts/setup.sh` 和固定 FFmpeg 7.1.5 安装后：

```sh
bash films/qianli-lidar/build.sh
```

加 `--data` 可从原创预处理算法重新生成60个量化空间块。字体已经自托管；若要重做子集，使用官方venv运行 `tools/fonts.py`。没有运行期字体/网络数据依赖。

关键帧示例（仓库根执行，系统Chromium可用时）：

```sh
PLAYWRIGHT_CHROME=/usr/bin/chromium node upstream/lemo-opuscar/core/render/still.mjs "$PWD/films/qianli-lidar" 5 --q shot=mountain --size 1920x1080 --out "$PWD/films/qianli-lidar/out/mountain"
```

另外两张用 `shot=valley`、`shot=scan`；全部使用同一数据和shader，改变取景及扫描时刻，没有额外文生图。默认页面即连续7秒测试。

验证：

```sh
upstream/lemo-opuscar/.venv/bin/python films/qianli-lidar/tools/verify-data.py
PLAYWRIGHT_CHROME=/usr/bin/chromium node films/qianli-lidar/qa/review.mjs
upstream/lemo-opuscar/.venv/bin/python films/qianli-lidar/qa/video.py
```

GitHub **Render film**：本分支，`project=films/qianli-lidar`，`profile=production`。这里production仅表示测试片以1080p输出，不授权完整45秒制作。下载包保留关键帧、视频、声音分轨、实际构建日志与QA；源码、量化数据和复现脚本保留在本分支。
