---
title: 此时一名 Rizline 玩家失去理智：手搓查歌插件的踩坑实录
published: 2025-12-03
description: '从零手搓 Rizline 查歌插件的踩坑记录，包含 Wiki 解析、Go 图像渲染与游戏逻辑实现'
image: 'https://cloud.guguwo.top/d/picture-bed/bda7b294007f6e23a8ab9c198d8a645f.webp'
tags: ["Go", "Rizline", "Bot", "开发实录", "踩坑", "图像处理"]
category: '开发日志'
draft: false
---
:::note[前言]
这是一篇关于为了追求“原生体验”而手搓插件的开发实录，包含大量“血压飙升”的时刻。
:::

# 起初...
起初，我真的只是想写个简单的 Bot 指令查查歌，稍微方便一下自己。
但写着写着就“上头”了——为了追求所谓的“原生体验”和“极致美观”，我硬生生把这个简单的脚本搓成了一个包含了 Wiki 解析器、Canvas 绘图引擎、LRU 缓存甚至还有游戏逻辑的**缝合怪**。

这篇文章不讲那些虚头巴脑的架构，专门记录一下开发过程中那些让我**血压飙升的瞬间**，特别是跟 Wiki 格式搏斗、被 Go 的颜色处理坑惨以及和群里 AI 抢话语权的经历。

# 一、 Wiki 解析：看似规范，实则全是坑
数据源我选了 Rizline中文维基。

最搞心态的是**跨行单元格**。
理论上每一行数据应该很规整，但实际上编辑者们的习惯千奇百怪。有的属性写在一行，有的分行写。我最开始天真地用 `\n|-` 来切分行，结果遇到下面这种“狂野”写法直接崩盘：

```wikitext wrap
|[[版本:2.0.1|2.0.1]]
|style="text-align:center;| 2025/03/28
|加入了VICIOUS...
```

这一行被换行符切得稀碎，解析逻辑读不到完整数据，直接 panic。
后来我意识到，指望 Wiki 源码格式标准是不可能的。于是我采用了**“大力出奇迹”的预处理方案**：在解析前，先把这些碍眼的换行符给“拍扁”。:spoiler[简单粗暴但有效]

```go wrap
func parseTable(tableText string) string {
    // ...
    for _, row := range rows {
        // 这里的逻辑简单粗暴但有效
        // 只要看到 \n| 或者 \n! 这种跨行写法，强制替换成标准分隔符 ||
        cleanRow := strings.ReplaceAll(row, "\n|", "||")
        cleanRow = strings.ReplaceAll(cleanRow, "\n!", "||")
        
        // 现在的 row 无论原本长啥样，都被我变成了标准的 Cell A || Cell B
        rawCells := strings.Split(cleanRow, "||")
        // ...
    }
}
```

这一步做完，世界瞬间清静了。不管编辑者怎么换行，我拿到的永远是单行数据。顺便我还写了个正则过滤器，把 `scope="row"` 这种这类样式代码全剔除掉，只留干货。

# 二、 绘图引擎：如果你看不见背景，说明你预乘了
为了让查歌结果不是干巴巴的文字，我上了 `gg` 库画图。Rizline 的 UI 有很多半透明色（比如 Riztime 的那个淡绿色 `#6B82A585`），这里我连踩了三个坑，简直是 Go 语言图形处理的“教科书级反面教材”。

### 1. fmt.Sscanf 的贪婪
我想解析 Hex 颜色字符串：
```go wrap
// 别笑，我真这么写过
fmt.Sscanf(hexStr, "%02x%02x%02x%02x", &r, &g, &b, &a)
```
跑起来颜色全乱套。调试发现 `Sscanf` 根本不管你的 `%02x` 限制，它看到字符串就把能读的都读给 `r` 了，后面几个变量全是 0。
**解决：** 老老实实切片字符串，用 `strconv.ParseUint` 转。

### 2. 颜色发灰？那是 Premultiplied Alpha
解析搞定了，画出来的半透明色块却像是个脏脏的灰色。
查了半天文档才发现，Go 的 `image/color.RGBA` 居然存的是 **预乘 Alpha (Premultiplied Alpha)** 的值！
也就是说，如果你把 CSS 里的 `#RRGGBBAA` 直接塞进去，计算时亮度就会不对（尤其是判断字体该用黑还是白的时候）。
**解决：** 换用 `color.NRGBA`。多出来的这个 `N` 就是 Non-premultiplied，专治各种颜色发灰不服。

### 3. “物理”挖孔
最难受的是，我用的库不支持混合模式（Composite Op）。如果我在深蓝底色上画半透明色块，颜色会叠加混在一起，糊成一坨。
我想要的是：色块所在区域的底图变透明，只显示色块本身的颜色。

![](https://cloud.guguwo.top/d/picture-bed/placeholder-transparent-issue.webp)

既然库不支持，那就直接操作像素数组。利用 `dc.Image().(*image.RGBA)` 拿到裸数据，手动把那块区域的像素清空，再填色。

```go wrap
// 简单粗暴的“挖孔屏”实现
if img, ok := dc.Image().(*image.RGBA); ok {
    // 算出要挖空的矩形坐标
    x0, y0, x1, y1 := int(startX), int(currentY), int(startX+blockW), int(currentY+blockH)
    for py := y0; py < y1; py++ {
        for px := x0; px < x1; px++ {
            // 物理清除背景色，设为全透明
            img.Set(px, py, color.Transparent)
        }
    }
}
// 坑挖好了，再填半透明色，就不会和背景混色了
dc.SetColor(hexToColor(c))
dc.DrawRectangle(startX, currentY, blockW, blockH)
dc.Fill()
```
虽然这种像素级操作看着有点“野路子”，但为了效果，这点性能损耗完全值得。

# 三、 布局管理：CV 工程师的翻车现场
开发“详细信息”板块时，我犯了个低级错误，导致调试了半小时 `panic`。

我的渲染逻辑是分离的：先算高度 `calculateHeight`，再实际画图 `generateImage`。
加新字段时，我为了省事直接复制粘贴了代码。

结果在写计算高度的函数时，我脑子一抽，复制了画图函数的参数列表：
```go wrap
// 错误现场：计算高度要个毛线的坐标(x, y)啊！
// calculateFormattedTextHeight 定义只要 (dc, text, maxWidth)
// 我传进去一大堆乱七八糟的 (dc, text, x, y, maxWidth, ...)
textHeight := calculateFormattedTextHeight(dc, line, cardMargin+40, y+24, cardWidth-80, ...)
```
编译器报 `too many arguments` 还是小事，关键是当时那一坨参数类型都差不多，我还硬改了半天类型转换。

:spoiler[教训：UI 代码写多了真的容易眼花。如果有条件，还是封装成对象，让每个组件自己管好 Measure() 和 Draw()，这种过程式代码维护起来太痛苦了。]

# 四、 游戏交互：让机器人“有些情商”
为了活跃群气氛，我搞了个“猜歌名”功能。上线第一天就被群友吐槽：
1.  **太严格**：谁记得住 `Gleam feat. ふわまろ` 这种全名？少打个点都算错。
2.  **太吵**：群里 BOT 接了 ChatGPT，这边开始游戏发图让大家猜，那边 ChatGPT 立刻跳出来胡说八道。

### 正则去噪 + 模糊匹配
为了解决全名问题，我写了个清洗函数 `simplifyTitle`，把 `feat.`、`CV` 以及各种括号里的备注统统砍掉。

```go wrap
func simplifyTitle(title string) string {
    // 砍掉 (...) 和 [...]，顺便处理中文全角括号
    reParens := regexp.MustCompile(`\s*[(\[（].*?[)\]）]`)
    title = reParens.ReplaceAllString(title, "")

    // 砍掉 feat./cv. 后缀
    reFeat := regexp.MustCompile(`(?i)\s+(feat|ft|cv)\.?.*$`)
    title = reFeat.ReplaceAllString(title, "")
    
    return strings.TrimSpace(title)
}
```
再配合 Levenshtein 距离算法做模糊匹配。现在群友只要打出核心词（比如“Gleam”），甚至稍微拼错一两个字母，也能判对。

### 左右脑互搏
为了防止 Bot 的不同插件互相捣乱，左右脑互搏，我在消息监听里加了拦截逻辑。利用框架的 `ctx.Block()`，一旦检测到当前群正在玩猜歌，直接截断消息链。

```go wrap
engine.OnMessage().Handle(func(ctx *zero.Ctx) {
    session := Manager.GetSession(groupID)
    if session != nil {
        // 游戏进行中？那就拦下来，别让后续的 AI 插件处理了
        ctx.Block()
        
        // 顺手把 @机器人的部分切掉，只留纯文本
        cleanMsg := removeAtCode(ctx.Event.Message)
        session.HandleGuess(ctx, cleanMsg)
    }
})
```
这下终于没人插嘴了，整个世界都清净了。

# 碎碎念
回头看这堆代码，从正则解析的脏活累活，到像素级操作的“绣花功夫”，虽然过程各种掉坑，但不得不说，看到群友们现在不用切出去查 Wiki，直接在群里 `/riz random` 发起挑战，或者对着一张模糊的图猜得热火朝天，那种成就感真的比写多少行业代码都强。

写代码嘛，本来就是为了解决这点“不方便”，顺便折腾自己，乐在其中。

最后，发点好玩的
![](https://cloud.guguwo.top/d/picture-bed/4705832396d64f96ddad8eeec7cd47e8.webp)
![](https://cloud.guguwo.top/d/picture-bed/ed65a059fb70c5ea721d21add95e36c9.webp)
![](https://cloud.guguwo.top/d/picture-bed/2ed0b0a421b7997b46cc49161d4df913.webp)