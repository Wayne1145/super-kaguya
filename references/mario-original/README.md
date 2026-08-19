# 经典 Mario 美术参考图集

本目录收集自公开的 HTML5 游戏复刻项目，用于内部观察经典横版平台游戏的素材构成、尺寸、动画帧与关卡美术分层。这里保留了上游文件名和原始文件内容，未做缩放、裁切或重新编码。

## 来源

- 上游项目：https://github.com/robertkleffner/mariohtml5
- 图片源目录：https://github.com/robertkleffner/mariohtml5/tree/1dcf623d5b3829e6a2efea93c387e81b1a3c6864/images
- 固定提交：`1dcf623d5b3829e6a2efea93c387e81b1a3c6864`
- 获取日期：2026-08-13
- 获取方式：通过 Git 浅克隆公开仓库，仅复制 `images/` 中的 PNG/GIF 美术资源
- 未下载、读取或包含任何 ROM、ROM 转储、模拟器存档或关卡二进制文件

这不是从任天堂 ROM 中直接提取的素材包，而是公开 HTML5 复刻项目中使用的、明显受经典 Mario 系列启发或衍生的图集。因此，它适合做视觉参考，但不能当作“官方完整素材档案”。

## 文件清单

共 15 个文件，98,848 字节。

| 类别 | 数量 | 文件 |
| --- | ---: | --- |
| 玩家角色 | 4 | `smallmariosheet.png`、`mariosheet.png`、`firemariosheet.png`、`racoonmariosheet.png` |
| 敌人、道具与特效 | 3 | `enemysheet.png`、`itemsheet.png`、`particlesheet.png` |
| 场景、地块与世界地图 | 3 | `bgsheet.png`、`mapsheet.png`、`worldmap.png` |
| 标题、字体与过场界面 | 5 | `title.gif`、`logo.gif`、`font.gif`、`endscene.gif`、`gameovergost.gif` |

### 原始尺寸

| 文件 | 尺寸（像素） | 用途参考 |
| --- | ---: | --- |
| `bgsheet.png` | 256 x 320 | 关卡背景图块 |
| `endscene.gif` | 192 x 96 | 结束场景元素 |
| `enemysheet.png` | 256 x 256 | 敌人与敌人动画 |
| `firemariosheet.png` | 480 x 32 | 火焰形态角色动画 |
| `font.gif` | 768 x 64 | 像素字体与 HUD 字形 |
| `gameovergost.gif` | 864 x 64 | Game Over 场景动画 |
| `itemsheet.png` | 256 x 256 | 金币、强化物与交互物品 |
| `logo.gif` | 320 x 80 | 标志 |
| `mapsheet.png` | 256 x 256 | 世界地图图块与标记 |
| `mariosheet.png` | 480 x 32 | 标准角色动画 |
| `particlesheet.png` | 64 x 64 | 碎片、火花等粒子 |
| `racoonmariosheet.png` | 512 x 32 | 浣熊形态角色动画 |
| `smallmariosheet.png` | 176 x 16 | 小型角色动画 |
| `title.gif` | 320 x 120 | 标题画面 |
| `worldmap.png` | 256 x 256 | 世界地图纹理/图块 |

## 许可与版权说明

上游仓库的 `LICENSE.md` 将该项目的软件代码以 Unlicense/公有领域声明发布。该声明不当然授予 Nintendo 角色、商标、造型、像素美术、音乐或其他第三方知识产权的使用权，也不能证明仓库内每张衍生图片均可用于商业发布。

Mario、相关角色与原始视觉设计的权利归其各自权利人（包括 Nintendo）所有。本目录中的图像仅用于内部分析、学习、素材需求盘点和原创重绘参考，不建议直接放入公开发布或商业版本。正式游戏应使用自行创作、取得明确授权且能与原作形成足够视觉区分的角色、敌人、地块、道具、字体、标志和界面素材。

## 给重绘工作的提示

盘点新素材时，可以优先按本目录的四层结构制作：角色动画、敌人/物品/特效、关卡地块/背景、HUD/菜单/过场。每个图集再记录单帧尺寸、锚点、碰撞框、动画帧顺序和调色板；这些元数据应进入游戏自己的资产清单，而不是依赖旧图集的切片坐标。
