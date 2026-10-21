# 真实验收记录

本机日期：2026-10-21。本机部署与渲染已通过；远程发布/Actions 尚未验收，不能宣布全部部署条件满足。

## 已通过

- 官方源码 HEAD：b5e8ef93930b6d828f352055a689320f138237b1（Git submodule，未修改上游跟踪文件）。
- Node 24.19.0、Python 3.12.14、FFmpeg 7.1.5、Chromium 154.0.8037.57。
- `bash scripts/setup.sh` 安装及重复执行通过；官方 npm lockfile + Python 完整版本锁。
- 七项现有工程单元/CLI测试全部通过（非零测试数量）。
- UI 真实 Chromium 测试通过：51 卡片、10 分类、中文搜索、详情、风格门禁、选择、JSON 下载、混合风格、移动端、无页面 JS 异常。
- 官方页面接口、乱序 seek 确定性、中文字体字形覆盖通过。
- 预览/正式尺寸首中尾与抽样帧，6 对误差小于 5/255（归一化平均像素误差）。
- 官方渲染全流程：6 秒 / 144 帧 / 640×360 / 24fps，H.264 + AAC，BT.709/yuv420p；事件导出、文本可读性、SRT 导出通过。
- 真正整片解码、黑屏检测、帧变化、轨道时长、字幕时长、响度与真峰检查通过。最后实测 -14.0 LUFS、-9.3 dBFS 真峰。
- 本地构建静态站点和产物收集脚本已执行。

## 故障与修正

1. 官方 deps 命令首次因默认 ~/.npm 缓存不可写失败；设定 workspace 缓存后 npm 成功。
2. Playwright CDN 被代理拒绝，采用官方支持的 PLAYWRIGHT_CHROME=/usr/bin/chromium。没有改官方工具、禁用验证或伪造浏览器下载成功。
3. 初次视频使用官方全范围默认色彩，严格 yuv420p 检查失败；按官方文档设置 LEMO_COLOR=bt709 后通过。
4. 初次稀疏脉冲混音峰均比过大，官方 mux 警告 -18 LUFS / +0.2 dBFS；重做测试片分轨平衡后达 -14 LUFS / -9.3 dBFS。最终质量程序强制检查响度和真峰，不把警告忽略为通过。

## 尚未验证或需要外部条件

- GitHub API 调用被出口代理拒绝（HTTP CONNECT 403）；gh 的认证状态也不能证明写权限可用。未假设 Git HTTPS 访问等于 API/Actions 权限。
- 官方视频域名 lemomo-ai.github.io 被出口代理拒绝；全部 51 张本地预览是实际官方海报，不是占位假图。已提供加载失败说明和官方链接。
- 中文语音服务 speech.platform.bing.com 被出口代理拒绝。voice/music 扩展层及 ASR 模型未安装验收，当前只验证核心合成与官方音效。
- 3D 检测到软件渲染，未验收重型 GPU 风格、所有风格的素材依赖、全部官方演示逐片重渲染。
- 正式作品尚未制作；人工审美与听感审核未完成，不可宣称达到电影级艺术质量。
- 云配置保存不等于发布；尚未验证新云任务快照恢复。

《文明未央》仍为 awaiting_style / unselected，仅保留项目配置，没有正式片源码或成片。

## GitHub 与云配置实际状态

- 首次源码提交 af6a674781492cb4e18c3d200dd966ec0fe70af5 已推送到用户仓库 studio-bootstrap，并通过 git ls-remote 验证。后续状态修订提交见 Git log。
- 远程 main 不存在，因此没有可作为 base 的 main 提交；未创建或伪造 PR。
- 已保存云配置 install_script、start_skill 以及四个额外出口域名：cdn.playwright.dev、api.github.com、lemomo-ai.github.io、speech.platform.bing.com。草稿保存成功，尚需环境设置中审阅、保存并发布；这没有改变当前实例的代理策略。
- GitHub HTTPS 推送成功不代表 API 可用。GitHub 网页已核实首次自动测试运行 39574913668 失败，安装依赖与浏览器步骤成功，失败位于验收步骤；Artifact 12334341306 已生成，但未登录下载端点返回 404，未能下载核实。API 仍被策略阻止，已通过公开 CI 注释定位 Ubuntu FFmpeg 6 loudnorm 输出 PTS 偏移，时间戳重置实验未解决问题，已移除；改为 CI 从官方固定 FFmpeg 7.1.5 源码构建，并保留全部官方校验，正在重跑。未核实 Pages 站点。访问证据见 remote-web-check.json。

## Pages 实际执行

- 运行 https://github.com/guoanze550-commits/movie/actions/runs/39576556224 ：静态站点构建成功，生成 github-pages Artifact；deploy-pages 返回 404，明确要求先在仓库 Settings → Pages 启用 GitHub Actions 来源。未发布可验证的线上工作台。此设置需要仓库管理权限；当前 GitHub API 出口被拒绝，不能替用户完成设置。
