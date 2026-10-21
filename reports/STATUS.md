# 实际验收状态 · 2026-10-21

**平台源码、工作台、本机与远程渲染已通过；公网 Pages 尚未上线，不能宣称全部上线条件完成。**《文明未央》仍为 `awaiting_style / unselected`，未制作正片。

## 已完成与证据

- 官方 Lemo-Opuscar 固定 submodule：`b5e8ef93930b6d828f352055a689320f138237b1`。官方 `core/`、`styles/` 跟踪文件未改。
- 全部 51 风格、10 官方分类、中英文名称、slug、完整 STYLE.md、规则提取、源文件哈希、真实官方海报及示例链接。目录与官方逐项比对通过。
- 工作台真实 Chromium 验收：卡片/分类/中文搜索/详情/选择/配置下载/任务生成/混合风格/画幅与分辨率/移动端/加载失败提示/无 JS 异常。
- 7 项单元与 CLI 集成测试全部通过；未选风格拒绝生成或渲染；拒绝覆盖作品目录与非法参数。
- 官方页面契约与乱序 seek 确定性；中文字体字形覆盖；6 对首中尾与固定抽样帧的预览/正式尺寸一致性检查通过。
- 原版官方 events/still/readcheck/video/srt/mux 实际执行：6 秒、144 帧、640×360、24fps、H.264/AAC、BT.709/yuv420p。事件、0.2 秒连续帧、字幕、整片解码、黑屏、音画时长、响度检查通过。实测 -14.0 LUFS、-9.3 dBFS 真峰。
- 原版 mux 对真实截断 WAV 的拒绝检查通过，没有降低损坏文件验证。
- 官方 FFmpeg n7.1.5 源码 SHA `3a0867c2bfda4a4d4309ca1a8cbdc6175e67f587` 在本机实际构建，并以该二进制重复 setup + verify 通过；CI 同样固定源码并缓存构建。
- 中文在线 TTS 已实际生成：官方 `core/tts/tts_zh.py`，`zh-CN-XiaoxiaoNeural`，2.364 秒、24kHz、单声道 WAV，整段解码通过。代理与平台 CA 适配保持 TLS 证书及主机名校验。见 `voice-smoke.json`。

## GitHub 已核实

- 源码推送到 `studio-bootstrap`，完整平台 PR：[Pull Request #1](https://github.com/guoanze550-commits/movie/pull/1)。原先没有 main 提交，因此新建了最小审核基线，并用 `codex/studio-review` 提交完整源码供审查；没有覆盖已有 main 或重写原始开发分支历史。PR 保持未合并。
- [CI 运行 39578090995](https://github.com/guoanze550-commits/movie/actions/runs/39578090995)：`test` 与 `official-render-smoke / render` 两项作业均 **success**。后者实际调用 `render.yml` 本身。
- 此运行已上传 `studio-validation`（Artifact 12334997285）与 `film-render-39578090995`（Artifact 12334967584）。两项作业都使用官方 download-artifact 从服务重新下载，再对下载副本执行 MP4 完整解码与 SHA256 记录。
- PR 初始源码的四项检查（push 与 pull_request 各两项）也已在 API 核实 success；最终更新以 PR 的 Checks 为准。
- 当前云实例直接下载 GitHub Artifact 仍被 Azure Blob 分片出口策略阻止；这与 CI 内已成功完成下载/解码区分。已保存所需网络规则，未伪称本机下载成功。

## 已诊断并解决的问题

1. 默认 npm 缓存不可写：改用 workspace 中的缓存。
2. 初期 Playwright CDN 不可访问：用官方支持的 PLAYWRIGHT_CHROME 指向已有 Chromium；后续网络配置已允许 CDN。
3. 官方全范围视频与严格像素格式检查不符：使用官方文档支持的 LEMO_COLOR=bt709。
4. 稀疏脉冲混音峰均比过高：调整原创测试片分轨平衡，最终响度和真峰达标，程序强制验证。
5. Ubuntu FFmpeg 6 的 loudnorm 进度仅报告 3.1 秒，导致官方 mux 拒绝完整 6 秒 WAV。重置 PTS 的实验没有奏效，已经删除。最终使用固定官方 FFmpeg 7.1.5，原有校验保持，远程通过。
6. 中文 TTS 直接 DNS 连接失败，代理后 certifi 信任链不包含平台 CA：通过 edge-tts 支持的 proxy 参数与 SSLContext 添加平台提供的 CA 解决；未关闭证书或主机名验证。

## 唯一必需的公网发布操作

[Pages 运行 39576556224](https://github.com/guoanze550-commits/movie/actions/runs/39576556224) 的站点构建成功并产生 github-pages Artifact；deploy-pages 因站点未启用返回 404。

后续实际通过 GitHub API 创建 Pages 站点返回 **403 Resource not accessible by integration**。虽然仓库元数据列出 admin 权限，当前集成仍缺此操作的权限。需要仓库所有者在 [Settings → Pages](https://github.com/guoanze550-commits/movie/settings/pages) 将来源设为 **GitHub Actions**，再重跑 Publish studio。尚无已上线的工作台 URL，不提供虚构演示链接。

## 云配置与剩余限制

- 已保存 install_script、start_skill、所需网络规则；最终 checkout 的 SHA/mount_path 也将记录到环境草稿。保存草稿不是发布快照；请在环境设置中审阅、保存并发布。未验证新任务恢复。
- GitHub API 与官方在线视频域名现已从本机实测可访问；Pages 创建的 403 是操作权限问题，不再描述为 API 网络不通。
- Azure Blob 不同 Artifact 使用不同分片主机，已保存 GitHub Artifact 下载所需 `*.blob.core.windows.net` 规则。当前实例传播和发布状态需实际操作确认。
- 中文 TTS 生成/解码已通过；ASR 模型与整片配音听感尚未验收。完整 Kokoro/Whisper、numba/采样乐器扩展层按正式作品需求安装，没有冒充已安装。
- 3D 当前为 SwiftShader 软件渲染；未声称重型 GPU 风格、所有特殊素材依赖或全部 51 官方 Demo 都已重渲染。
- 艺术质量、镜头/表演、字幕遮挡、风格符合度、主观听感与史实/素材权利仍需人工审核。技术测试不是正式作品，也不证明电影级艺术质量。
