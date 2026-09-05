# Super Kaguya 社区工坊 API

本文档描述仓库内可运行的零依赖工坊服务，以及面向公开运营时仍需补充的账号、审核和基础设施边界。仓库服务适合私人部署和受信任作者协作，不等同于完整公共模组平台。

机器可读接口定义位于 `workshop/openapi.json`，服务启动后也可通过 `GET /api/v1/openapi.json` 获取。

## 1. 已实现范围

`workshop-server.js` 仅使用 Node.js 内置模块，实际提供以下能力：

- 从 `workshop/catalog.json` 加载确定性的演示目录；
- 按类型、关键词、标签和引擎版本搜索，支持游标分页；
- 查询包、不可变版本和 manifest；
- 通过 SHA-256 内容地址下载声明式 JSON blob；
- 解析 `required`、`optional` 和 `incompatible` 依赖；
- 输出可直接嵌入地图的精确依赖锁文件；
- 检测缺失包、版本不兼容、引擎不兼容、冲突和循环；
- 接收仅保存在内存中的演示举报，进程重启即清空；
- 使用部署者 Bearer 令牌发布经过统一 Schema 校验的单一不可变版本；未配置令牌时发布入口关闭；
- 原子写入目录，并提供管理员撤回和客户端禁用列表；
- CORS 白名单、请求体上限、统一 problem+json 错误和基础安全响应头。

服务仍未实现多用户账号、作者所有权、数据库、对象存储、审核后台、全文检索、集群限流、邮件、付费、下载计数或恶意软件扫描。不要把管理令牌交给不受信任作者；公开社区应在本服务前增加账号/审核层，或按本文后半部分的生产架构实现。

## 2. 本地运行

要求 Node.js 18 或更高版本。仓库不需要 `npm install`。

```powershell
node .\workshop-server.js
```

默认地址为 `http://127.0.0.1:55125`。可用环境变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `WORKSHOP_HOST` | `127.0.0.1` | 监听地址；公网部署应由反向代理终止 TLS |
| `WORKSHOP_PORT` | `55125` | 监听端口 |
| `WORKSHOP_ALLOWED_ORIGINS` | 本地游戏两个 Origin | 逗号分隔的完整 Origin；生产环境必须设置明确白名单 |
| `WORKSHOP_MAX_BODY_BYTES` | `5242880` | JSON 请求体上限，允许范围为 1 KiB 至 8 MiB |
| `WORKSHOP_CATALOG_FILE` | `workshop/catalog.json` | 演示目录绝对或相对路径 |
| `WORKSHOP_OPENAPI_FILE` | `workshop/openapi.json` | OpenAPI 文件路径 |
| `WORKSHOP_PUBLISH_TOKEN` | 未设置 | 高熵管理令牌；未设置时发布和撤回写接口关闭 |

示例：

```powershell
$env:WORKSHOP_ALLOWED_ORIGINS='http://127.0.0.1:55124,http://localhost:55124'
$env:WORKSHOP_PORT='55125'
node .\workshop-server.js
```

健康检查：

```powershell
Invoke-RestMethod http://127.0.0.1:55125/api/v1/health
```

前端部署不应硬编码工坊地址。推荐由部署者在启动配置中注入：

```js
window.SUPER_KAGUYA_CONFIG = {
  workshopApiBaseUrl: 'https://workshop.example.net/api/v1'
};
```

配置为空时，前端应显示“未配置社区工坊”，但本地关卡编辑、导入和游戏本体仍可使用。更换服务地址不应删除已经安装到 IndexedDB 的内容；客户端应按锁文件中的哈希判断是否需要重新下载。

## 3. 设计来源与取舍

本方案组合了三类成熟实践：

- [Factorio Mod structure](https://wiki.factorio.com/Mod_structure) 和 [Mod Portal API](https://wiki.factorio.com/Mod_portal_API)：借鉴 manifest、游戏版本约束，以及必需、可选和冲突依赖；
- [Modrinth API](https://docs.modrinth.com/api/)、[依赖接口](https://docs.modrinth.com/api/operations/getprojectdependencies/) 和 [.mrpack](https://support.modrinth.com/en/articles/8802351-modrinth-modpack-format-mrpack)：借鉴精确版本锁定、文件大小和内容哈希；
- [Steam Workshop 实现指南](https://partner.steamgames.com/doc/features/workshop/implementation) 与 [ISteamUGC](https://partner.steamgames.com/doc/api/ISteamUGC)：借鉴订阅、自动更新、可见性、举报和依赖提示的用户体验。

没有照搬的部分：

- Steam 负责分发，但不会替浏览器游戏提供代码沙箱；
- Fabric/JVM 模组允许入口点代码，这对静态网页部署风险过高；
- itch.io 适合发布完整 HTML5 ZIP，但没有足够强的跨包依赖与锁文件模型；
- 浏览器中的“下载后执行 JavaScript”不能靠 CORS、哈希或作者签名变安全。

因此 Super Kaguya v1 工坊只接受经过 JSON Schema 校验的声明式内容。包可以描述实体、属性、有限状态机、事件连接、贴图、音频和关卡，但不能包含 `eval`、函数文本、模块 URL、脚本标签、内联事件处理器或任意 JavaScript。哈希证明内容未被篡改，签名证明发布者身份，二者都不能证明内容没有恶意逻辑。

## 4. 资源模型

### 4.1 Package

Package 是长期稳定的项目身份，ID 采用反向域名形式，例如：

```text
io.super-kaguya.items.moon-key
```

允许的类型：

| 类型 | 用途 |
| --- | --- |
| `map` | 完整关卡、关卡包或地图片段 |
| `item` | 可收集物、商店商品、编辑器组件 |
| `mechanic` | 声明式机制、组件和事件规则 |
| `asset` | 贴图、图块、背景及其元数据 |
| `music` | 音乐、音效和播放元数据 |

### 4.2 Version

Version 使用 SemVer。发布后的版本不可覆盖；修复必须发布新版本，违法或危险内容只能标记撤回。`versionId` 为 `packageId@version`。

演示解析器支持完整版本、`^`、`~`、`>`、`>=`、`<`、`<=`、空格 AND、`||`、`1.x`、`1.2.x` 和 `1.0.0 - 2.0.0`。生产实现必须使用经过充分测试的 SemVer 库，并完整处理 prerelease 规则。

### 4.3 Manifest

```json
{
  "schemaVersion": 1,
  "id": "io.author.package",
  "type": "map",
  "version": "1.2.0",
  "versionId": "io.author.package@1.2.0",
  "engine": "^0.8.0",
  "license": "CC-BY-4.0",
  "publishedAt": "2026-08-30T08:00:00.000Z",
  "dependencies": [
    {
      "id": "io.author.base",
      "range": "^1.0.0",
      "kind": "required"
    }
  ],
  "conflicts": [],
  "capabilities": ["entity.component", "render.sprite"],
  "entrypoint": {
    "kind": "declarative",
    "file": "content.json"
  },
  "files": [
    {
      "path": "content.json",
      "sha256": "64位小写十六进制摘要",
      "size": 1234,
      "mime": "application/json"
    }
  ]
}
```

依赖类型：

- `required`：必须解析和安装，否则关卡不能启动；
- `optional`：默认不安装，用户确认或根包明确请求时安装；
- `incompatible`：目标版本存在时产生冲突，不能静默忽略。

生产版还可增加 `recommended`，但不能把它当成隐式必需依赖。依赖目标必须是包 ID 和版本范围，地图最终保存的则必须是精确锁文件。

### 4.4 内容文件

Manifest 只描述文件和权限。`content.json` 是声明式入口，必须由包类型对应的 JSON Schema 验证。最低要求：

- 顶层具有 `kind` 和 `schemaVersion`；
- 所有实体引用使用稳定 ID；
- 数值属性有明确上下限；
- 事件只能来自游戏注册表中的允许列表；
- 资源只引用当前 manifest 内的相对路径或已经解析的依赖；
- 不接受 `javascript:`、`data:text/html`、外部脚本 URL 或动态模块；
- 未知字段默认拒绝，而不是悄悄进入运行时。

### 4.5 地图依赖锁文件

地图保存时应把 `/resolve` 返回的 `lockfile` 原样嵌入 `workshopDependencies`。核心字段：

```json
{
  "schemaVersion": 1,
  "engineVersion": "0.8.0",
  "roots": [
    {
      "id": "io.super-kaguya.maps.lock-gravity-lab",
      "range": "^1.0.0"
    }
  ],
  "includeOptional": false,
  "packages": [
    {
      "id": "io.super-kaguya.core.lunar-dsl",
      "version": "1.1.0",
      "versionId": "io.super-kaguya.core.lunar-dsl@1.1.0",
      "manifestSha256": "...",
      "files": [
        {
          "path": "content.json",
          "sha256": "...",
          "size": 512,
          "mime": "application/json"
        }
      ]
    }
  ]
}
```

锁文件使同一地图在未来仍能复现。客户端可以提供“检查更新”，但未经作者保存和用户确认，不应自动把已发布关卡改到新的依赖版本。

## 5. 通用 HTTP 约定

- API 前缀：`/api/v1`；
- 请求与响应 JSON 使用 UTF-8；
- 所有 POST 必须发送 `Content-Type: application/json`；
- 每个响应带 `X-Request-Id`；
- 参数错误、权限错误和服务错误使用 `application/problem+json`；
- 依赖无解属于业务结果，`POST /resolve` 返回 HTTP 200 和 `ok: false`；
- Manifest 和 blob 是不可变资源，可永久缓存；目录搜索不可长期缓存；
- 客户端必须把 `cursor` 当作不透明字符串，不能自行修改或跨查询复用；
- 生产 API 必须在反向代理后使用 HTTPS。

错误示例：

```json
{
  "type": "https://super-kaguya.invalid/problems/400",
  "title": "Invalid Engine Version",
  "status": 400,
  "detail": "engine must be a complete SemVer value such as 0.8.0.",
  "requestId": "5ebc6401-9fc3-4818-8502-8c542f52a184"
}
```

## 6. 端点

完整字段约束以 `workshop/openapi.json` 为准。

### `GET /api/v1/health`

返回服务状态、目录修订号和包数量。该端点不检查生产版的每一个外部依赖；生产环境应另设 readiness 与 liveness 检查。

### `GET /api/v1/categories`

返回 `map`、`item`、`mechanic`、`asset`、`music` 五类及数量，用于工坊首页分类入口。

### `GET /api/v1/packages`

查询参数：

| 参数 | 说明 |
| --- | --- |
| `type` | 精确包类型 |
| `q` | 在 ID、标题、简介、作者和标签中搜索，最多 100 字符 |
| `tag` | 精确标签，不区分大小写 |
| `engine` | 完整引擎 SemVer，只显示至少有一个兼容版本的包 |
| `cursor` | 前一页返回的不透明游标 |
| `limit` | 1 至 50，默认 20 |

响应：

```json
{
  "items": [],
  "total": 6,
  "nextCursor": null
}
```

### `GET /api/v1/packages/{packageId}`

返回包详情、最新版本和全部版本摘要。找不到时返回 404 problem+json。

### `GET /api/v1/packages/{packageId}/versions`

返回按 SemVer 从新到旧排列的不可变版本列表。

### `GET /api/v1/versions/{versionId}/manifest`

返回 manifest。演示服务对键名排序、两空格缩进并保留末尾换行，响应体就是被计算 SHA-256 的规范字节，因此客户端应直接校验下载响应体，再解析 JSON。生产端建议采用 RFC 8785 JSON Canonicalization Scheme，或把规范 manifest 本身作为不可变 blob；无论选择哪种方式，规范化规则都必须写入协议且不能依赖对象属性插入顺序。生产端还应返回发布者签名与签名所用 key ID。

### `GET|HEAD /api/v1/blobs/{sha256}`

Blob ID 是 64 位小写 SHA-256。响应使用 immutable 缓存与 ETag。演示目录仅生成 JSON blob；生产版可返回经过允许的 PNG、WebP、OGG、MIDI 等类型。

客户端不能只相信 URL 中的哈希，下载后仍要自行计算摘要。下载到临时区、验证完毕再原子写入内容地址缓存。

### `POST /api/v1/resolve`

请求：

```json
{
  "engineVersion": "0.8.0",
  "roots": [
    {
      "id": "io.super-kaguya.maps.lock-gravity-lab",
      "range": "^1.0.0"
    }
  ],
  "includeOptional": true
}
```

成功响应中的 `packages` 按依赖在前、消费者在后排列，可按顺序安装。每项包含精确版本、manifest 摘要和文件下载地址。`lockfile` 可嵌入地图。

```json
{
  "ok": true,
  "engineVersion": "0.8.0",
  "packages": [],
  "lockfile": {},
  "missing": [],
  "constraintErrors": [],
  "engineMismatches": [],
  "conflicts": [],
  "cycles": [],
  "totalSize": 4096
}
```

解析顺序：

1. 校验根依赖和引擎版本；
2. 对每个包选择满足范围和引擎约束的最高版本；
3. 展开必需依赖；仅在 `includeOptional` 为真时展开可选依赖；
4. 如果后续约束不兼容，回溯尝试较低版本；
5. 检测 `incompatible`、显式 `conflicts` 和依赖循环；
6. 生成拓扑排序安装计划和精确锁文件。

`ok: false` 时：

- `missing`：包 ID 不存在；
- `constraintErrors`：没有同时满足版本范围的方案，或超过演示解析限制；
- `engineMismatches`：版本范围可满足，但没有版本支持当前引擎；
- `conflicts`：选中包声明互斥；
- `cycles`：依赖链形成环。

演示解析器面向小型目录，不应用于不受信任的大规模依赖图。生产版应设置 CPU、节点数和回溯次数预算，并缓存相同目录快照下的解析结果。

### `POST /api/v1/reports`

演示举报请求：

```json
{
  "packageId": "io.super-kaguya.maps.lock-gravity-lab",
  "versionId": "io.super-kaguya.maps.lock-gravity-lab@1.0.0",
  "reason": "broken",
  "details": "The gate cannot be opened in engine 0.8.0."
}
```

`reason` 可为 `copyright`、`malware`、`broken`、`misleading` 或 `other`。演示服务只在内存中保留最近 100 条并返回 `durable: false`。生产实现必须要求登录、限流、持久化、审计，并防止举报内容造成后台 XSS。

## 7. 客户端安装流程

从工坊打开关卡时，客户端应执行：

1. 读取地图中的根依赖或锁文件；
2. 已有锁文件时，先按精确版本和哈希检查本地 IndexedDB 内容地址缓存；
3. 缺少依赖时调用 `/resolve`，展示新增包、版本、作者、许可证、大小和 capability；
4. 用户确认后下载 manifest 和 blob；
5. 校验 manifest SHA-256、每个文件 SHA-256、声明大小和实际大小；
6. 对内容运行对应包类型的 JSON Schema 校验；
7. 拒绝未知 capability、未知 MIME、外部 URL、脚本字段和超预算内容；
8. 验证全部成功后一次写入浏览器本地存储，失败则恢复旧安装集；
9. 只通过可信宿主适配器和有预算的声明式解释器加载；
10. 每次打开工坊同步撤回清单，卸载时阻止删除仍被其他已安装包依赖的内容。

依赖确认弹窗不能只写“需要下载 3 个组件”。它至少应列出包名、作者、版本、许可证、下载大小、必需/可选原因和新 capability。用户拒绝必需依赖时，地图不能启动；拒绝可选依赖时，应按 manifest 声明降级。

## 8. 声明式机制边界

建议把机制 DSL 限制在以下原语：

- 实体模板与有上限的数值属性；
- 有限状态机；
- 白名单事件，例如 `onCollect`、`onDefeat`、`onEnterRegion`；
- 白名单动作，例如改变计数器、显示对话、启用门、播放已安装音效；
- 对稳定实体 ID 的引用；
- 有界定时器和冷却；
- 贴图、动画、粒子及音频参数；
- 编辑器属性 schema 和中文帮助文本。

禁止：

- JavaScript、WebAssembly、HTML、SVG 脚本和动态 import；
- 任意网络请求、WebSocket、剪贴板、文件、Cookie 或 DOM 访问；
- 字符串求值、正则灾难性回溯或无界循环；
- 从包内覆盖游戏核心原型、存档代码或安全策略；
- 未经授权读取其他包的私有状态；
- 用超大数值、无限粒子或递归事件拖垮帧率。

如果未来确实需要社区代码，不能直接放开 JS。可另设高风险实验通道，只允许无 WASI、无网络、无文件、无 DOM 的 capability-based WASM；宿主提供极少的确定性函数，并限制线性内存、初始化时间、每帧指令/燃料、调用深度和事件数量。代码包必须与普通声明式包使用不同标识、审核级别和用户警告。

## 9. 上传与内容安全

生产上传服务至少执行：

- 身份认证、邮箱验证、CSRF 防护、IP/账号限流；
- 包 ID 所有权和协作者权限检查；
- 发布版本不可变，禁止覆盖同一 SemVer；
- ZIP 路径规范化，拒绝绝对路径、`..`、符号链接和设备文件；
- 限制压缩包大小、文件数、单文件大小、总解压大小和压缩比；
- 按魔数识别 MIME，不能相信扩展名或请求头；
- 拒绝 HTML、可执行文件、脚本化 SVG、外链资源和多格式混淆文件；
- 限制图片像素总量、帧数，限制音频时长、通道数和采样率；
- JSON Schema 验证、引用闭包验证、数值预算和事件图循环检测；
- 描述、作者名和 Markdown 经过严格输出编码，防止存储型 XSS；
- 恶意软件扫描、许可证声明、举报、人工审核和紧急禁用列表；
- 上传区与公开对象存储分离，审核完成后再复制；
- 服务端计算 SHA-256，不接受上传者提供的摘要作为事实；
- 发布者使用 Ed25519 签名；私钥不上传服务器，服务端保存公钥和轮换记录；
- 审计日志只追加，记录审核与撤回，不记录不必要的私人数据。

“把素材打包得看不见”不改变素材是否被再分发，也不是版权或安全控制。所有公开包都必须具有允许该分发方式的许可证或明确授权，并在包详情和锁文件中保留许可证信息。

## 10. 公共运营 API 扩展

当前 OpenAPI 已包含令牌保护的发布、撤回和公开撤回列表。公共运营版建议继续增加：

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
DELETE /api/v1/auth/session
GET    /api/v1/me

POST   /api/v1/packages
PATCH  /api/v1/packages/{packageId}
POST   /api/v1/packages/{packageId}/collaborators
POST   /api/v1/packages/{packageId}/versions/uploads
POST   /api/v1/uploads/{uploadId}/parts
POST   /api/v1/uploads/{uploadId}/complete
POST   /api/v1/packages/{packageId}/versions/{version}/publish
POST   /api/v1/packages/{packageId}/versions/{version}/withdraw

POST   /api/v1/subscriptions
DELETE /api/v1/subscriptions/{packageId}
GET    /api/v1/me/subscriptions

GET    /api/v1/admin/review-queue
POST   /api/v1/admin/versions/{versionId}/approve
POST   /api/v1/admin/versions/{versionId}/reject
POST   /api/v1/admin/packages/{packageId}/disable
GET    /api/v1/admin/reports
PATCH  /api/v1/admin/reports/{reportId}
```

上传推荐采用“申请上传 → 对象存储分片直传 → 完成上传 → 异步扫描 → 发布”的状态机。API 服务不应把大文件全部缓冲进内存。所有写操作支持幂等键；分页使用稳定游标；生产错误统一使用 `application/problem+json`。

## 11. 生产数据模型

最低实体：

- `users`、`sessions`、`publisher_keys`；
- `packages`、`package_collaborators`、`package_tags`；
- `versions`、`version_dependencies`、`version_files`、`version_signatures`；
- `blobs`，以 SHA-256 唯一，记录扫描和引用计数；
- `uploads`、`upload_parts`、`scan_jobs`；
- `subscriptions`；
- `reports`、`moderation_actions`、`audit_log`；
- `blocked_hashes`、`blocked_publishers`；
- `download_events` 或聚合统计表。

版本发布事务必须保证：manifest、依赖、文件摘要和签名同时变为可见，不能让客户端读到半发布状态。撤回版本不删除 blob；已有锁文件应显示风险提示，并由服务端策略决定是否仍允许下载。被认定恶意的内容进入禁用列表，客户端即使本地已有缓存也应停止加载。

## 12. 完整后端生成提示词

以下提示词可直接交给另一个开发对话。它描述的是生产服务，不是对当前演示文件的小修补。

```text
你是一名资深后端、安全和平台工程师。请为开源 HTML5 游戏 Super Kaguya
从零实现一个可自托管的社区工坊后端。不要只给方案，必须提交可运行的完整代码、
迁移、测试、OpenAPI、Docker Compose 和部署文档。前端会通过部署配置项
workshopApiBaseUrl 指向该服务，因此所有 URL、CORS 和对象存储公开地址都必须可配置。

一、技术栈与工程要求
1. 使用当前 LTS Node.js、TypeScript、Fastify、PostgreSQL、S3 兼容对象存储；
   后台任务使用有持久化语义的队列。提供 Docker Compose，默认可用 MinIO 和本地
   PostgreSQL 启动完整开发环境。
2. 使用结构化日志、request ID、健康检查、readiness、优雅停机、数据库连接池、
   迁移和确定性种子数据。配置只来自经过 schema 校验的环境变量，不把密钥写进仓库。
3. 全部接口以 /api/v1 开头，生成并提交 OpenAPI 3.1。实现代码、验证 schema、示例
   与文档必须一致。所有普通错误使用 application/problem+json；记录内部错误但不向
   客户端泄漏堆栈、SQL、路径或密钥。
4. 编写单元测试、数据库集成测试、S3 集成测试、依赖解析性质测试、API 合约测试和
   安全回归测试。CI 中执行格式检查、类型检查、测试、迁移验证和 OpenAPI 校验。

二、包、版本与搜索
1. 包类型固定为 map、item、mechanic、asset、music。包 ID 使用反向域名格式且全局唯一。
   Package 可修改标题、简介、标签、可见性和协作者；Version 使用 SemVer，一旦发布绝不
   允许覆盖，只能发布新版本、撤回或由管理员禁用。
2. Manifest schemaVersion 为 1，必须包含 id、type、version、engine、license、
   dependencies、conflicts、capabilities、entrypoint 和 files。依赖支持 required、optional、
   incompatible；版本范围遵守完整 SemVer，包括 prerelease 规则。
3. 实现分类、标签、作者、关键词、兼容引擎版本、更新时间和热度查询，使用稳定游标分页。
   搜索结果、详情、版本列表和 manifest 都提供 ETag 与合理缓存策略。
4. 实现 GET /health、GET /categories、GET /packages、GET /packages/{packageId}、
   GET /packages/{packageId}/versions、GET /versions/{versionId}/manifest、
   GET|HEAD /blobs/{sha256}。

三、依赖解析与锁文件
1. 实现 POST /resolve，输入 engineVersion、1 至 64 个根依赖和 includeOptional。
   使用经过验证的 SemVer 库和带预算的回溯解析，选择满足全部约束的最高兼容版本。
2. 检测并结构化返回缺失包、无解版本约束、引擎不兼容、incompatible/conflicts 和循环依赖。
   对相同目录快照和请求缓存结果，但目录变化后不能返回陈旧版本。
3. 成功时按依赖在前排序，返回精确 versionId、manifest SHA-256、每个文件 SHA-256、大小、
   MIME、下载 URL 和总大小，并生成 schemaVersion 1 的 lockfile。地图作者保存时可以把该
   lockfile 嵌入 workshopDependencies，以后必须能复现同一组文件。
4. 解析无解属于业务响应，返回 200 和 ok=false；畸形请求才返回 4xx problem+json。

四、上传、存储和不可变发布
1. 实现 POST /packages、PATCH /packages/{id}、协作者管理、创建分片上传、完成上传、扫描状态、
   发布版本和撤回版本。写操作需要 OIDC 或安全的本地账号认证、细粒度授权、CSRF 防护、
   账号/IP 限流和 Idempotency-Key。
2. 大文件由预签名 URL 直传隔离的 quarantine bucket。API 不得把整个文件读入内存。
   服务端完成后计算 SHA-256，以内容地址去重；扫描通过后原子复制到 public bucket。
3. 发布事务必须原子写入 manifest、依赖、文件、签名和目录可见状态。对象使用 SHA-256 路径
   和 immutable 缓存。发布后禁止替换同版本文件；撤回保留审计和引用关系。
4. 支持 Ed25519 发布者公钥登记、轮换和吊销。签名覆盖规范化 manifest。明确说明签名只证明
   发布者和完整性，不证明内容安全。

五、内容格式与强制安全边界
1. 禁止上传或执行任意 JavaScript、TypeScript、HTML、脚本化 SVG、动态 import、模块 URL、
   eval 字符串或内联事件处理器。mechanic 只接受经过 JSON Schema 验证的声明式 DSL；入口点
   必须是 {kind:"declarative",file:"content.json"}。
2. 分别为 map、item、mechanic、asset、music 提供严格 JSON Schema，additionalProperties
   默认 false。机制只能使用白名单实体组件、有限状态机、事件、动作、计数器和有界定时器；
   禁止网络、DOM、Cookie、文件、剪贴板和访问未授权包状态。
3. 解包时防止 ZIP Slip、绝对路径、..、反斜杠绕过、Unicode 路径混淆、符号链接、设备文件、
   压缩炸弹和嵌套压缩。限制压缩包大小、文件数、单文件大小、总解压大小和压缩比。
4. 不相信扩展名或客户端 MIME，按魔数识别。建立允许 MIME 列表；限制图片尺寸/像素/帧数，
   限制音频时长/通道/采样率，拒绝多格式混淆文件、外链资源和主动内容。描述和 Markdown 输出
   必须防存储型 XSS。
5. 扫描流程包含 schema、引用闭包、哈希、许可证字段、恶意软件、事件循环和运行预算检查。
   扫描任务可重试且幂等，失败内容永远不进入公开 bucket。

六、审核、举报和治理
1. 实现 POST /reports，以及管理员审核队列、批准、拒绝、撤回、禁用包、禁用发布者、封禁哈希、
   处理举报等接口。举报者需登录并限流，举报文本安全编码。
2. 审计日志只追加，记录操作者、原因、前后状态、request ID 和时间。管理员高风险操作要求明确
   权限；不要在日志中保存访问令牌、密码、对象存储密钥或不必要的个人信息。
3. 支持公开、未列出、私有、待审核、已拒绝、已撤回和安全禁用状态。恶意哈希被禁用后，目录、
   下载与解析都必须立即拒绝；提供客户端可轮询的禁用列表版本。
4. 包与版本显示 SPDX 许可证。上传者必须确认拥有分发权限；服务器不得通过混淆素材来规避
   许可证。保留 DMCA/版权投诉流程和可审计处置记录。

七、客户端契约
1. 安装顺序为：resolve -> 展示依赖/作者/许可证/capability/大小 -> 用户确认 -> 下载 manifest
   与 blob -> 客户端再次校验 SHA-256 -> JSON Schema 验证 -> 原子写入 IndexedDB -> 隔离预览。
2. manifest 和 blob 可长期缓存，目录响应短缓存。支持 If-None-Match。所有下载 URL 可配置且
   不依赖同域 Cookie。CORS 只允许配置白名单 Origin。
3. 新 capability 必须触发再次确认。拒绝必需依赖时地图不可运行；拒绝 optional 时按 manifest
   降级。卸载采用引用计数，不能删除仍被地图、存档或其他包使用的 blob。
4. 不实现远程 JS 执行。未来若讨论代码模组，必须另做威胁模型，使用无 WASI/网络/文件/DOM 的
   capability-based WASM，并限制内存、燃料、调用深度和每帧事件；本次不要实现该功能。

八、交付与验收
1. 提交清晰目录结构、README、环境变量表、威胁模型、备份恢复、反向代理 TLS、迁移和滚动部署
   教程；提供开发与生产 Docker Compose 示例。生产容器使用非 root 用户、只读根文件系统和
   最小权限。
2. 种子数据至少覆盖五类包、required/optional/incompatible、多个版本、无解约束和循环测试夹具。
3. 测试必须覆盖越权、CORS、限流、重复发布、幂等、路径穿越、符号链接、压缩炸弹、错误 MIME、
   超大图片/音频、XSS、哈希不匹配、签名错误、撤回/禁用、解析回溯和并发发布。
4. 最终实际启动 Docker Compose，执行迁移和种子，运行全部测试，再用真实 HTTP 请求演示搜索、
   解析、上传扫描、发布、下载、举报和禁用流程。不要留下 TODO、占位实现、伪测试或省略代码。
```

## 13. 演示目录维护

`workshop/catalog.json` 是可读的开发夹具，不是生产数据库。修改时遵守：

- `revision` 随目录变化而更新；
- 时间、下载量和排序字段固定，保证截图和测试可复现；
- 每个版本都包含 `content`，服务器启动时生成规范化 JSON blob、SHA-256 和 manifest；
- 包和版本 ID 不重复；
- 所有依赖 `kind` 必须属于允许集合；
- 示例素材只放元数据或确定有分发许可的内容；
- 运行 `node --check workshop-server.js`，并解析 catalog/OpenAPI 后再提交。

演示目录故意使用静态数值且不写回文件。搜索“下载量”不会因为请求发生改变，这避免开发环境刷新造成不可复现结果。

## 14. 许可证与音乐来源提示

工坊中的每个包必须单独记录许可证，不能因为游戏免费或仓库私有就省略。音乐还要分别核对曲目、MIDI 编配文件以及渲染 MIDI 所用 SoundFont/采样库三层权利。

适合寻找灵感或可用 MIDI 的入口：

- [Mutopia Project](https://www.mutopiaproject.org/) 与其[许可说明](https://www.mutopiaproject.org/legal.html)：每首作品页标明公有领域或具体 Creative Commons；优先 PD、CC0、CC-BY；
- [OpenGameArt MIDI 标签](https://opengameart.org/tags/midi) 与[许可 FAQ](https://opengameart.org/content/faq)：逐作品核对，游戏项目优先 CC0/CC-BY；
- [Wikimedia Commons MIDI](https://commons.wikimedia.org/wiki/Category:MIDI_files) 与[许可规则](https://commons.wikimedia.org/wiki/Commons:Licensing)：保存具体文件页的许可证快照；
- [GiantMIDI-Piano](https://github.com/bytedance/GiantMIDI-Piano)：数据集标为 CC BY 4.0，使用前再次核对具体发行说明并署名；
- [MAESTRO](https://magenta.tensorflow.org/datasets/maestro)：CC BY-NC-SA 4.0，适合研究和灵感，不适合作为未来可能商业化版本的默认素材。

不建议直接从 VGMusic、BitMidi、FreeMidi 或用户上传乐谱站取材。“可以免费下载”不等于允许改编和再分发。
