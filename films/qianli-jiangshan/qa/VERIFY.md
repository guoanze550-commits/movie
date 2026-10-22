# 验证范围与重现命令

- 上游完整性：`git diff --exit-code --submodule=short -- upstream/lemo-opuscar`；vendor 三模块与固定上游逐字节比较。
- 原生接口与页面错误：官方 `openDemo()` / `events.mjs`，任何 JS 或 script 加载错误立即失败。
- 画面采样：官方 still.mjs，每 0.2 秒采样；三张艺术测试帧另用同一原生工具生成。
- 实际显示的 TECH TEST 标记：官方 readcheck，不伪报没有显示的字幕，也不将无文字检查当作通过。
- 任意时刻确定性：`node films/qianli-jiangshan/qa/review.mjs`，四个非整帧随机时刻反序重渲染，比较无损 PNG SHA-256。
- 摄影机/形态连续性：97 个连续时刻，验证同一镜头没有瞬移、形态增长连续。不是正式片六个镜头的空间验收。
- 编码/画幅/帧率/音画时长/全片解码/黑屏/动态存在/响度/真峰值：仓库 `scripts/quality.py` 的 `preview/out/quality.json`。
- 原始音乐、动作声、环境声独立 WAV 和合成源码保留在构建产物中。
- Actions 通过现有上传后下载流程再次解码产物，`verify-downloaded.py` 保存报告。

本轮不适用：正片字幕和中文字体覆盖、配音 ASR、修复师动作与衣物、完整白鹤轨迹、60 秒剪辑/声音同步。不能把四秒测试的绿色检查当作整片通过。艺术、节奏和听感仍待人工审核。
