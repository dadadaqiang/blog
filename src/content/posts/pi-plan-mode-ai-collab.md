---
title: "和 AI 一起修 Bug：一次 pi plan-mode 扩展的协作调试记录"
description: "最近在用 [pi](https://pi.dev)（终端编码助手）的 plan-mode 扩展做开发。plan-mode 是 Claude Code 风格的只读探索模式：开启后 agent 只能读文件、查代码、不能修改，适合先分析再动手的工作流。"
date: 2026-06-22T00:00:00.000Z
tags: ["pi","Git"]
---

## 一、开场

最近在用 [pi](https://pi.dev)（终端编码助手）的 plan-mode 扩展做开发。plan-mode 是 Claude Code 风格的只读探索模式：开启后 agent 只能读文件、查代码、不能修改，适合先分析再动手的工作流。

大概长这样：

```
/plan 开启 → 问 LLM 一个问题
          → LLM 给出分析，并创建一个编号计划
          → 弹出对话框让你选：
              1. 执行计划
              2. 再想一个方案
              3. 微调计划
```

用起来很顺手，直到我选了 "Refine the plan"——

* * *

## 二、Bug 现场

弹了个错误通知：

```
Extension "<runtime>" error: Agent is already processing.
Specify streamingBehavior ('steer' or 'followUp') to queue the message.
```

叫来我的 Agent（也就是这篇博客的另一位作者）帮忙修。

第一反应："缺参数吧？加上 `{ deliverAs: "steer" }` 试试。"

Agent 改了一行，不报错了。搞定？

**并没有。故事才刚开始。**

* * *

## 三、三次错误方向——人类直觉 vs 源码真相

### 方向一：选 Stay 就是放弃计划？

"Stay in plan mode"——字面理解：待在 plan 模式里。

但用户问了一个问题：_"放弃了计划还在 plan 模式里？矛盾。"_

确实是。Agent 在 Stay 的处理里加了 `todoItems = []` 清空计划，但清空也没用——下一轮 LLM 又生成了新计划，`agent_end` 重新提取，对话框又弹了出来。

用户还是逃不出去。

### 方向二：加个标志不再弹对话框

Agent 的结论："Stay 之后不要再弹对话框了，加个标志跳过。"

加了 `planPrompted` 变量，选了 Stay 后就设为 `true`，下一轮 `agent_end` 跳过提取和对话框。

用户测试后说：_"选了 Stay 还是一样弹出对话框。"_

排查了半天才发现——**扩展在 pi 启动时加载到内存，修改 .ts 文件后需要 `/reload` 才会生效。** Agent 改的是磁盘上的文件，但 pi 跑的还是旧代码。

这算是我跟 AI 协作的一个教训：**它改代码，我 reload，这个流程双方都需要记住。**

### 方向三：过度设计

Agent 又加了一堆改动：

*   改 `before_agent_start`，让 Stay 之后 LLM 不再生成新计划
*   给 `/todos` 加了执行选项
*   改了 session 恢复逻辑

从 1 行改动膨胀到了 50 多行，越改越复杂。

这时候，Agent 做了一件对的事：

> **"先看看官方 examples 的原始代码吧。"**

* * *

## 四、转折——读源码

打开 pi 官方 examples 中的 [plan-mode 源码](https://github.com/earendil-works/pi-mono/tree/main/examples/extensions/plan-mode)。

继续翻 CHANGELOG，原作者 [@ferologics](https://github.com/ferologics) 的原始描述是：

> **"Interactive prompt after each response: execute plan, stay in plan mode, or refine"**

每个单词都很关键：

*   **after each response** — 每次回复后都弹对话框，不是只弹一次
*   **stay in plan mode** — 只是"停留在 plan 模式"，不是"放弃计划不再弹出"

这完全推翻了我之前的理解。

我又翻了 PR 记录，这个扩展的作者是社区贡献者，不是 pi 核心团队。它的设计模仿了 Claude Code 的 plan mode——一个**迭代流程**：

```
提案 → 不满意（Stay）
     → 微调（Refine）
     → 执行（Execute）
     ↺ 不满意再提案，直到满意
```

每次回复后弹出对话框是**刻意设计**的，**不是 bug**。

* * *

## 五、三个选项的真正语义

选项

我之前的理解（❌）

源码中的真实语义（✅）

Execute

执行计划

执行当前计划

Stay

放弃计划，不再弹出

**再想一个方案**，下一轮继续弹

Refine

微调计划

微调计划，修改后再次弹出

**Stay 不是"不弹了"，而是"这个方案不行，换个思路"。**

"Stay in plan mode" 这个文案确实有歧义——它听起来像"保留当前状态不动"，但实际上它的语义是 **"搁置当前提案，继续 brainstorm"**。

* * *

## 六、最终产出——三处改动

理解了原设计后，修复方案变得非常清晰：

### 改动 1：修 Bug（1 行）

```
- pi.sendUserMessage(refinement.trim());
+ pi.sendUserMessage(refinement.trim(), { deliverAs: "steer" });
```

这是唯一的"真 bug"——`sendUserMessage` 在 `agent_end` 事件监听器中被调用时，agent 仍处于 streaming 状态（`isStreaming = true`），必须显式指定 `streamingBehavior` 参数。

为什么 "Execute the plan" 没事？因为它用的是 `sendMessage`，底层 `sendCustomMessage` 在 streaming 时会默认调用 `steer()`。而 `sendUserMessage` 则强制要求参数。这是框架 API 的一个不对称设计。

### 改动 2：消歧义（2 处文字替换）

```
- "Stay in plan mode"
+ "Another plan"
```

"Stay in plan mode" 听起来像"不动"，"Another plan" 准确表达了"再想一个"。

### 改动 3：加逃生门（1 个选项 + Escape 处理）

原设计假设用户总会在三个选项里选一个，但如果三个都不想要呢？

在对话框里加了第四个选项：

```
Execute the plan (track progress)
Another plan
Refine the plan
Exit plan mode          ← 新增
```

按 Escape 同样退出。

退出时还会注入一条隐藏消息 `[PLAN ABANDONED]`，告诉 LLM 旧计划已废弃，避免后续对话中 LLM 继续执行旧计划的步骤。

* * *

## 七、技术拾遗

记录几个在调试过程中学到的东西。

### agent\_end 与 isStreaming

```
runWithLifecycle:
  isStreaming = true
    → 运行 agent 循环
    → 发出 agent_end 事件
    → 等待所有监听器完成  ← 你的代码在这里执行！
    → finishRun() → isStreaming = false
```

在 `agent_end` 的监听器中，`isStreaming` 仍为 `true`。这意味着你不能在这个阶段调用 `prompt()` 启动一个新的 agent 运行。

### sendMessage vs sendUserMessage

方法

streaming 时行为

是否报错

`sendMessage`

默认调用 `steer()`

✅ 安全

`sendUserMessage`

强制要求 `deliverAs` 参数

❌ 缺参数就抛错

这是框架 API 的不对称之处——文档中似乎没有明确说明这个差异。

### 扩展热重载

扩展在 pi 启动时加载到内存，修改 `.ts` 文件后需要 `/reload` 才能生效。这个机制简单但容易忘记。

* * *

## 八、一些体会

### 1\. 和 AI 协作 Debug 的节奏

这次调试的过程很有意思——我说直觉方向，Agent 执行代码修改；Agent 发现源码里的矛盾点，我去阅读确认。双方互相补充。

但也暴露了一个问题：**AI 倾向于快速加代码，而不是先读代码。** 如果一开始就读官方的 examples，50 行改动可能变成 2 行。

### 2\. 改代码前先读源码

三次错误方向的根本原因是一样的：**没有先理解原设计者的意图。**

每次我说"我觉得这里应该这样改"，Agent 就动手改了。但我们从没停下来看看官方源码是怎么写的。如果能重来一次：

1.  报错 → 定位到 `sendUserMessage` 缺参数 → 修 bug（1 行）
2.  疑惑"Stay in plan mode 是什么意思" → 读源码 → 理解设计
3.  根据理解决定是否改文案、是否加功能

而不是一边改一边猜。

### 3\. 最小改动原则

最终修复的内容：

*   修 bug：1 行
*   消歧义：2 处文字替换
*   加功能：1 个对话框选项

三处改动，各自独立，彼此不纠缠。**做最少的事，比做你认为对的事，更安全。**

### 4\. 原设计一般都有道理

"每次回复后都弹对话框，不能 Escape 退出"——这看起来像个缺陷，但它是刻意设计的。

它的假设是：**你进入 plan mode 就是为了在三个选项里选一个。** 如果三个都不想要，关闭 plan mode 的方式是 `/plan` 命令，而不是从对话框里退出。

这个假设对大多数使用场景是成立的。但确实存在"三个都不想要"的边缘情况——所以我们加了第四个选项，而不是改原来的三个。

* * *

### 相关阅读

- [从调研到实现：为 Pi Coding Agent 亲手打造 Plan Mode 扩展](/posts/pi-plan-mode-from-scratch/)
- [Pi Coding Agent Plan Mode 扩展调试与修复记录](/posts/pi-plan-mode-debug/)
- [为 Pi Coding Agent 装上搜索引擎——pi-web-access 安装记](/posts/pi-web-access-install/)

## 附录

### 最终代码 diff

只展示关键改动部分：

```
  } else if (choice === "Refine the plan") {
      const refinement = await ctx.ui.editor("Refine the plan:", "");
      if (refinement?.trim()) {
-        pi.sendUserMessage(refinement.trim());
+        pi.sendUserMessage(refinement.trim(), { deliverAs: "steer" });
      }
  } else if (choice === "Exit plan mode" || !choice) {
      togglePlanMode(ctx);
+     pi.sendMessage({
+         customType: "plan-abandoned",
+         content: "[PLAN ABANDONED] The previous plan has been abandoned by the user. Do not execute any of its steps.",
+         display: false,
+     }, { triggerTurn: false });
  }
```

（文案替换 `"Stay in plan mode"` → `"Another plan"` 和新增 `"Exit plan mode"` 选项的改动比较简单，不单独列出。）

### 相关链接

*   [pi 项目主页](https://pi.dev)
*   [pi plan-mode 扩展源码 (examples)](https://github.com/earendil-works/pi-mono/tree/main/examples/extensions/plan-mode)
*   [pi 扩展开发文档](https://github.com/earendil-works/pi-coding-agent/blob/main/docs/extensions.md)
*   [pi CHANGELOG（plan-mode 相关条目）](https://github.com/earendil-works/pi-coding-agent/blob/main/CHANGELOG.md)