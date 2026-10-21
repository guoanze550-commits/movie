export function projectConfig(input, catalog) {
  const slug = String(input.id || "").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw Error("项目 ID 仅允许小写英文、数字和单个连字符");
  if (!String(input.name || "").trim() || !String(input.theme || "").trim())
    throw Error("请填写作品名称和主题");
  const style = catalog.find((s) => s.slug === input.style);
  const custom = input.style === "custom-mix";
  if (!style && !custom)
    throw Error("需要先选择风格，不能以 unselected 开始创作");
  if (custom && !String(input.custom_style || "").trim())
    throw Error("请明确填写混合风格方案；这是非官方风格，需另行确认测试帧");
  const duration = Number(input.duration ?? 30),
    fps = Number(input.fps ?? 24);
  if (!Number.isFinite(duration) || duration < 1 || duration > 600)
    throw Error("时长应在 1–600 秒之间");
  if (![24, 25, 30, 60].includes(fps)) throw Error("帧率应为 24、25、30 或 60");
  const aspect = input.aspect || "16:9",
    sizes = { "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080] };
  if (!sizes[aspect]) throw Error("不支持的画幅");
  const width = Number(input.width ?? sizes[aspect][0]),
    height = Number(input.height ?? sizes[aspect][1]);
  if (
    ![width, height].every(
      (n) => Number.isInteger(n) && n >= 16 && n <= 8192 && n % 2 === 0,
    )
  )
    throw Error("分辨率必须是 16–8192 之间的偶数像素");
  if (Math.abs(width / height - sizes[aspect][0] / sizes[aspect][1]) > 0.01)
    throw Error("分辨率与所选画幅不一致");
  return {
    id: slug,
    name: String(input.name).trim(),
    theme: String(input.theme).trim(),
    status: custom ? "awaiting_custom_style_review" : "configured",
    style: input.style,
    style_path: style?.style_path || `styles/custom/${slug}/STYLE.md`,
    upstream_commit: catalog[0].upstream_commit,
    custom_style: custom ? String(input.custom_style).trim() : null,
    duration,
    width,
    height,
    fps,
    aspect,
    language: input.language || "zh-CN",
    voice: !!input.voice,
    subtitles: !!input.subtitles,
    music: "original",
    storyboard_review: !!input.storyboard_review,
  };
}
export function taskPrompt(p) {
  if (!p.style || p.style === "unselected") throw Error("请先选择风格");
  return `请在 films/${p.id}/ 制作《${p.name}》。主题：${p.theme}。\n风格：${p.style}；完整规范：${p.style_path}；上游版本：${p.upstream_commit}。${p.custom_style ? `\n非官方混合风格：${p.custom_style}。先编写完整 STYLE.md 和 CHANGES.md，真实渲染测试帧，等待用户确认。` : ""}\n时长 ${p.duration} 秒，${p.width}×${p.height}，${p.fps}fps，语言 ${p.language}。配音 ${p.voice ? "开启" : "关闭"}；字幕 ${p.subtitles ? "开启" : "关闭"}；原创配乐。故事板审核：${p.storyboard_review ? "需要，真实代码渲染后等待用户批准" : "不需要"}。\n首先完整阅读本仓库 AGENTS.md 以及上游 AGENTS.md、DIRECTOR.md、TECHNIQUE.md、core/README.md 和所选 STYLE.md。先写 TREATMENT.md（三种叙事结构候选、最终方案、分镜、精确时间线、音乐节拍表、声音设计表），再参考官方 Demo 的技术，禁止复制故事。使用官方逐帧工具、确定性 render(t)、DUR、READY 和统一 timeline，保持官方依赖不变。交付源代码、build.sh、CREDITS、MP4、poster、适用的 SRT、关键帧及真实质量报告；运行页面、字体、可读性、连续性、黑屏、编解码、视听同步、响度与预览一致性检查，另列人工审美审核。`;
}
