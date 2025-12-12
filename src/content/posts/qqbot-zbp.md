---
title: 手把手教你部署专属QQ机器人
published: 2025-12-14
description: '从 NapCat 像素级配置到源码魔改，三种姿势教你把 Bot 抱回家。'
image: 'https://cloud.guguwo.top/d/picture-bed/QQ%25E5%259B%25BE%25E7%2589%258720240627223437.webp'
tags: ["NapCat", "ZeroBot-Plugin", "教程", "QQ机器人", "二次元"]
category: '教程'
draft: false
---

:::note[致各位 Master]
这是咱写的**超级喂饭教程**！(*/ω＼*)
看到群里大家都在玩娶群友、玩互动，是不是很想也搞一个？
不管你是萌新还是大佬，只要跟着做（连标点符号都不要漏哦），保证你能顺利把“老婆”抱回家！
:::

# 第一章：捏出躯壳 (NapCat 基础配置)
不管是哪种部署方式，我们都需要一个能登录 QQ 的“身体”。
目前最推荐使用的是 [**NapCat**](https://github.com/NapNeko/NapCatQQ-Desktop/releases/download/v1.7.28/NapCatQQ-Desktop-debug.exe) 或者 [**LLOneBot**](https://llonebot.com/)，咱们这里使用NapCat。

### 1. 准备“产房”
下载好 NapCat 后，请务必把它解压到一个**单独的、干净的文件夹**里。
*(千万不要直接扔在桌面上运行，不然生成的配置文件会把你的桌面炸满的！)*
![](https://cloud.guguwo.top/d/picture-bed/20251212165507727.webp)

### 2. 赋予声音 (签名服务)
打开 NapCat 主程序，我们开始捏人。很多小伙伴跑起来的 Bot 只能发文字，发不出漂亮的音乐卡片，就是因为这一步没做！

1.  看到主界面了吗？点击中间或者右上角的 **「添加」** 按钮。
![](https://cloud.guguwo.top/d/picture-bed/cf77dd69572949bb38adbfc922aff84e.webp)
2.  进入【基本配置】界面，**这里有三个空要填，请看黑板**：
    *   **Bot 名称**：随便填，比如“我的专属亚托利”。
    *   **Bot QQ**：填入你准备好的**小号 QQ 号**。
    *   **音乐签名 URL**： **全场最关键的一步！** 
        请复制下面这个链接填进去（不要多空格，不要少字母）：
        ```text
        https://llob.linyuchen.net/sign/music
        ```
        *:spoiler[不填这个，她发音乐卡片时就是哑巴哦！]*
![](https://cloud.guguwo.top/d/picture-bed/3cdab88d6e61ad6372130a337a135b72.webp)
3.  填完后，点击右下角的 **「添加」**，直到看到绿色的“成功”提示。
![](https://cloud.guguwo.top/d/picture-bed/b02e17a085a85949bba9a62d17945480.webp)
![](https://cloud.guguwo.top/d/picture-bed/2f6ce504b307c417704e3561017423f5.webp)

---

# 第二章：注入灵魂 (连接大脑)
身体准备好了，现在我们要给她装入“大脑”。为了照顾不同需求的群友，我准备了三个方案。
**绝大多数萌新请直接看【路线 A】！**

##  路线 A：托管模式 (难度：⭐)
**适合人群**：萌新，不想折腾代码，只想让机器人赶紧动起来。
**原理**：你的电脑只负责挂 QQ，计算和逻辑跑在我的服务器上。(白嫖使我快乐！)

### 1. 找到你的机器人
在 NapCat 的左侧列表中，点击你刚刚创建的那个机器人头像，进入它的详情页。
![](https://cloud.guguwo.top/d/picture-bed/de5f32599f335dd08e666c9c684ac88f.webp)
![](https://cloud.guguwo.top/d/picture-bed/132f93c22ae032cf7e8312cc57678ca4.webp)

### 2. 开启网络接口
1.  找到页面上方的 **「连接设置」** (或者叫网络配置) 选项卡。
![](https://cloud.guguwo.top/d/picture-bed/d4ffb91dd7e4eb355318f001f963f52e.webp)
2.  点击 **「添加连接设置」** 按钮。
![](https://cloud.guguwo.top/d/picture-bed/8cb4b8822bf7ef64b22861883c756a65.webp)
3.  在弹出的菜单里，一定要选择 **「WebSocket客户端」** (看清楚是客户端，不是服务端哦！)。
![](https://cloud.guguwo.top/d/picture-bed/b7c5450a72bc76dd9f307141087766c4.webp)

### 3. 抄作业时间 (关键！)
现在的界面里应该有好多框框，请**严格**按照下面的表格填写，错一个标点都不行：

| 设置项 | 填写内容/操作 |
| :--- | :--- |
| **启用** |  **必须勾选！** (不勾选是不工作的) |
| **调试** |  建议勾选 (方便看日志) |
| **上报自身消息** |  建议勾选 |
| **名称** | `Bot大脑连接` (名字随意) |
| **URL** | `ws://bot.guguwo.top` |
| **Token** | `DTvxx65cEZwPNRJLGhv8` |

:::warning[注意]
URL 和 Token 是连接我服务器的唯一钥匙！
复制的时候**千万不要多复制了空格**！
:::

4.  确认无误后，点击 **「OK」** 保存。
![](https://cloud.guguwo.top/d/picture-bed/fb5644463bf813a75ca780610a476de3.webp)

### 4. 保存修改
配置改完了不是马上生效的！
请点击页面上的 **「更新配置」**，再点击一下 **「启动」**按钮。
![](https://cloud.guguwo.top/d/picture-bed/8ead49d1b66cd8565a420d092f96f491.webp)

### 5. 唤醒仪式 (扫码)
1.  现在页面上会出现登录二维码。
2.  拿出手机，登录你的 **小号 QQ** 扫码。
3.  **重点**：扫码时手机上记得勾选 **“下次登录无需验证”**，不然以后每次重启都要扫码，会烦死你的！
![](https://cloud.guguwo.top/d/picture-bed/7be03900214d778d764dd65176d184af.webp)

### 6. 最终确认
去群里发一句：
```text
@Bot /响应
```
如果她回复了您**亚托莉将开始在此工作啦~**，恭喜你！你已经成功领养了一只野生 Bot！
![](https://cloud.guguwo.top/d/picture-bed/QQ_1765529357547.webp)

好的，Master！既然前面的“躯壳”和“白嫖大脑”都已经讲完了，接下来就是给那些**有自己电脑/服务器**，甚至**想要自己修改代码**的小伙伴准备的进阶课程啦！

保持队形，我们继续往下写！(ง •_•)ง

##  路线 B：本地整合包 (难度：⭐⭐⭐)
**适合人群**：有一台自己的电脑/服务器，想要拥有完全控制权，不想依赖咱的服务器，但又不想配置复杂开发环境的 Master。
**原理**：下载我编译好的“大脑”程序，直接在你自己的电脑上运行。

### 1. 下载“大脑”
去 [GitHub Releases](https://github.com/FloatTech/ZeroBot-Plugin/releases) 页面下载发布的最新版 `zbp_windows_amd64.zip` 。
![](https://cloud.guguwo.top/d/picture-bed/20251212170004296.webp)
下载好后，把它解压到一个**单独的文件夹**里。
*(里面会有 `zbp.exe` 和一些其他文件)*
双击运行`zbp.exe`，当输出如图所示警告则程序初始化就成功了awa
![](https://cloud.guguwo.top/d/picture-bed/20251212172342010.webp)

### 2. 编写启动脚本 (注入身份)
我们需要一个小脚本来启动她，并告诉她你的大号 QQ 是多少（这样你才有对于bot的超级管理员权限）。

1.  在文件夹里 **右键 -> 新建 -> 文本文档**。
![](https://cloud.guguwo.top/d/picture-bed/20251212172600344.webp)
2.  把文件名改为 `run.bat`。
    *   *注意：后缀名必须是 `.bat` 不是 `.txt`！如果你看不到后缀名，请去文件夹顶部的“查看”里把“文件扩展名”勾上！*
![](https://cloud.guguwo.top/d/picture-bed/20251212170517035.webp)
3.  右键 `run.bat` -> **编辑** (或者用记事本打开)，粘贴以下内容：
    ```bat
    @echo off
    :: -n 后面是机器人的名字，数字换成你的【大号QQ】
    :: 这样她就知道谁是主人啦！
    chcp 65001 >nul
    zbp.exe -n 亚托利 123456789
    pause
    ```
4.  同时按住键盘上的*Ctrl键与S键*进行保存后便可关闭窗口。

### 3. 启动与连接
1.  双击运行 `run.bat`。如果看到黑框框里有字在跳动，说明大脑启动成功了！
![](https://cloud.guguwo.top/d/picture-bed/20251212172342010.webp)
2.  回到 **NapCat 的连接设置** (参考路线 A 的步骤)：
    *   **ws正向连接**这次我们采用ws正向连接，请您点击侧边栏列表后找到您创建的bot点击它，再点击'添加聊天配置'，选择'WebSocket服务器'连接。
    ![](https://cloud.guguwo.top/d/picture-bed/20251212175206880.webp)
    ![](https://cloud.guguwo.top/d/picture-bed/20251212175323089.webp)
    *   **Host** 改为：`127.0.0.1`
    *   **Port** 改为：`6700`
    *   **Token**：与上文不同，留空即可。
    *   **其余**：无需更改。
    ![](https://cloud.guguwo.top/d/picture-bed/20251212175026469.webp)
    
---

##  路线 C：源码魔改 (难度：⭐⭐⭐⭐⭐)
**适合人群**：硬核玩家、想要修改游戏爆率、想给 Bot 加新功能的“疯狂科学家”。
**说明**：这里我会教你怎么修改源码，定制独属于你的 Bot。(参考了 MoeBlog 的经典教程哦~)

### 1. 搭建实验室 (环境配置)
要想从零创造生命，你需要工具：
*   **Git**：去官网下载 Git for Windows，安装时无脑下一步即可。
*   **Go 语言**：**敲黑板！** 推荐下载 **Go 1.25.x** 版本。
    *   *:spoiler[避坑指南：旧的 Go 1.24以下 版本已经不被支持，听劝，装新一点的稳定版！]*
    *   装好后，打开 CMD (命令提示符)，输入这行代码开启国内加速（不然下载会慢到哭）：
        ```bash
        go env -w GOPROXY=https://goproxy.cn,direct
        ```

### 2. 获取基因 (拉取源码)
在你想放项目的文件夹，右键空白处，选择 **「Git Bash Here」**，输入：
```bash
# 拉取核心代码
git clone https://github.com/FloatTech/ZeroBot-Plugin.git
# 拉取插件库 (可选，如果你想加更多好玩的功能)
git clone https://github.com/FloatTech/ZeroBot-Plugin-Playground.git
```
等待下载完成，你会看到文件夹，这就是 Bot 的全部“基因”了。

### 3. 基因手术 (代码修改)
我们要给 Bot 做个“认主手术”。用 VSCode (推荐) 或者记事本打开 `/main.go` 文件。

*   **设定主人 (唯一指定Master)**：
    找到 `sus` 变量 (大概在 250 行左右)。
    ```go
    // 把里面的数字改成你的大号 QQ
    sus = append(sus, 123456789)
    // 如果你有两个号，可以复制一行继续加
    sus = append(sus, 987654321)
    ```

*   **修改名字**：
    找到 `nicks` 变量。
    ```go
    // 给她起个好听的名字吧
    nicks = append(nicks, "亚托利")
    ```

*   **装入新插件 (增加技能)**：
    比如你想装个 `kokomi` (原神) 插件：
    1. 把 `Playground` 里的 `kokomi` 文件夹复制到 `ZeroBot-Plugin/custom/plugin/` 下。
    2. 回到 `ZeroBot-Plugin/custom/` 目录下，复制一份 `doc.go` 并将其改名为 `register.go` 
    ![](https://cloud.guguwo.top/d/picture-bed/20251212181021386.webp)
    3. 在 `register.go` 顶部的 `import` 区域注册,如下格式：
    ```go
    // Package custom 注册用户自定义插件于此
    package custom

    import (
        _ "github.com/FloatTech/ZeroBot-Plugin/custom/plugin/bank" // 银行
        _ "github.com/FloatTech/ZeroBot-Plugin/custom/plugin/kokomi"   // 您导入的插件
    )

    ```
    4. 回到 `ZeroBot-Plugin/custom/plugin/` 下，打开终端(`在路径栏输入cmd后回车`)输入：

    ```bash
    go run github.com/FloatTech/ZeroBot-Plugin/abineundo/ref -r .
    ```
    后回车

    ![](https://cloud.guguwo.top/d/picture-bed/20251212182017312.webp)

*   **数值修改 (钞能力)**：
    觉得钓鱼太难？进入 `plugin/mcfish` 文件夹，搜索代码里的 `Limit` 或者 `50`，改成 `999`，你就是钓鱼王！

### 4. 唤醒生命 (运行)
在项目根目录下双击`run.bat`：
![](https://cloud.guguwo.top/d/picture-bed/20251212182642579.webp)
如果不报错，您的专属魔改版 Bot 就诞生啦！(≧∇≦)ﾉ

---

#  最后的碎碎念 (Q&A)

**Q: 为什么她不理我？**
A: 
1. 检查 NapCat 的 **Websocket 客户端** 是不是没勾选“启用”？
2. URL 和 Token 是不是复制多了空格？
3. 试着对她说 `/响应` 激活一下？(新 Bot 往往比较害羞)

**Q: 猜歌/发图功能没反应？**
A: 可能是 **音乐签名 URL** (第一章第2步) 没填对，或者网络卡顿，稍等一下再试。

**Q: 怎么看她有哪些功能？**
A: 在群里发送 `/服务列表`，那是她的技能表。发送 `/用法 <功能名>` 可以看说明书。

**Q: 我可以白嫖服务器多久？**
A: 只要我不破产，服务器就会一直开着！大家尽管用，但也请爱护她，不要恶意攻击哦~ (｡>∀<｡)

好啦，今天的课程就到这里！快去和你的专属 Bot 贴贴吧！如果是源码部署遇到困难，记得来群里959354782找咱玩哦~