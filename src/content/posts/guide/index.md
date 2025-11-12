---
title: Fuwari 博客模板综合使用指南
published: 0721-07-21
description: "一份关于如何使用 Fuwari 博客模板的全面指南，涵盖文章元数据、Markdown 基础与扩展语法、代码块高亮、视频嵌入等功能。"
image: "./cover.jpeg"
tags: ["Fuwari", "博客", "自定义", "Markdown", "指南"]
category: 指南
draft: false
---

> 封面图片来源: [Source](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/208fc754-890d-4adb-9753-2c963332675d/width=2048/01651-1456859105-(colour_1.5),girl,_Blue,yellow,green,cyan,purple,red,pink,_best,8k,UHD,masterpiece,male%20focus,%201boy,gloves,%20ponytail,%20long%20hair,.jpeg)

该博客模板基于 [Astro](https://astro.build/) 构建。本指南未提及的内容，您或许可以在 [Astro 官方文档](https://docs.astro.build/) 中找到答案。

## 文章元数据 (Front-matter)

每篇文章顶部的 YAML 代码块用于定义文章的元数据。

```yaml
---
title: 我的第一篇博客文章
published: 2023-09-09
description: 这是我 Astro 新博客的第一篇文章。
image: ./cover.jpg
tags: [Foo, Bar]
category: 前端
draft: false
---
```

| 属性 (`Attribute`) | 描述 (`Description`)                                                                                                                                                            |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `title`            | 文章的标题。                                                                                                                                                                    |
| `published`        | 文章的发布日期。                                                                                                                                                                |
| `updated`          | (可选) 文章的更新日期。                                                                                                                                                         |
| `description`      | 文章的简短描述，会显示在首页。                                                                                                                                                  |
| `image`            | 文章的封面图片路径。<br/>1. 以 `http://` 或 `https://` 开头：使用网络图片<br/>2. 以 `/` 开头：使用 `public` 目录下的图片<br/>3. 无上述前缀：相对于当前 Markdown 文件的路径 |
| `tags`             | 文章的标签。                                                                                                                                                                    |
| `category`         | 文章的分类。                                                                                                                                                                    |
| `draft`            | 文章是否为草稿。若为 `true`，则文章不会被公开发布和展示。                                                                                                                         |

### 草稿示例
如果一篇文章仍在撰写中，不希望被公开发布，可以将其 `draft` 字段设置为 `true`。

```markdown
---
title: 草稿示例
published: 2022-07-01
tags: [Markdown, Blogging, Demo]
category: Examples
draft: true
---

# 这篇文章是一篇草稿

这篇文章目前处于草稿状态，不会被发布。
```

## 文章存放位置

您的文章文件应放置在 `src/content/posts/` 目录下。您也可以创建子目录来更好地组织您的文章和相关资源。

```
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```

## 基础 Markdown 语法

### 标题

```markdown
# H1 标题
## H2 标题
### H3 标题
```

### 文本格式

段落之间通过一个空行分隔。

这是第二段。_斜体_, **粗体**, 和 `等宽字体`。

### 列表

**无序列表**
```markdown
- 列表项一
- 列表项二
- 列表项三
```

**有序列表**
```markdown
1. 第一项
2. 第二项
3. 第三项
```

**嵌套列表**
```markdown
1. 首先，准备这些食材：
    - 胡萝卜
    - 芹菜
    - 扁豆
2. 烧开一些水。
3. 把所有东西倒进锅里，然后遵循
    这个算法：

        找到木勺
        揭开锅盖
        搅拌
        盖上锅盖
        小心地把木勺平衡在锅柄上
        等待10分钟
        返回第一步（或者完成后关火）
```

**定义列表**
```markdown
苹果
: 做苹果酱的好材料。

橘子
: 柑橘类水果！

西红柿
: Tomatoe 这个词里没有 "e"。```

### 引用块

> 引用块是
> 这么写的。
>
> 如果需要，它们可以
> 跨越多个段落。

### 代码块

使用4个空格缩进或使用三个反引号 ``` 来创建代码块。

````
```python
import time
# 快，数到十！
for i in range(10):
    # (但不要 *太* 快)
    time.sleep(0.5)
    print i
```````

### 其他

**链接**
```markdown
这是一个指向 [某个网站](http://foo.bar) 的链接。
```

**脚注**
```markdown
这是一个脚注 [^1]。

[^1]: 脚注文本放在这里。
```

**水平分割线**
```markdown
---
```

**表格**
```markdown
尺寸   材质      颜色
---    ---       ---
9      皮革      棕色
10     麻帆布    自然色
11     玻璃      透明

Table: 鞋子、尺码及其材质
```

**数学公式**

行内公式：$\omega = d\phi / dt$

块级公式：
$$I = \int \rho R^{2} dV$$

## 嵌入视频

只需从 YouTube 或其他平台复制嵌入代码，并将其粘贴到 Markdown 文件中即可。

### YouTube

<iframe width="100%" height="468" src="https://www.youtube.com/embed/5gIf0_xpFPI?si=N1WTorLKL0uwLsU_" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### Bilibili

<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1fK4y1s7Qf&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

## 扩展功能

### GitHub 仓库卡片
您可以添加动态的 GitHub 仓库卡片，页面加载时会从 GitHub API 拉取仓库信息。

::github{repo="Fabrizz/MMM-OnSpotify"}

使用 `::github{repo="<owner>/<repo>"}` 代码来创建一个 GitHub 仓库卡片。

```markdown
::github{repo="saicaca/fuwari"}
```

### 提示框 (Admonitions)

支持以下几种类型的提示框：`note` `tip` `important` `warning` `caution`

:::note
用于突出那些即使用户只是扫读也应该注意到的信息。
:::

:::tip
提供可选信息，帮助用户更成功地完成任务。
:::

:::important
对用户成功至关重要的信息。
:::

:::warning
因潜在风险而需要用户立即关注的关键内容。
:::

:::caution
指出某个行为可能带来的负面后果。
:::

#### 自定义标题
提示框的标题可以自定义。

:::note[我的自定义标题]
这是一个带有自定义标题的提示框。
:::

```markdown
:::note[我的自定义标题]
这是一个带有自定义标题的提示框。
:::
```

#### GitHub 风格语法
同样支持 GitHub 风格的提示框语法。

> [!TIP]
> [GitHub 语法](https://github.com/orgs/community/discussions/16925) 也是被支持的。

```markdown
> [!NOTE]
> 支持 GitHub 语法。
```

### 隐藏内容 (Spoiler)
您可以在文本中添加隐藏内容，点击后才会显示。内容区域也支持 **Markdown** 语法。

这部分内容 :spoiler[是隐藏的 **嘿嘿**]!

```markdown
这部分内容 :spoiler[是隐藏的 **嘿嘿**]!
```

## 代码块高级功能 (Expressive Code)

本模板使用 [Expressive Code](https://expressive-code.com/) 来增强代码块的显示效果。

### 语法高亮

**常规语法高亮**
```js
console.log('这段代码被语法高亮了！')
```

**渲染 ANSI 转义序列**
```ansi
ANSI colors:
- Regular:  [31mRed [0m  [32mGreen [0m  [33mYellow [0m  [34mBlue [0m  [35mMagenta [0m  [36mCyan [0m
- Bold:     [1;31mRed [0m  [1;32mGreen [0m  [1;33mYellow [0m  [1;34mBlue [0m  [1;35mMagenta [0m  [1;36mCyan [0m
```

### 编辑器与终端窗口边框

**代码编辑器边框**
```js title="my-test-file.js"
console.log('使用 title 属性的例子')
```

**终端窗口边框**
```bash
echo "这个终端窗口没有标题"
```

### 文本与行标记

**标记整行与行范围**
```js {1, 4, 7-8}
// 第 1 行 - 通过行号标记
// 第 2 行
// 第 3 行
// 第 4 行 - 通过行号标记
// 第 5 行
// 第 6 行
// 第 7 行 - 通过范围 "7-8" 标记
// 第 8 行 - 通过范围 "7-8" 标记
```

**选择标记类型 (mark, ins, del)**
```js title="line-markers.js" del={2} ins={3-4} {6}
function demo() {
  console.log('这行被标记为删除')
  // 这行和下一行被标记为插入
  console.log('这是第二行插入的内容')

  return '这行使用默认的中性标记类型'
}
```

**使用类似 diff 的语法**
```diff
+这行将被标记为插入
-这行将被标记为删除
这是一行常规文本
```

**标记行内指定文本**
```js "given text"
function demo() {
  // 标记行内的任何指定文本
  return '支持对指定文本的多个匹配项进行标记';
}
```

**使用正则表达式**
```ts /ye[sp]/
console.log('单词 yes 和 yep 会被标记。')
```

### 自动换行

**为代码块配置自动换行**
```js wrap
// 自动换行的例子
function getLongString() {
  return '这是一个非常非常长的字符串，除非容器特别宽，否则很可能无法在可用空间内完全显示'
}
```

### 可折叠区域
通过 `collapse` 属性可以折叠指定的代码行。

```js collapse={1-5}
// 这部分样板代码将被折叠
import { someBoilerplateEngine } from '@example/some-boilerplate'
import { evenMoreBoilerplate } from '@example/even-more-boilerplate'

const engine = someBoilerplateEngine(evenMoreBoilerplate())

// 这部分代码默认可见
engine.doSomething(1, 2, 3)
```

### 行号

**显示行号**
```js showLineNumbers
// 这个代码块会显示行号
console.log('来自第 2 行的问候！')
console.log('我在第 3 行')
```

**更改起始行号**
```js showLineNumbers startLineNumber=5
console.log('来自第 5 行的问候！')
console.log('我在第 6 行')
``````