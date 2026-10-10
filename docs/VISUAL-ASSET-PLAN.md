# Atoms Lite 视觉素材生成与上线方案

> 调研日期：2026-10-10（Asia/Taipei）。状态：方案与实施规格，尚未生成素材、接入组件或部署。对应部署后扩展计划，不能计入现有验收结果。

## 1. 建议与现有约束

本方案已扩展为整个网站的视觉素材计划，不再只围绕 Agent。**先修复工作台基础交互，再优先制作主题预览卡、空白预览插画和真实示例应用封面**；四角色头像保留为独立素材包。Logo 和交互 UI 继续用 SVG / React / CSS。

本次新增范围与验收以 [视觉素材验收](VISUAL-ASSET-ACCEPTANCE.md) 为准；前置问题见 [UI 基础体验审计](UI-AUDIT-2026-10-10.md)。以下第 2–7 节保留头像的具体制作方法，第 9 节扩展全站素材。原“首批仅头像”的建议被本次排序替代。所有素材仍是计划状态。

本方案依据当前 `PRODUCT.md`、`DESIGN.md`、`components/workspace/agent-avatar.tsx`、`components/brand/logo.tsx`、`package.json`、`next.config.ts` 制定：

- 当前头像是 24px / 32px 的有色圆底字母，旁边已展示姓名和角色；保留这两种尺寸及字母降级。
- 品牌承诺是原创 Atoms Lite，不复制 Atoms 官方 Logo、颜色或吉祥物。
- “The Quiet Studio” 要求界面安静，生成应用占视觉中心；不把整个聊天区变成卡通主题。
- 当前 Logo 是简单的 `currentColor` SVG，已经适合缩放和主题切换；无需用生成位图替换。
- `DESIGN.md` 目前明确规定 monogram。实施前同步修改其中 Avatar / Agent message 规则，限定“小范围角色头像可使用原创位图”；本调研不提前改动设计规范。

| 素材 | 第一版范围 | 不做的扩展 |
| --- | --- | --- |
| 四角色头像 | 各一个静态头像，透明背景，同构图、同材质、四种身份点色 | 不为 thinking / success / failed 各画一套；状态继续由真实文字与图标表达 |
| 空状态插画（可选） | 一张 96–144px 小尺寸作品构建意象，只用于确实为空的面板 | 不覆盖错误、额度、加载提示；不延长等待 |
| 分享图（可选） | 1200×630 的本站品牌分享卡，用原创头像组合 | 不假装是用户应用截图；不替代真实项目缩略图 |
| Logo / 小图标 / 对话框 | 沿用 SVG 与现有图标体系；必要时用代码微调 | 不把生成出来的整张 UI 图当成可点击界面 |

## 2. Codex 如何生成

当前环境提供内置 `image_gen`，按本地 [imagegen Skill](/Users/kedeng/.codex/skills/.system/imagegen/SKILL.md) 默认使用它，**无需用户提供 `OPENAI_API_KEY`**。工具可以接受文字与参考图；透明素材设置 `transparent_background: true`。每个角色单独生成，避免一张四宫格拆分时边距与透明边缘不一致。

先生成一个 Mike 样张作为风格基准，再以这张图为视觉参考生成其他三位，保持镜头、大小、材质和光线，只改变角色特征。对已有本地图先查看，再作为参考；一次只修一个偏差。内置工具的参数以当次工具 schema 为准，不把 API 的 `model`、`quality`、`size` 等参数套到内置工具。

官方 API 支持图片生成、参考图编辑及多轮迭代，但官方也提醒：跨次角色一致性、精确文字和构图仍可能失准。因此“同一套提示词”不能替代四张并排的人工验收。[OpenAI Image generation](https://developers.openai.com/api/docs/guides/image-generation)

生成后选中的文件必须复制进项目，不能让网页引用仅存在于 Codex 生成目录的路径。具体来源路径以工具结果为准。失败时保留现有字母头像；不自动改用收费 API。若未来明确选择 API / CLI，再核对当时模型、参数和价格，本方案不预估单张费用，也不更改现有 InsForge LLM 网关。

## 3. 风格规格（实施提案）

**方向：小型哑光陶土感工作伙伴。** 轻微立体感、低饱和、简单面部，亲切但不夸张；不是现成品牌角色的仿制。选择这一方向是设计建议，未进行样张验证。

- 方形透明画布，单个头肩像，占画面约 75–80%，中心、眼线、肩线一致；留足圆形裁切安全区。
- 接近正面，统一柔和左上光，哑光表面、简洁轮廓，无写实皮肤、亮面塑料、霓虹光、复杂阴影。
- 中性暖灰是主体，身份点色沿用：Mike `#8a4b12`、Emma `#9a2d5a`、Bob `#1f5a8e`、Alex `#1e6b43`。背景圆底继续由 CSS theme token 负责，图片内不画圆底。
- 除点色外，用轮廓或发型等大特征区分角色；不只靠颜色识别。24px 下去掉手、文字、工具等细节。
- 图片内不写姓名、职位、状态、Logo、水印；姓名与角色仍使用真实 DOM 文本。
- 不新增持续动画；未来如加动效，也必须遵守 reduced-motion，且不能伪造生成进度。

## 4. 可直接复用的提示词

以下均请求单张图，调用时设置透明背景。尺寸是生产目标，不保证内置工具按提示精确出像素；最终衍生尺寸在导出环节确定。生成 Emma / Bob / Alex 时附上选定的 Mike 图作为**风格参考**，不是需要原样复制的角色。

### Mike — Team Leader / 首张风格基准

```text
Use case: stylized-concept
Asset type: original avatar for Mike, Team Leader, in Atoms Lite's calm web workspace.
Create one friendly matte clay head-and-shoulders character, a rounded head silhouette with a simple swept hair tuft and a calm attentive expression. Neutral warm-grey body, restrained amber-brown accent #8a4b12 on the collar. Original character design.
Square composition, nearly front-facing, centered, head-and-shoulders occupy 75–80% of the image with clear safe margins for a circular crop. Soft upper-left studio light, simple shapes, subtle depth, no glossy plastic.
Genuinely transparent background with alpha; no baked-in circle or ground shadow. Must remain recognizable at 24px and 32px. No text, letters, logos, watermark, hands, handheld props, busy details, neon, or resemblance to existing branded mascots.
```

### Emma — Product Manager

```text
Use case: stylized-concept
Asset type: original avatar for Emma, Product Manager, in Atoms Lite.
Use the supplied Mike avatar only as the visual style reference. Create a distinct friendly matte clay head-and-shoulders character with a simple bob-shaped hair silhouette and an attentive small smile. Neutral warm-grey body, restrained plum accent #9a2d5a on the collar.
Match the reference's camera angle, head scale, eye line, shoulder line, material, lighting, edge softness, and empty margins. Square, nearly front-facing, 75–80% subject coverage, safe for circular crop. Keep the same visual family while changing the character identity.
Genuinely transparent alpha background. Readable at 24px and 32px. No circle backdrop, text, logos, watermark, hands, handheld props, glossy plastic, neon, busy details, or existing branded mascots.
```

### Bob — Architect

```text
Use case: stylized-concept
Asset type: original avatar for Bob, Architect, in Atoms Lite.
Use the supplied Mike avatar only as the visual style reference. Create a distinct friendly matte clay head-and-shoulders character with a softly squared head silhouette, simple short hair and bold round glasses without tiny frame details. Neutral warm-grey body, restrained slate-blue accent #1f5a8e on the collar.
Match the reference's camera angle, head scale, eye line, shoulder line, material, lighting, edge softness, and empty margins. Square, nearly front-facing, 75–80% subject coverage, safe for circular crop. Keep the same visual family while changing the character identity.
Genuinely transparent alpha background. Readable at 24px and 32px. No circle backdrop, text, logos, watermark, hands, handheld props, glossy plastic, neon, busy details, or existing branded mascots.
```

### Alex — Engineer

```text
Use case: stylized-concept
Asset type: original avatar for Alex, Engineer, in Atoms Lite.
Use the supplied Mike avatar only as the visual style reference. Create a distinct friendly matte clay head-and-shoulders character with a simple asymmetric short hair tuft, rounded face and focused friendly expression. Neutral warm-grey body, restrained forest-green accent #1e6b43 on the collar.
Match the reference's camera angle, head scale, eye line, shoulder line, material, lighting, edge softness, and empty margins. Square, nearly front-facing, 75–80% subject coverage, safe for circular crop. Keep the same visual family while changing the character identity.
Genuinely transparent alpha background. Readable at 24px and 32px. No circle backdrop, text, logos, watermark, hands, handheld props, glossy plastic, neon, busy details, or existing branded mascots.
```

若头发或眼镜在缩小时糊成块，修改该角色的大轮廓，而不是继续叠加细节。风格不统一时，回到参考图编辑；不可仅靠 CSS 调色假装统一。

## 5. 目录、格式与素材清单

建议落地结构（以下文件均待创建，当前只存在本文档）：

```text
design-assets/agents/v1/              # 非 public：选中原图与生成记录
  mike.png / emma.png / bob.png / alex.png
  prompts.md
docs/assets-manifest.json            # 非 public：可追溯清单
public/assets/agents/                # 网页实际消费的衍生文件
  mike-v1.webp / emma-v1.webp / bob-v1.webp / alex-v1.webp
public/assets/illustrations/         # 可选
  empty-project-v1.webp
app/opengraph-image.png              # 可选，品牌分享卡
app/opengraph-image.alt.txt
```

保留选中 PNG 的透明原图；头像导出 96×96 WebP（覆盖 32px 的 3× 显示），必要时另出 192×192 展示版。头像建议每张 ≤20KB，四张合计 ≤80KB；空状态 ≤80KB；分享图建议 ≤250KB。这些是本项目预算，不是供应商限制。若超出，先减少无用细节、测试压缩，不牺牲轮廓；超预算需记入验收说明。

导出时保留 alpha，不转 JPEG，不把棋盘格当作透明；在浅色、深色与棋盘背景上检查白边和暗边。可在实施时选择标准图像导出/压缩工具；如采用 sharp，其 WebP 导出支持 alpha 质量与 lossless 控制，需显式加入项目开发依赖而不依赖 Next.js 的间接依赖。[sharp WebP output](https://sharp.pixelplumbing.com/api-output/#webp)

每个 manifest 条目记录：`id`、`version`、`status`（draft/selected/integrated/deployed）、`sourcePath`、`outputPath`、`promptPath`、`referenceAssetIds`、生成日期、工具（built-in image_gen）、模型（仅工具实际返回时填写，否则 unknown）、宽高、字节数、alpha 检查、内容 hash、使用组件、原创建议与参考来源、验收记录、上线 URL 与部署标识（未上线留空）。不记录密钥或浏览器私人信息。

## 6. 放到网上：随现有 Next.js 部署

这个规模无需新建图床。Next.js 15 会把 `public/assets/agents/mike-v1.webp` 暴露为 `/assets/agents/mike-v1.webp`，随项目构建与现有 `npm run deploy` 流程一起发布。文件名版本化，避免覆盖后难以回退；不要假设 public 文件默认具有一年 immutable 缓存，Next.js 的文档默认值是 `public, max-age=0`，部署后读取实际响应头再决定是否增加缓存。[Next.js 15 public](https://nextjs.org/docs/15/app/api-reference/file-conventions/public-folder)

在 `AgentAvatar` 内使用固定宽高的 `next/image`（可以对已压缩的小头像采用 `unoptimized`，减少部署端图像优化服务依赖）；保留外层 24/32px 布局及现有 CSS 圆底。邻接姓名已表达身份时 `alt=""`，不重复朗读；若未来独立显示头像，另给可访问名称。加载失败用现有字母回退。固定尺寸可避免布局偏移。[Next.js 15 Image Optimization](https://nextjs.org/docs/15/app/getting-started/images)

分享图可由已有 SVG Logo、选中头像和真实字体组合；不要让模型生成必须准确的标题文字。最终使用 `app/opengraph-image.png` 与 `.alt.txt`，或未来用 `ImageResponse` 生成；选一种途径即可，避免两处真源。[Next.js 15 OG metadata](https://nextjs.org/docs/15/app/api-reference/file-conventions/metadata/opengraph-image)

本站素材只进入 builder 外壳；不自动注入用户生成代码，不修改 iframe 沙箱，不让纯前端应用获得 builder 凭证。未来若开放“用户上传素材 / 每个项目在线生图”，再单列 InsForge Storage、所有权策略、配额、URL/key 持久化与删除生命周期；这不属于本轮静态素材工作。

## 7. 可执行步骤与验收

1. 在部署后视觉里程碑开始时，更新设计规范的头像规则；保留现有字母头像为回退。确认本方案角色、样式、用途、输出目录仍匹配现状。
2. 用内置生图生成 Mike 首稿，放进 24px / 32px 的工作台上下文查看；确定样张后作为其余三张参考。审美不合格时最多先针对该方向修订两轮，再评估是否保留字母方案，避免无边界迭代。
3. 四张并排校对、检查透明、保存原图与提示词，再做生产尺寸导出与 manifest。可选素材单独排期，不阻塞头像交付。
4. 接入头像组件，保留姓名、职位、真实运行状态。给图片失败加入字母降级；在既有组件样张页展示四角色与两种尺寸，不引入新的产品页。
5. 检查浅/深主题、375px 手机、桌面、慢网、图片 404：无布局跳动、文字仍清楚、四角色可区分、聊天滚动和发送不受影响；仅装饰图不重复朗读。
6. 运行项目要求的 lint / typecheck / build；若新增失败回退逻辑，验证对应组件行为。按里程碑提交后部署；逐个打开线上素材 URL，核实 200、内容类型、文件大小和 alpha，线上工作台截图作为验收证据。
7. 只有发布成功且线上检查完成，manifest 才能由 integrated 改为 deployed，并记录 URL。回退只需恢复原 `AgentAvatar` / 路径引用，无数据库迁移。

## 8. 来源与查证边界

- 本地代码与规范：已阅读上述项目文件，当前 Next.js 为 15.5.27；没有因调研安装依赖或改产品代码。
- Codex 内置生图能力：依据当前可用工具 schema 与本地 imagegen Skill；没有实际运行生图，无法证明出图质量、精确尺寸或耗时。
- [OpenAI 图像生成官方指南](https://developers.openai.com/api/docs/guides/image-generation)：已查证生成、编辑、迭代与一致性限制。API 文档不等于当前 Codex 内置工具暴露的全部参数；不据此替内置工具指定模型、费用或输出格式承诺。
- [Next.js 15 静态文件](https://nextjs.org/docs/15/app/api-reference/file-conventions/public-folder)、[图片](https://nextjs.org/docs/15/app/getting-started/images)、[分享图](https://nextjs.org/docs/15/app/api-reference/file-conventions/metadata/opengraph-image)：已按项目主版本查证；InsForge 上静态资产与图像优化的真实响应仍需要部署验证。
- [sharp 官方输出选项](https://sharp.pixelplumbing.com/api-output/#webp)：作为未来导出实现的候选；本轮未安装、未压缩任何文件。

本次交付是可落地的研究方案，所有视觉选型、体积预算与角色外形均为项目建议，不代表用户已验收的设计或已上线功能。


## 9. 全站素材扩展计划（2026-10-10 补充）

### 9.1 共同方向

采用“数字工作室”：中性灰白的操作外壳，作品本身有颜色；少量暖白纸张、半透明彩色片、哑光陶土形成统一材质。聊天和代码区域保持干净，不把背景纹理叠在正文下，不在所有空隙填装饰。视觉变化服务于开始、选择、等待、发现、分享等具体阶段。

| ID | 素材与位置 | 具体内容 | 制作方式与边界 | 优先顺序 |
|---|---|---|---|---|
| V1 | 四位 Agent 头像 | 前文四张透明头像 | Codex 生图，保留姓名、角色与字母回退 | 第二批，可独立交付 |
| V2 | 主题预览卡：首页主题选择 | Paper、Midnight、Garden、Candy、Mono 五个微型页面样张，含配色/字体/布局 | React/CSS 真实文字，读取现有主题配置；不把位图当按钮，不保证模型像素级照做 | 第一批 |
| V3 | 空白预览插画：未生成的 App 面板 | 待展开画布、页面片段或少量搭建积木，配一句下一步提示 | Codex 生图，生成后让位给实际预览；错误、无权限、网络失败不能都显示相同“空”插画 | 第一批 |
| V4 | 示例应用封面：首页灵感区/Discover | 旅行手账、黑胶播放器、植物养护、习惯日历作为候选；首批选 3 个真实可用作品 | 先做并验收示例应用，再截图；截图绑定应用版本。未实现的构想不能放成可运行成果 | 第一批 |
| V5 | 原创小物件：少量空态和帮助提示 | 一套便签、铅笔、积木、纸飞机、折叠窗口，先选 3 个 | Codex 生图同一材质/光线；一个场景最多一个，装饰不承载唯一状态信息 | 第二批，可选 |
| V6 | 作品分享卡：发布成功/分享预览 | 真实应用截图、名称、一句描述、本站小标记 | 截图+代码排版，标题不用模型画；绑定 publishedVersionId，区别于本站通用 OG 品牌图 | 第二批 |
| V7 | 轻量背景与过渡：首页/面板 | 局部低对比网格或纸张颗粒；菜单/卡片展开短过渡 | 纹理可生图、排版/动效用 CSS；一个区域一种背景，180ms 左右且支持 reduced-motion | 最后，可选 |

### 9.2 各素材的实施规格

**V2 主题卡**

- 先用现有五主题做可比较的同构样张：同一小页面，仅改变主题特征。卡片包含真实主题名，选中/hover/focus/禁用状态清楚，键盘可选。
- 小屏采用可滚动列表或弹层，不挤占工作台工具栏。选中主题仍走现有 prompt 约束；清楚标注“风格参考”。
- 不新增与代码配置不一致的主题名；动态字体/配色从配置或受控映射读取，不做一套静态图片真源。

**V3 空白预览**

- 建议显示宽 160–240px，上限随面板缩小；源图留白充足、真实透明、无文字。配文与行动入口由组件渲染。
- 仅在没有可用版本时显示。生成中使用真实状态文本；已有作品的迭代保留旧预览，不用插画盖住它。失败显示具体错误和重试入口。
- 复用提示词方向：`Original quiet digital-studio illustration: an unfolding blank canvas and three soft matte page fragments, warm white with one muted iris accent, simple silhouette, transparent background, no text, no logos, readable at 180px, generous safe margins.`

**V4 示例封面**

- 每个示例先明确用户功能并可实际操作；每张封面记录项目 ID、版本、截图日期、固定 viewport 与入口 URL。截图中不含用户私人信息或真实账号数据。
- 第一版统一 16:10 比例，约 640×400 的静态 WebP；文案与标签放在图片外。真实缩略图不需要持续运行多个 iframe，替换现有实时预览前核对更新机制。
- 封面只在对应版本验收后上线。作品更新时重新截图；截图失败保留有标记的旧封面或文字卡，不能放无关生成图冒充。
- 候选黑胶播放器若采用音乐素材，另核对来源与使用权限；可先用无音频的唱片收藏示例，不能用会转的封面假装音乐播放已完成。

**V5 小物件**

- 使用与头像/空态一致的材质参考，先做 3 个而不是全套表情。推荐便签用于空项目提示、积木用于首次构建说明、纸飞机用于分享帮助；若这些场景不存在则不新增入口来容纳装饰。
- 显示约 32–64px，96–192px 透明衍生图；不把“纸飞机”替换成没有文字说明的新操作按钮。

**V6 分享卡**

- 通用本站 OG 图和用户作品分享卡分开。作品卡建议 1200×630：真实作品图占主体，标题和一句描述用代码绘制，长标题截断规则可预测。
- 首版只针对已公开发布版本。用公开发布 URL 截图，避免服务器访问任意用户 URL；不把未发布作品/私有信息带进分享卡。
- 发布版本改变后再生成新卡；失败不阻塞发布，显示“分享图暂不可用”，链接仍可复制。导出图片与社交平台抓取预览分别验收，不能仅以本地图片存在宣称平台预览生效。

**V7 纹理与过渡**

- 先测不加纹理的基线；只在首页标题附近试一处，无缝小纹理建议 ≤20KB。网格可用简单 CSS 背景，无需生图。
- 过渡只使用不影响布局的 opacity/transform；不得以动画掩盖面板尺寸跳动。系统减少动态效果时取消非必要运动。

### 9.3 交付目录、预算和制作顺序

沿用前文 manifest，增加 `purpose`、`surface`、`captureProjectId`、`captureVersionId` 和 `acceptanceId`（不适用留空）。

- `public/assets/illustrations/`：V3 空态、V5 小物件。
- `public/assets/examples/`：V4 真实示例封面，文件名包含版本或内容 hash。
- `public/assets/textures/`：V7 可选背景纹理。
- V2 保持代码组件和主题配置；V6 静态演示可先放仓库，动态作品卡的存储/刷新/权限需作为独立功能设计，不假装纯素材替换即可完成。
- 建议预算：V3 ≤80KB；V4 每张 ≤100KB、首屏最多 3 张且屏外懒加载；V5 单枚 ≤20KB；V6 ≤250KB；V7 ≤20KB。首屏新增图片传输总目标 ≤400KB，实际记录加载情况，不只计算目录大小。

实施顺序：UI 审计的 U1–U4 及关键状态问题 → V2/V3 → 真实示例验收及 V4 → V1/V5 → V6 → 有价值才做 V7。每批先在现有页面上下文选稿，再压缩接入、检查失败回退，最后部署验证 URL。不能以素材验收代替功能验收。

## 10. 实施状态更新（2026-10-10）

前述“未生成/未安装”的说明为方案制定时状态。现在 V1–V4 已实际生成或实现并完成本地验收，原图/提示词/截图均已入库，生产衍生图和 manifest 已接入；具体数字与线上状态以 ENHANCEMENTS-2026-10-10.md 和 assets-manifest.json 为准。V5、V7 取消，V6 动态分享卡作为独立功能延期。
