---
title: Google One 免费试用叠加链路的失效分析
published: 2026-11-06
description: '对一个宣称可零成本叠加 24 个月的订阅自动化脚本做行为取证：先讲清 Play 订阅的顺延机制与试用资格模型，再用四组对照实验证明第二、三层为何不可达，最后给出八个 Playwright 实现陷阱。'
tags: ["逆向", "Playwright", "Google One", "自动化", "取证"]
category: '逆向分析'
draft: false
---

# 摘要

市面上一类订阅自动化脚本声称可以把 Google AI Pro 的免费试用叠加到 24 个月：
首层 12 个月、第二层再叠 6 个月、第三层再叠 6 个月，全程 `US$0.00`。
本文在自有账号上完整复现了这套流程，并对结果做状态级核对，得到三个可验证的结论：

1. 首层 12 个月真实有效，账单金额 `US$0.00`，到期日准确。
2. 第二、三层在「AI Pro + YouTube 附加包」这一 Bundle 结构下不可达。
   四种请求变体全部失败，且未产生任何订单记录。
3. 脚本日志中的「叠加完成」是假阳性：成功判定命中了错误弹窗的关闭按钮文本。

与结论同样重要的是**机制**：为什么订阅能「顺延」、为什么试用资格会卡住第二层、
为什么少一个条目会得到 500 而不是一个更明确的错误。第一节先把这套模型讲清楚，
后面的实验现象才有解释力。

# 一、原理

## 1.1 Play 订阅的数据模型

Google Play 的订阅不是「一个商品一个价格」这么简单，它是三层结构：

```text
Subscription        订阅（用户实际持有的东西）
  └─ Base plan       基础方案（计费周期、价格）
       └─ Offer      优惠（可含多个 phase）
            └─ Phase 阶段（时长 + 价格，免费试用只是价格为 0 的 phase）
```

一个 **phase** 是「一段时间 + 这段时间的价格」。免费试用就是一个
`duration = 12 个月, price = 0` 的 phase，其后接一个
`duration = 无限, price = US$19.99/月` 的 phase。

用户看到的「免费试用 12 个月」，本质是这条 phase 链：

```text
phase[0]: 0 元, 12 个月      <- 试用
phase[1]: US$19.99/月, 无限  <- 正常计费
```

结账弹窗里的「开始日期：2027年11月6日」，指的不是订阅开始日，
而是 **phase[1] 的开始日**，也就是试用结束、开始扣款的那一天。
理解这一点，后面所有日期才对得上。

## 1.2 多条目订阅与 Bundle

一个订阅可以包含多个 **item**（条目）。本次实验的订单是：

```text
Google AI Pro (5 TB) + YouTube Premium Individual Add On
```

两个条目各自有独立的 phase 链：

```text
item[0] AI Pro 5TB
    phase[0]: 0 元, 12 个月          -> 2026-11-06 至 2027-11-06
    phase[1]: US$19.99/月            -> 2027-11-06 起

item[1] YouTube Premium Individual
    phase[0]: 0 元, 1 个月           -> 2026-11-06 至 2026-12-06
    phase[1]: US$11.99/月            -> 2026-12-06 起
```

因为两个条目的试用期不同，它们的 `phase[1]` 开始日也不同：

```text
2026-11-06        2026-12-06              2027-11-06
    |                 |                       |
    |<-- YT 试用 1M -->|                       |
    |<------------ AI Pro 试用 12M ----------->|
                      |                       |
                 YT 开始计费             AI Pro 开始计费
```

这就是「下次付款日期：2026年12月6日」的来源 —— Play 的订阅页只展示
**最近的那个** `phase[1]` 开始日，也就是 YouTube 条目的。

## 1.3 「顺延」是怎么实现的

这是整套玩法的技术核心。

Play 允许用一个新订阅**替换**现有订阅。替换时有一个关键语义：
新订阅的 phase[0] 可以**延迟到旧订阅结束之后**才开始，而不是立即生效。

用时间轴表示。假设当前账号持有一个到 2027-11-06 结束的订阅，
现在提交一个「AI Pro 6 个月试用」的替换请求：

```text
旧订阅:  2026-11-06 ============================== 2027-11-06
                                                        |
新订阅:                                                  phase[0] 0 元 6 个月
                                                        2027-11-06 -> 2028-05-06
                                                        |
                                                        phase[1] US$19.99/月
                                                        2028-05-06 起
```

结果就是总时长变成 12 + 6 = 18 个月。再叠一次 6 个月就是 24 个月。
脚本所谓「三层叠加」，叠的就是这个延迟启动的 phase。

这个机制在实验中有直接证据。执行第二层时，结账弹窗写的是：

```text
开始日期：2028年5月6日   US$31.98/month 含税（US$0.00）
  Google AI Pro (5 TB) US$19.99
  YouTube Premium Individual Add On US$11.99
```

`2028-05-06` 恰好等于 `2027-11-06 + 6 个月`。也就是说，服务端**确实**接受并正确计算了
「6 个月试用接在现有订阅之后」这件事。顺延逻辑本身是通的。

失败发生在别的地方。

## 1.4 试用资格是账号级的一次性资源

免费试用不是「每个订阅都能领一次」，而是**每个账号、每个 offer 只能消耗一次**。
服务端维护着资格记录：某个账号是否已经用过某个商品的试用。

首层执行时，账号同时消耗了两份资格：

```text
AI Pro 12M 试用资格   已消耗
YouTube 1M 试用资格   已消耗
```

关键在于：**这两份资格是一次性消耗品，且与订阅生命周期无关**。
即使你后来取消了订阅、等试用期结束、甚至把订阅退掉，资格也不会恢复。

## 1.5 第二层为什么必然失败

把 1.3 和 1.4 放在一起，结论就出来了。

替换式升级的语义是「用一组新的条目替换当前的条目集合」。服务端在处理时有两条硬约束：

**约束 A：条目集合必须与当前订阅一致。**
多条目订阅的替换是原子的，不能只替换其中一部分。
少一个条目，服务端认为请求描述的订阅与现有订阅不匹配，直接拒绝。

**约束 B：每个条目都必须落在某个合法的 offer 上。**
替换后每个 item 都要有 phase 链。要让它「免费」，就必须挂一个免费试用 offer。
而 offer 有资格校验：账号没有资格，就不能挂。

于是第二层的两条路都断了：

```text
路径一：只替换 AI Pro，丢掉 YouTube 条目
         -> 违反约束 A -> 服务端返回通用错误 / 500

路径二：两个条目都带，YouTube 也挂试用 offer
         -> 违反约束 B（YT 资格已消耗）-> 「您不符合条件，无法免费试用」
```

如果给 YouTube 条目挂一个「非试用」的 offer（即 `token = []` 或 `None`），
等于让它在替换后立刻进入计费 phase，服务端同样不接受这种组合，返回 500。

这就解释了四组实验的全部现象 —— 不是风控，不是时序，是约束 A 与约束 B 同时成立时的空集。

## 1.6 一个常见误解

「等 12 个月试用结束再叠第二层」这个想法不成立：

- 试用结束时，YouTube 资格同样早已消耗（它是 1 个月期的）
- 资格不随订阅结束而恢复
- 而且订阅一旦结束，就不再是「替换」，而是「新购」，届时 AI Pro 的 12 个月资格也已消耗

「换个新号重新叠」同样不成立：新号执行首层时，同样会一次性消耗掉 YouTube 资格，
第二层面对的仍是同一个空集。

所以这个限制是**结构性的**，与账号状态、时间点、网络环境都无关。

## 1.7 请求是在哪一步被改写的

脚本能替换条目，是因为整条结账链路是**客户端组装请求**的：

```text
one.google.com/plans  --(点击升级)-->  拉起 iframe
    tokenized.play.google.com/eacquire/multiline?...&ear=[...]
        |
        +-- JS 读取 ear 参数，组装 full_items
        +-- POST /_/PlayCommerceAcquireUi/data/batchexecute?rpcids=Ngbm
                body: full_items = [ [商品,21], null, null, null, 1, [试用token] ], ...
```

`ear` 是 URL 编码的数组参数，描述「买什么、买几份、用哪些凭证」；
`full_items` 是真正提交给服务端的条目数组；升级场景下还会额外带一个
现有订阅的 24 位 `sub_id`（脚本内部称为 `ear8`）。

脚本的做法是在页面里注入一段 Hook，拦截 XHR 的 `send`，把请求体替换成自己的版本。
服务端并不信任客户端 —— 它会重新校验价格、资格、条目一致性。
所以改写请求只能改变「请求什么」，不能改变「能不能给」。
这正是为什么失败会以「不符合条件」和 500 的形式出现，而不是静默成功。

# 二、实验环境

| 项 | 值 |
|---|---|
| 系统 | Windows 11 |
| 浏览器 | Chrome，通过 `--remote-debugging-port` 启动，Playwright `connect_over_cdp` 接管 |
| Python | 3.14 |
| 账号 | 两个自有账号，各自独立 Chrome profile、独立端口、独立住宅代理会话 |
| 区域 | 美国（US），账单地址为美国地址 |
| 支付方式 | 余额为 0 的虚拟卡（用于验证不会真的扣款） |
| 时间 | 2026-11-06 |

账号隔离是必要的：共用出口 IP 或浏览器指纹会让两个账号的状态互相污染，
排查时无法区分是链路问题还是风控问题。

# 三、脚本的执行模型

脚本的流程可以抽象成五步：

```text
Step 1  登录（含辅助邮箱 / 2FA）
Step 2  首层：AI Pro 12M + YouTube 1M     -> 12 个月
Step 3  二层：AI Pro 6M  + YouTube 1M     -> 18 个月
Step 4  三层：AI Pro 6M  + YouTube 1M     -> 24 个月
Step 5  取消自动续费并截图验真
```

Step 2 到 Step 4 复用同一个函数，差别只在传入的 `cfg`：

```python
cfg = {
    "name": "Step3_Layer2_6MSS_YTFree_ZeroCost",
    "full_items": [
        [ [PREFIX + "g1.2tb.ai.subs_variant", 21], None, None, None, 1, [TOK_PRO5TB_6M_SS] ],
        [ [PREFIX + "g1.youtube_premium_individual_add_on", 21], None, None, None, 1, [YT_FREE_TOK] ],
    ],
    "ear8": [None, 5, None, None, None, [sub_id]],
}
```

流程：

1. 打开 `one.google.com/plans`；
2. 注入脚本，把即将发出的结账请求替换为上面的 `cfg`；
3. 点击「升级」，等待 `eacquire` 弹窗；
4. 点击弹窗里的「订阅」；
5. 用关键字判断是否成功。

第 5 步是问题所在。

# 四、首层：真实生效

Step 2 的结账弹窗（原文摘录）：

```text
Google AI Pro (5 TB) + YouTube Premium Individual Add On
即将收取的费用
今天 US$0.00
  Google AI Pro (5 TB) - 免费试用 12 个月                 US$0.00
  YouTube Premium Individual Add On - 免费试用 1 个月     US$0.00
开始日期：2026年12月6日   US$11.99/month 含税（US$0.00）YouTube Premium Individual Add On
开始日期：2027年11月6日   US$31.98/month 含税（US$0.00）Google AI Pro (5 TB) US$19.99
                                                          + YouTube Premium Individual Add On US$11.99
```

对照 1.1 的模型：两个 `phase[1]` 开始日分别是 `2026-12-06` 与 `2027-11-06`，
与两个条目各自的试用时长完全一致。

状态核对：

```text
# play.google.com/store/account/subscriptions
活跃 | Google AI Pro (5 TB) + YouTube Premium Individual Add On
[关闭续费后] 已取消 | 您的订阅期将于 2027年11月6日结束 | 重新订阅

# play.google.com/store/account/orderhistory
十一月的总支出：US$0
Google AI Pro (5 TB) + YouTube Premium Individual Add On | 2026年11月6日 | US$0.00

# one.google.com/settings
当前方案 Google AI Pro (5 TB) | US$19.99/月 | 结束时间：2027年11月6日
```

起始日 2026-11-06，结束日 2027-11-06，恰好 12 个月，实付 `US$0.00`。

# 五、失效点一：成功判定

## 5.1 现象

Step 3 与 Step 4 的日志：

```text
[step3_layer2_6mss] 检测到订阅成功确认提示
Step 3 (二层 6个月免费包 US$0.00 -> 18个月) 叠加完成！等待 45 秒同步订阅 ID...
[step4_layer3_6m] 检测到订阅成功确认提示
Step 4 (三层 6个月免费包 US$0.00 -> 24个月封顶) 叠加完成！
```

但订阅页的到期日没有变化，订单记录也没有新增。

## 5.2 代码

`automation_engine.py:1349-1368`：

```python
if any(ok_kw in clean_after for ok_kw in (
        "已订阅", "Subscribed", "感谢您订阅",
        "通过此类购买活动获取", "Google Play 积分", "Play Points",
        "Earn Google Play Points", "开启备用付款方式", "添加备用付款方式",
        "备用付款方式", "Backup payment", "以后再说", "知道了", "Got it",
)):
    self.log(f"[{step_tag}] 检测到订阅成功确认提示")
    await self.save_screenshot(page, f"{step_tag}_after_click")
    try:
        dismiss_btn = f2.locator('button:has-text("以后再说"), ...').first
        ...
```

`clean_after` 是点击「订阅」后 iframe 的 `innerText`。失败时的弹窗是：

```text
错误
我们这边出了点问题，请重试。
[知道了]
```

`知道了` 在关键字列表里。于是「关闭错误弹窗」被判定为「订阅成功」。

同类问题还有 `以后再说` / `Not now` —— 它们本是「成功提示里的关闭按钮」，
被一并收进成功关键字后，成功与失败两条路径就无法区分了。

## 5.3 后果链

这个假阳性不是单点 bug，它会沿流水线放大：

```text
点击订阅 -> 服务端拒绝 -> 弹窗出现「知道了」
    -> 命中成功关键字 -> 记录「成功」-> 继续 Step 4
    -> Step 4 同样失败、同样报成功 -> 继续 Step 5
    -> Step 5 截图「验真」，得到一张什么都没变的订阅页
```

最终输出一份「24 个月已完成」的报告，附一张真实但无意义的截图。
整个过程中没有任何异常被抛出。

## 5.4 正确做法

业务结果只能用状态判定：

| 信号 | 获取方式 | 期望 |
|---|---|---|
| 订单 | `play.google.com/store/account/orderhistory` | 新增一条 `US$0.00` |
| 到期日 | `play.google.com/store/account/subscriptions` | 后移到预期月份 |
| 会员结束时间 | `one.google.com/settings` | 与到期日一致 |

参考实现：

```python
async def verify_after_subscribe(page, expect_year_month: str) -> bool:
    await page.goto("https://play.google.com/store/account/subscriptions?hl=zh-CN")
    await asyncio.sleep(5)
    subs = await page.inner_text("body")

    await page.goto("https://play.google.com/store/account/orderhistory?hl=zh-CN")
    await asyncio.sleep(6)
    orders = await page.inner_text("body")

    has_order = "US$0.00" in orders
    moved = expect_year_month in subs
    return has_order and moved
```

弹窗只用来判断「流程是否走完」，不用来判断「交易是否成功」。

# 六、失效点二：四组对照实验

## 6.1 首次现象

Step 3 的弹窗里出现：

```text
通过 Play 订阅
您不符合条件，无法免费试用 YouTube Premium Individual Add On
```

按 1.5 的模型，这正是约束 B 被触发。弹窗仍允许点击「订阅」，点击后报：

```text
目前无法完成结账。请尝试刷新页面。
```

## 6.2 实验设计

变量只有 `full_items` 的组成，其余保持一致。

| 变体 | `full_items` | 弹窗表现 | 提交结果 | 订单 |
|---|---|---|---|---|
| A | AI Pro 6M + YouTube 1M（原版） | 正常渲染，含「不符合条件」提示 | 「目前无法完成结账」 | 无 |
| B | 仅 AI Pro 6M | 直接显示「错误 我们这边出了点问题」 | 无法提交 | 无 |
| C | AI Pro 6M + YouTube 条目，token = `[]` | 同 B | 无法提交 | 无 |
| D | AI Pro 6M + YouTube 条目，token = `None` | `Error 500 (服务器错误)` | 无法提交 | 无 |

补充实验 E：保持订阅活跃（不取消、不重新订阅）后重跑原版，日志报成功，状态无变化。

## 6.3 结果与模型对照

| 变体 | 违反的约束 | 服务端表现 |
|---|---|---|
| B | A（条目缺失） | 通用错误 |
| C | B（YouTube 无有效 offer） | 通用错误 |
| D | B（同上，且字段为空值） | 500 |
| A | B（YouTube 资格已消耗） | 「不符合条件」+ 结算失败 |

服务端没有给出结构化的错误码，只有文案与 HTTP 状态，
这也是脚本能拿「知道了」当成功信号的原因之一 —— 它没有可解析的错误对象。

## 6.4 决定性指标：订单记录

所有变体执行完毕后：

```text
十一月的总支出：US$0
Google AI Pro (5 TB) + YouTube Premium Individual Add On | 2026年11月6日 | US$0.00
```

只有一笔。若升级成功，Play 必然新增一条 `US$0.00` 订单。
没有订单即没有交易，这一条无法被日志或截图推翻。

# 七、账单里的两个日期

首层完成后第一次打开 Play 订阅页：

```text
下次付款金额：US$11.99，下次付款日期：2026年12月6日
```

这属于 YouTube 条目（见 1.2 的时间轴），不是 AI Pro。
Play 只展示最近的 `phase[1]` 开始日，所以看起来像「一个月就到期」。

实际风险在这里：不关闭续费的话，2026-12-06 会尝试扣除 `US$11.99`。
余额为 0 的卡必然失败，而扣款失败通常会导致整个订阅被暂停，
12 个月的 AI Pro 会跟着一起没。

关闭续费后，订阅进入「到期终止」状态，两个条目都跑到 2027-11-06 结束，
中间不再产生任何扣款：

```text
已取消 | 您的订阅期将于 2027年11月6日结束 | 重新订阅
```

这也是为什么「下次付款」那一行会整行消失。

# 八、实现层面：八个 Playwright 陷阱

以下全部来自真实失败，与具体业务无关，做任何 Google 支付类自动化都会遇到。

## 8.1 `Escape` 会关闭整个对话框

**现象**：在「添加支付方式」里按 `Escape` 想收起地址补全浮层，整个对话框被关闭，
已填内容全部丢失，`instrument_manager` iframe 被销毁。

**原因**：`Escape` 是对话框级快捷键，由最外层组件消费，输入框并未处理它。

**处理**：全程不发送 `Escape`。收起浮层的正确方式是让输入框失焦 ——
把焦点移到下一个字段，浮层自然收起。

## 8.2 填写卡号后 iframe 会重新加载

**现象**：`Frame.evaluate: Frame was detached`，后续基于旧 `Frame` 句柄的操作全部失败。

**原因**：卡号（BIN）校验通过后，Google Payments 重新加载 `instrument_manager`，
以加载地址区配置、国家规则与持卡人预填，旧 `Frame` 对象失效。

**处理**：不缓存 `Frame`，每次交互前按 URL 重新获取。

```python
def find_frame(ctx, key):
    for p in ctx.pages:
        for f in p.frames:
            if key in (f.url or ""):
                return p, f
    return None, None


async def wait_frame(ctx, key, timeout=25):
    for _ in range(timeout * 2):
        p, f = find_frame(ctx, key)
        if f:
            return p, f
        await asyncio.sleep(0.5)
    return None, None
```

## 8.3 补全浮层拦截点击

**现象**：`locator.click()` 超时；追加 `force=True` 仍然超时。

**原因**：`force` 只跳过 `receives events` 检查，不做命中测试的豁免。
元素仍在补全浮层之下，事件落到浮层上。

**处理**：不使用点击，改为 `focus()` + 键盘输入：

```python
await frame.evaluate("s => { const e = document.querySelector(s); if (e) e.focus(); }", sel)
await page.keyboard.press("Control+A")
await page.keyboard.press("Delete")
await page.keyboard.type(value, delay=80)
```

## 8.4 州字段是 combobox，不是 `<select>`

**现象**：`fill("MI")` 后输入框显示 `MI`，保存时报「州无效」。

**原因**：`address-level1` 是 `goog.ui.ComboBox`，提交的是选项值（`Michigan`），
不是输入文本。仅修改 `value` 不会选中任何选项。

**处理**：输入州名后从补全列表选择，并回读校验：

```python
state_value = await frame.evaluate(
    "() => (document.querySelector('input[autocomplete=\"address-level1\"]') || {}).value"
)
# 期望 "Michigan"，而不是 "MI"
```

## 8.5 合成事件会触发二次验证

**现象**：`page.evaluate("el.click()")` 点击「订阅」「保存」，要么无反应，要么跳到身份验证。

**原因**：合成事件的 `isTrusted` 为 `false`，Google 在支付与登录链路上会将其识别为脚本行为。

**处理**：统一使用真实输入事件。

```python
# 方式一：坐标点击
await page.mouse.move(x, y)
await page.mouse.down()
await page.mouse.up()

# 方式二：locator.click()，内部通过 CDP 派发 Input.dispatchMouseEvent
await locator.click()
```

## 8.6 两个到期日

见第 7 节。判断订阅状态以「结束时间」为准，不以「下次付款」为准。
关闭续费后「下次付款」应当整行消失。

## 8.7 CDP 接管与端口冲突

脚本通过 `--remote-debugging-port` 启动 Chrome，再用 `connect_over_cdp` 接管。两个细节：

- 启动前清理占用该端口的旧进程，否则新实例会复用旧进程，
  `connect_over_cdp` 连上的是上一次的浏览器状态：
  ```powershell
  netstat -ano | findstr :9342
  taskkill /F /T /PID <pid>
  ```
- 每个账号使用独立的 `--user-data-dir`。共用 profile 会导致 Cookie 串号，
  两个账号的登录态互相覆盖。

## 8.8 代理链路与区域一致性

Google 的订阅价格、支付方式可用性、试用资格都与账号区域相关。
本次实验使用两层代理：

```text
浏览器 -> 本地 CONNECT relay (127.0.0.1:18081)
            ├── 支付相关域名 -> 本地 mihomo (127.0.0.1:7897)
            └── 其余域名     -> 住宅代理（按账号分配 sticky session）
```

经验：

- 住宅代理按账号分配独立的 sticky session，避免两个账号共用出口 IP。
- 支付域名单独走一条链路，减少住宅代理 TLS 指纹差异带来的干扰。
- 启动后先验证出口 IP 的区域，再执行任何页面操作。
- 浏览器必须禁用非代理 UDP（`--webrtc-ip-handling-policy=disable_non_proxied_udp`），
  否则 WebRTC 会泄漏真实 IP。

# 九、可复现的最小链路

剔除无效步骤后，能稳定跑通的部分：

```text
[0] 准备
    独立 Chrome profile + 独立出口 IP + 独立调试端口

[1] 登录
    accounts.google.com -> 邮箱 -> 密码 -> 手机 Prompt
    勾选「在此设备上不再询问」，后续同一 profile 不再弹

[2] 盘点
    play.google.com/store/account/subscriptions    有无订阅
    play.google.com/store/paymentmethods           有无支付方式
    one.google.com/plans                           是否显示目标区域价格
    wallet -> 添加支付方式 -> 观察 COUNTRY 字段

    判断：
      COUNTRY = US 且 disabled  -> 全新账号，直接绑卡
      COUNTRY = 其他国家        -> 需先处理历史付款资料

[3] 绑卡
    wallet.google.com/wallet/paymentmethods -> 添加支付方式
    instrument_manager iframe 内填写卡号 / 有效期 / CVC / 持卡人 / 账单地址

    成功判据（两个页面都要对）：
      wallet.google.com/wallet/paymentmethods -> Visa **** 1234 11/27
      play.google.com/store/paymentmethods    -> Visa-1234

[4] 订阅（人工确认）
    one.google.com/plans -> 目标方案 -> 结账弹窗
    必须确认弹窗写的是「今天 US$0.00」，再点击「订阅」

[5] 立即关闭自动续费
    play.google.com/store/account/subscriptions -> 管理 -> 取消订阅

[6] 复核
    订单记录新增一条 US$0.00
    订阅页显示「您的订阅期将于 YYYY年MM月DD日结束」
    「下次付款」字样消失
```

判据只有三条：

```text
1. 订单记录新增一条 US$0.00
2. 订阅页到期日后移
3. 关闭续费后「下次付款」消失
```

# 十、工具

取证脚本已整理为独立仓库，不含账号、卡号与 Cookie：

::github{repo="Kajiekazz/google-one-trial-lab"}

```text
tools/bind_card.py          绑卡，第八节 8.1 - 8.5 均已处理
tools/cancel_renewal.py     关闭续费，幂等
tools/inspect_state.py      只读盘点，输出可直接归档
tools/capture_checkout.py   捕获 Ngbm / eacquire 结账流量
docs/findings.md            四组变体实验与订单证据
docs/false-positive.md      成功判定的代码级分析
docs/pitfalls.md            Playwright 陷阱清单
```

设计原则：只自动化非敏感环节（绑定、取消、观测），
「订阅」留给人工点击，既避开风控敏感点，也保证操作者亲眼看到 `US$0.00`。

# 十一、结论

1. **12 个月真实，24 个月不成立。**
   顺延机制本身是通的（服务端确实能把 6 个月试用排到现有订阅之后），
   但多条目订阅的原子替换与 YouTube 试用资格的一次性消耗共同构成空集。
2. **假阳性比失败更危险。**
   把错误弹窗的关闭按钮当成成功信号，会让整条流水线在无声中空转，
   并产出一份看起来完整的报告。
3. **判定要看状态，不要看文案。**
   订单记录、到期日、「下次付款」是否消失，这三条无法被伪造，也不随 UI 改版失效。

从工程角度看，第 3 点比前两点更值得带走。

:::caution[合规]
文中操作均在本人名下账号完成，仅用于订阅状态与计费行为研究。
免费试用受 Google 服务条款约束，多账号重复领取属于违规行为，请勿模仿。
:::

---

# 附录 A：实验时间线

| 时间 | 事件 | 结果 |
|---|---|---|
| 19:14 | 变体 A（原版双条目） | 提示「不符合条件」，结算失败，无订单 |
| 19:22 | 变体 B（仅 AI Pro） | 通用错误，无订单 |
| 19:27 | 变体 C（token 为空数组） | 通用错误，无订单 |
| 19:27 | 变体 D（token 为 None） | Error 500，无订单 |
| 19:30 | 变体 E（保持订阅活跃后重跑原版） | 日志报成功，状态无变化，无订单 |
| 19:40 | 订单记录核对 | 仅一笔 2026-11-06 US$0.00 |
| 20:12 | 第二个账号执行首层 | 成功，到期 2027-11-06 |
| 20:14 | 关闭自动续费 | 「下次付款」消失 |

# 附录 B：状态机

```text
无付款资料 --绑卡--> 有卡 --订阅(US$0.00)--> 试用中(自动续费开)
                                              |
                                    关闭续费   |
                                              v
                                    试用中(自动续费关) --到期--> 结束，不扣款
```

任何一步的「成功」都以状态机的节点变化为准，不以页面提示为准。

# 附录 C：常见误判

| 现象 | 常见解读 | 实际含义 |
|---|---|---|
| 「下次付款 2026-12-06」 | 只有一个月 | 那是 YouTube 条目的 `phase[1]` 开始日，AI Pro 到期日是 2027-11-06 |
| 日志「叠加完成」 | 订阅已延长 | 只是弹窗被关掉了 |
| 订阅页显示「活跃」 | 一切正常 | 仍是首层状态，未发生叠加 |
| 弹窗出现「不符合条件」 | 账号被风控 | 该条目的试用资格已被消耗 |
| 升级弹窗能打开并显示新日期 | 升级已成功 | 只说明顺延计算通过，提交仍可能被资格校验拒绝 |
