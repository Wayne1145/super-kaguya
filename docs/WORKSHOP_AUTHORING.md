# Super Kaguya 工坊作者指南

工坊 v1 是数据扩展系统，不是 JavaScript 模组加载器。内容包不能访问
DOM、网络、Cookie、剪贴板、文件系统或游戏对象；它只能通过引擎公开的
白名单事件和动作表达玩法。

## 能扩展的内容

- `item`：新收集物、尺寸、积分、贴图、拾取音效和拾取动作；
- `mechanic`：敌人/BOSS/危险区/装饰模板、计数器和有界事件处理器；
- `asset`：内嵌 PNG 像素素材，可供物品、实体、角色和地图背景引用；
- `music`：内嵌 WAV、OGG 或 MP3，注册到音乐/角色/怪物/关卡音频总线；
- `map`：完整 Tiled JSON 关卡，安装后自动加入“自定义关卡”列表。

安装包只包含一个 `content.json`。二进制资源使用 Base64 内嵌，避免内容包
在运行时向任意域名发请求。单张 PNG 最大 512 KiB、2048 x 2048，单轨音频
最大 2 MiB，单包 JSON 最大 4 MiB。SVG、HTML、脚本、外链 URL 和未知字段
都会被拒绝。

## 引用格式

跨包资源使用 `包ID:资源ID`，例如：

```json
"sprite": "example.author.assets:moon-shard"
```

地图对象使用以下两种 Tiled 类型：

```json
{
  "id": 20,
  "type": "WorkshopItem",
  "x": 320,
  "y": 256,
  "properties": [
    { "name": "definition", "type": "string", "value": "example.author.items:moon-shard" }
  ]
}
```

`WorkshopEntity` 使用相同的 `definition` 属性。通过游戏编辑器放置工坊组件
时，这些对象和精确依赖锁会自动生成。

## 声明式玩法

事件固定为：`level.start`、`item.collect`、`enemy.defeat`、`key.collect`、
`region.enter`、`timer.tick`。

动作固定为：`addScore`、`heal`、`damagePlayer`、`grantPower`、`playAudio`、
`setCounter`、`addCounter`、`showMessage`、`setGravity`。

处理器可设置 `once`、`cooldown`，并按定义、实体种类、对象 ID 或区域 ID
过滤。每个处理器最多 24 个动作，每个事件最多执行 128 个动作；事件不能
递归派发。数值、计数器、文本、实体数量和 JSON 深度都有硬上限。

完整可运行示例位于 `workshop/catalog.json` 的 Moon Key、Locked Gate 和
Lock and Gravity Lab 三个包中。

## 校验与发布

发布前运行：

```powershell
node tools/workshop-validate.cjs path\to\package.json
node tools/workshop-security-test.cjs
```

本地部署者只有设置管理令牌后才能开放发布：

```powershell
$env:WORKSHOP_PUBLISH_TOKEN='使用密码管理器生成的高熵随机值'
$env:WORKSHOP_ALLOWED_ORIGINS='https://game.example.com'
node workshop-server.js
```

发布请求为 `POST /api/v1/packages`，使用 `Authorization: Bearer <token>`，
请求体是只包含一个新版本的 catalog package record。已发布的同一 SemVer
不能覆盖。管理员可调用 `POST /api/v1/admin/revoke`：

```json
{ "versionId": "example.author.items@1.0.0", "reason": "confirmed malicious payload" }
```

客户端每次打开工坊都会读取 `/api/v1/revocations`，删除并停止加载本地已
撤回版本。生产部署应再把单一管理令牌替换成 OIDC、作者所有权、待审核区、
数据库审计和独立对象存储；仓库实现适合私人团队或受信任作者，不是假装成
完整公共运营平台。

## 签名模式

客户端支持部署者设置 `workshopRequireSignatures: true` 和
`workshopTrustedKeys`。签名算法是 Ed25519，签名内容为移除 `signature` 字段
后递归按键排序、无空白序列化的 manifest UTF-8 字节。公钥和值均为 Base64。
签名证明内容来自受信任密钥且未被替换，不证明内容拥有合法版权或良好质量。

## 安全边界

安全保证依赖以下条件：游戏和 API 使用 HTTPS；部署者保护发布令牌/签名
私钥；公开前审核版权和内容；浏览器保持更新。哈希、签名和 CORS 都不能让
任意 JavaScript 变安全，因此 v1 永远不接受 JavaScript、WebAssembly、HTML
或脚本化 SVG。若未来开放代码模组，必须作为另一条明确标注的高风险产品线，
不能复用本工坊的信任结论。
