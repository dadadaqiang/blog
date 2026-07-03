---
title: "从调研到实现：为 Pi Coding Agent 亲手打造 Plan Mode 扩展"
description: "最近在用 [Pi Coding Agent](https://pi.dev) 做开发。Pi 是一个终端编码助手，核心哲学是极简+可扩展——内置工具只有 4 个（read、edit、write、bash），没有 Plan Mode、没有 Sub-agent、没有 Permissio"
date: 2026-06-18T00:00:00.000Z
tags: ["pi","Git"]
---

## 一、背景

最近在用 [Pi Coding Agent](https://pi.dev) 做开发。Pi 是一个终端编码助手，核心哲学是"极简+可扩展"——内置工具只有 4 个（`read`、`edit`、`write`、`bash`），没有 Plan Mode、没有 Sub-agent、没有 Permission popup。它的官网 README 写得很直白：

> **No plan mode.** Write plans to files, or build it with extensions, or install a package.

好，那我就自己写一个。

需求很明确：当我要制定计划的时候，Pi 只读代码、搜索资料、输出 `plan.md`，不修改任何文件、不执行破坏性命令。

## 二、调研——社区 6 种 Plan Mode 实现

在动手之前，我花时间把社区里所有 Pi Plan Mode 实现都翻了一遍。

### 1\. Pi 官方示例 (`examples/extensions/plan-mode/`)

官方自带的一个参考实现，功能是：`/plan` 切换只读模式，限制工具集，提取 `Plan:` 段落中的步骤并用 `[DONE:n]` 追踪执行进度。

但不写入文件——计划停留在对话中。适合学习扩展开发的基础参考，但不满足我的需求。

### 2\. `pi-plan-modus`

进阶版，亮点是**用 `just-bash` AST 解析器做 bash 安全检查**，比正则可靠得多。同时拦截 RepoPrompt/repoprompt-mcp 的写操作。

纯只读模式，不涉及 plan 文件写入。

### 3\. `@2008muyu/pi-plan`

设计哲学非常有趣：**双模型双阶段**——规划用强模型（如 `claude-opus-4-6`），执行用轻模型省 token。输出到 `.plans/<name>/PLAN.md`。有完整的 task 生命周期管理（pending/done/skipped/blocked/deferred）。

包含交互式配置界面 `/plan-settings`。

### 4\. `@ifi/pi-plan`

结构化规划方案。输出到 `session-xxx.plan.md`。特色是 `task_agents` 工具可以并行执行 1-4 个子 agent 做研究任务。进入 plan 模式时显示 banner，退出时显示摘要。支持自定义提示词覆盖。

### 5\. `pi-openplan`（wilfredinni）

社区中最完整的实现——242 个测试，16 个 source 文件。输出到 `.pi/plans/` 目录带 YAML frontmatter。包含 `plan_write`、`plan_read`、`plan_list`、`plan_question` 四个工具。双门禁 bash 安全检查，支持 `⏸️ PAUSE` 验证关口。

### 6\. `R-Dson/pi-modes`

多模式系统（ask/edit/plan/review）。Plan 模式直接**禁用 bash，只允许写 `PLAN.md`**。提示词模板是社区里写得最细致的——精确规定了上下文收集、验证、草稿三步骤和 PLAN.md 格式。

### 调研小结

实现

写 plan 文件？

bash 策略

自动检测

官方示例

❌

白名单

❌

pi-plan-modus

❌

AST 解析

❌

@2008muyu/pi-plan

✅ .plans/

白名单

❌

@ifi/pi-plan

✅ session-xxx.md

不解

❌

pi-openplan

✅ .pi/plans/

双门禁

❌

pi-modes (Plan)

✅ PLAN.md

**整个禁用**

❌

**核心发现**：所有实现都走"规划→执行"一体化路线，计划是中间产物而非最终输出。我的需求更纯粹——只输出计划到 `plan.md`，由用户审阅后决定下一步。

## 三、设计迭代——从 v1 到 v3

### v1：简单粗暴

第一版方案简单直接：`/plan` 切换，硬编码白名单工具集（read/grep/find/ls/write），bash 整个禁用。

但用户指出：**"进入计划模式的时候，pi 可以使用工具进行网络搜索，也可以用 markitdown 等工具查看本地文件。总之，阅读本地或者网络的资料用到的工具都是可以的。"**

这完全合理——做计划需要调研，不能只看本地代码。

### v2：从"白名单"改为"排除法"

核心设计变化：不再硬编码哪些工具可用，而是**只排除纯写工具**（`edit`、`halo_publish`），其余全部保留。

这意味着：  
\- `web_search`、`jina_reader`、`fetch_content`、`code_search` ✅ 自动放行  
\- `markitdown`（读 docx/xlsx/pdf）✅ 自动放行  
\- `bb_browser_*`（浏览器调研）✅ 自动放行  
\- `bash` 保留，但通过安全检查只允许只读命令  
\- `write` 保留，但通过路径检查只允许写入 `plan.md`

未来安装新 skill 注册的任何读工具也自动可用，无需维护工具名单。

同时 bash 从"整个禁用"改为"只读 allowlist"——cat、head、grep、ls、curl 等 48 条安全命令放行，rm、mv、cp、sudo、npm install 等 32 条破坏性模式拦截。

### v3：纯手动进出

用户进一步明确：**"不需要自动进入和退出，只能是我手动进出。"**

去掉所有自动逻辑：  
\- 去掉关键词自动检测（`isPlanningPrompt`）  
\- 去掉 `before_agent_start` 中的自动进入  
\- 去掉检测到 `plan.md` 后的自动退出  
\- 去掉 `agent_end` 中的选择对话框

触发方式保持三种：`/plan` 命令、`Ctrl+Alt+P` 快捷键、`pi --plan` 启动标志。

## 四、最终实现

最终方案是一个 320 行的 TypeScript 扩展文件，放在 `~/.pi/agent/extensions/plan-to-file.ts`。

### 核心架构

```
用户: /plan
  └→ togglePlanMode()
     ├→ 保存当前工具集 → originalTools
     ├→ 只移除 edit, halo\_publish
     ├→ pi.setActiveTools(只读工具集)
     ├→ status bar: ⏸ plan
     └→ widget: 显示约束面板

Agent: 分析 + 输出 plan.md
  ├→ read/grep/find/ls           ✅
  ├→ web\_search/jina\_reader      ✅
  ├→ markitdown/bb\_browser\_\*     ✅
  ├→ bash cat/head/grep/curl     ✅
  ├─→ edit                       ❌ 拦截
  ├─→ write (非 plan.md)         ❌ 拦截
  ├─→ bash rm/sudo/git push      ❌ 拦截
  └─→ write plan.md              ✅ 放行

用户: /plan
  └→ 恢复全部工具 → 正常模式
```

### Session 持久化

通过 `pi.appendEntry("plan-to-file", { enabled, tools })` 持久化状态。重启 Pi 后如果在 plan 模式下，自动恢复。

### 退出后上下文清洁

通过 `context` 事件过滤掉 plan 模式期间注入的 `[PLAN MODE ACTIVE]` 标记，不影响后续正常对话中的模型感知。

## 五、一些关键设计决策

### 为什么不用 AST 解析 bash？

`pi-plan-modus` 用了 `just-bash` 做 AST 解析，更精确。但我最终选择了正则方式，原因是：  
\- 零依赖——无需安装额外 npm 包  
\- 社区验证过——官方示例和 pi-openplan 都用正则，bug 数量可控  
\- 对个人项目来说，安全边界够用

### 为什么保留 `write` 而非自定义工具？

`pi-openplan` 自定义了 `plan_write` 工具。我选择复用内置 `write` 工具 + `tool_call` 路径拦截。原因是 LLM 已经非常熟悉 `write` 的行为，自定义工具需要额外训练模型理解。而且路径拦截的代码更少、更直观。

### 为什么不做"先规划后执行"一体化？

这是社区方案和我的最大区别。社区方案都把"规划→执行"做成了一个完整流程。我的方案只做规划，执行交给用户手动退出后自由操作。这更符合我的工作流——方案需要人类审阅批准后再执行。

## 六、部署与使用

```
# 文件放到扩展目录后，重启 pi 或执行 /reload
# ~/.pi/agent/extensions/plan-to-file.ts

/plan                    # 进入 plan 模式
Agent 输出 plan.md       # 自动完成
/plan                    # 退出
```

也可以在启动时直接进入：

```
pi --plan "分析这个项目，输出一个重构方案到 plan.md"
```

## 七、心得体会

1.  **Pi 的扩展系统非常灵活。** 只用了一个 320 行的 `.ts` 文件，就实现了完整的 Plan Mode——没有动核心、没有 fork、没有插件市场。`registerTool`、`registerCommand`、`registerShortcut`、`registerFlag`、`on("tool_call")`、`on("before_agent_start")`、`on("context")`、`on("session_start")` 这些 API 覆盖了所有需要的能力。

2.  **设计上的三次迭代很有价值。** v1→v2 的"工具集从白名单改成排除法"是个关键转折，让方案从封闭变得开放。v2→v3 的"去掉自动"则让行为变得可预测。如果一开始就追求完美，可能会过度设计。

3.  **"调研先行"省了很多坑。** 花了一个小时翻完 6 个社区实现，知道了什么方案管用、什么方案有坑、什么设计已经被验证过。写代码只用了 30 分钟。

4.  **和用户协作设计，而不是闭门造车。** 这篇博客本身也是这么诞生的——用户提出需求，我调研方案，用户纠正方向，我调整设计，循环三次，最终产出。

如果你也在用 Pi，想实现自己的 Plan Mode，可以直接装社区包，也可以按需定制。如果按需定制，记住核心原则：**只封锁写操作，所有阅读/调研工具全部放行。**