# 来源与许可

- 原创主题及制作要求：用户《千里江山：数字苏醒》重制简报。原创艺术地形、水系侵蚀、松树、桥亭、镜头、时间轴与合成声音随本工程交付。
- Lemo-Opuscar（lemomo-ai/lemo-opuscar），固定SHA b5e8ef93930b6d828f352055a689320f138237b1，MIT。采用官方 LiDAR Survey 规范、其点云/实体共享扫描平面、UInt16数据结构、掠射光/短半径AO和C1相机技术思想；shader和相机数学结构有改写复用。原许可保留于 LEMO-LICENSE。没有复制其真实场地、数据、石墙故事、读数、音乐或镜头路径。
- `frames/style-comparison.jpg`左栏为官方LiDAR Survey海报（同一MIT上游），右栏为本片测试，仅供风格对照，不作为本片镜头素材。
- 实际渲染、事件、阅读检查、合成与封装：未修改的官方 core 工具。Three.js r170及其 EffectComposer、UnrealBloomPass、OutputPass 来自官方固定npm依赖，MIT。
- IBM Plex Mono Regular 与 Noto Sans SC：Google Fonts，SIL Open Font License 1.1；自托管文件和原OFL见 fonts/。Noto经过字形子集化，`tools/fonts.py`可复现并检查使用字覆盖。来源 https://github.com/google/fonts/tree/main/ofl/ibmplexmono 与 https://github.com/google/fonts/tree/main/ofl/notosanssc 。
- 无外部扫描数据、照片、文生图、AI视频、商业素材或商业录音。所有“点”是艺术模型采样，不是真实LiDAR回波。
- 声音为原创程序合成FM、低通音垫、鼓击与风声，使用官方 MIT sfx.py 的滤波、噪声、分轨叠加函数；无旁白，无取样曲目。
- FFmpeg 7.1.5、libx264 / AAC 由仓库已有固定源码构建流程使用；二进制不提交作品Git。
