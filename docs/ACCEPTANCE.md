# 交付与验收矩阵

| 项目 | 本机证据 | 远程/用户入口 |
|---|---|---|
| 官方原生集成 | 固定 submodule SHA，上游 diff 为空；官方渲染命令实际执行 | 源码分支 studio-bootstrap |
| 51 官方风格 | catalog 源规范哈希测试、51 真实官方海报、10 类 | 静态站点已构建；Pages 发布待验收 |
| 风格管理 UI | Chromium 自动点击、中文搜索、选择、详情、下载与移动端测试通过 | npm run studio；公网 URL 未冒充交付 |
| 创建项目 | CLI 真实创建/拒绝覆盖；网页 JSON 下载；分辨率/时长等边界校验 | 作品在 films/，不会写上游 |
| 文明未央 | awaiting_style / unselected | 等待用户选风格，不启动正片 |
| 最小渲染 | 原版 events/still/readcheck/video/srt/mux；144 帧完整解码 | fixtures/smoke/out/final.mp4 |
| 音频 | 音乐/音效/环境独立 WAV，最终 -14 LUFS，AAC | 中文 TTS 生成/解码通过；ASR 待正式制作时验收 |
| 质量 | quality.json、字体覆盖、确定性、尺寸一致性、关键帧、字幕、音画时长 | 不能代替艺术质量与主观听感审核 |
| Actions | 工作流固定 SHA，远程两项作业通过，Artifact 重新下载/解码通过 | 真实运行链接在 STATUS.md；Pages 启用操作需所有者完成 |
| 代码交付 | 本地 commit，HTTPS push，git ls-remote SHA 核实 | 新建空仓库 main 审核基线，完整平台见真实 PR #1 |
| 云环境 | install_script/start_skill/所需域名已保存草稿 | 需用户在环境设置审阅、保存、发布；未验证新任务恢复 |

最终状态以 reports/STATUS.md 及对应真实 Actions 运行页面为准。本矩阵不声明尚未完成的远程验收成功。
