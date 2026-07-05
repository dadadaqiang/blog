---
title: "浏览器自动化工具大横评：哪些能复用你的登录态？"
description: "深入调研 GitHub 上所有能让 AI 控制你已登录浏览器的开源工具，从 agent-browser 到 WebBridge，一篇看完选型全貌。"
date: 2026-07-05
tags: ["浏览器自动化", "AI Agent", "CDP", "开源工具", "选型对比"]
---

## 一、为什么这个问题很重要

当 AI Coding Agent 要帮你操作浏览器时，第一个遇到的障碍就是**登录态**。

你想让它去 GitHub 提 Issue、去飞书查消息、去知乎看私信——结果它打开的是一个干净的、没有任何登录信息的浏览器实例。要么让你手动登录，要么就得想办法传递 Cookie。

市面上大多数浏览器自动化工具（Playwright、Puppeteer、Selenium）**默认启动一个全新的浏览器实例**，和你的日常浏览完全隔离。这对于自动化测试是好事，但对于 AI Agent 要替你办事来说，**这就是最大的绊脚石**。

所以在选型时，一个关键问题就是：**这个工具能不能复用我当前 Chrome 的登录态？**

本文将调研结果整理分享，覆盖 GitHub 上所有主流方案。

## 二、前提知识：CDP 是什么

所有浏览器自动化工具底层都离不开 **Chrome DevTools Protocol（CDP）**——这是 Google 为 Chrome/Chromium 设计的一套调试协议，通过 WebSocket 通信，可以控制浏览器的几乎所有行为：导航、点击、截图、执行 JS、读取 DOM……

```
Playwright / Puppeteer  ── 高层 API（方便，但开销大）
       ↓
CDP (WebSocket JSON)    ── 底层协议（最灵活，理解它才能选对工具）
       ↓
Chrome / Chromium       ── 真实浏览器
```

复用登录态的本质，就是**让工具连接到你已经登录的那个 Chrome 实例**，而不是自己启动一个新的。

## 三、技术路线分类

GitHub 上现有的方案按复用登录态的方式可以分为三大类：

### 路线 A：连你正在跑的 Chrome（推荐）

通过 `chrome://inspect/#remote-debugging` 开启调试端口，工具直接连接到你已经在使用的 Chrome。**你的所有登录态、Cookie、插件天然可用。**

```
已登录的 Chrome  ←── CDP WebSocket ──→ 自动化工具
                                              ↓
                                        AI Agent (pi / Claude Code / Cursor 等)
```

**优点**：零额外配置，登录态完整，还可以看到你当前的 tab
**缺点**：需要一个"桥接"步骤（开启调试端口）

### 路线 B：拷贝 Chrome Profile

启动独立的 Chrome 实例，但把你的 Chrome profile（含 Cookie、LocalStorage）复制过来用。

```
你的 Chrome Profile (Default)  ──拷贝──→  临时目录  ──→  新 Chrome 实例
```

**优点**：隔离性好，不会干扰你正在用的浏览器
**缺点**：拷贝可能不完整（有些 session 态在内存中），需要等 Chrome 启动

### 路线 C：Chrome 扩展注入

通过 Chrome 扩展在浏览器内部注入 CDP 桥接能力，不走调试端口。

```
Chrome  ←── chrome.debugger API ──→  Chrome 扩展  ←── WebSocket ──→ Daemon  ──→ AI Agent
```

**优点**：不弹权限对话框，不需要额外开关，体验最丝滑
**缺点**：需要安装扩展，架构更复杂

## 四、全网工具大横评

以下按路线分类，列出我在 GitHub 上找到的所有相关开源项目：

### 路线 A：连你正在跑的 Chrome

| 项目 | Stars | 语言 | 一句话总结 |
|------|-------|------|-----------|
| **bb-browser** | — | Node.js | 你当前正在用的方案，36+ site adapter，103+ 命令 |
| **agent-chrome-cli** | ⭐ 新 | Node.js | 极轻量 CLI，`npm link` 即用，无 daemon |
| **jabbarium** | ⭐ 新 | Node.js | "一个可复用的 tab"，自带 AI skill 文件 |
| **chrome-cdp-skill** | ⭐ 新 | Node.js | 已支持 `pi install`，纯 CDP 直连，无依赖 |
| **browser-cdp** | ⭐ 经典 | Node.js | 老牌工具，支持 cookies/storage 导入导出 |
| **dev-browser** | ⭐ | Rust + TS | 沙箱执行 JS + Playwright 完整 API |
| **browser-harness** | ⭐15k | Python | browser-use 的底层引擎，专为 coding agent 设计 |

**代表工具详解：**

#### agent-chrome-cli

`npm link` 即可安装，连接你正在跑的 Chrome，读取无障碍树（accessibility tree）并生成 `@ref` 定位元素。

```bash
# 列出你浏览器的所有 tab
agent-chrome tabs
# 输出: t1  https://github.com   GitHub
#       t2  https://gmail.com    Gmail

# 对特定 tab 拍照
agent-chrome --tab t2 snapshot -c

# 点击
agent-chrome --tab t2 click @e5

# 截图
agent-chrome --tab t2 screenshot
```

#### chrome-cdp-skill

设计理念最简洁——一个 `.mjs` 脚本 + 一个 SKILL.md，不需要任何 npm install。已经支持直接通过 `pi install` 安装。100+ tab 也能稳定工作。

```bash
# 直接在脚本里驱动
scripts/cdp.mjs list                              # 列出 tab
scripts/cdp.mjs snap   t1                         # 无障碍树快照
scripts/cdp.mjs click  t1 "#submit"               # CSS 选择器点击
scripts/cdp.mjs clickxy t1 800 500                # 坐标点击
scripts/cdp.mjs eval   t1 "document.title"        # 执行 JS
```

#### browser-harness（⭐15k）

browser-use 团队的"薄 CDP harness"方案。核心哲学是**不给 Agent 抽象，给你自由**——直接在浏览器上写 Python DSL。

```bash
browser-harness <<'PY'
new_tab("https://github.com")
print(page_info())
capture_screenshot()
click_at_xy(400, 300)
PY
```

支持本地 Chrome 和云浏览器两种模式。local 模式直接连你正在跑的 Chrome，全部登录态可用。

### 路线 B：拷贝 Chrome Profile

| 项目 | Stars | 描述 |
|------|-------|------|
| **agent-browser**（Vercel） | ⭐36k | Rust 写的超高性能 CLI，`--profile "Default"` 拷贝 profile |
| **browser-use**（Python） | ⭐40k+ | 最流行的 AI 浏览器框架，通过 BrowserProfile 复用 |
| **AI-Browser** | ⭐ | Lightpanda + Chromium 双引擎，支持 cookies export/import |

**代表工具详解：**

#### agent-browser（Vercel，⭐36k）

Vercel 出品，Rust 写的高性能浏览器自动化 CLI。通过无障碍树读页面，比截图方式省 17 倍 token。

```bash
# 连接已有 Chrome（路线 A 也可以）
agent-browser connect --port 9222

# 或者拷贝 profile 启动新实例（路线 B）
agent-browser open https://github.com --profile "Default"

# 核心操作
agent-browser snapshot              # 无障碍树 + refs
agent-browser click @e2             # 点击
agent-browser fill @e3 "text"       # 填写
agent-browser eval "document.title" # 执行 JS
```

内置 MCP Server，可作为 MCP tool 接入任何 AI Agent。

#### browser-use（⭐40k+）

目前最流行的 AI 浏览器自动化框架。默认启动独立 Chrome，但可以配置连接已有实例或使用 profile。

```python
from browser_use import Agent, BrowserProfile

# 方式1：用已有 Chrome profile
agent = Agent(
    task="帮我查一下 GitHub 通知",
    browser_profile=BrowserProfile(
        user_data_dir="/path/to/Chrome/Default",
        headless=False,
    ),
)

# 方式2：连已有 Chrome
agent = Agent(
    task="...",
    browser_profile=BrowserProfile(
        cdp_url="http://localhost:9222",
    ),
)
```

也提供了 MCP Server：`browser-use --mcp`，暴露 15 个工具包括 `retry_with_browser_use_agent`（自主 Agent）。

### 路线 C：Chrome 扩展注入

| 项目 | 描述 |
|------|------|
| **WebBridge** | Chrome 扩展 + daemon + 34 tools，支持 4 种 AI 工具的 skill |
| **unibrowse** | 72 个 tool，支持多 tab 标签订位，MCP Server |

**代表工具详解：**

#### WebBridge ⭐（推荐）

目前架构最优雅的方案。通过 Chrome 扩展的 `chrome.debugger` API 获取 CDP 控制权，不走调试端口。Daemon 提供 HTTP API。

```
AI Agent → HTTP POST /api/tool → Daemon (localhost:10087)
    → Chrome 扩展 → chrome.debugger → 你的浏览器
```

34 个内置 tool：

- **导航**：navigate, back, forward, reload
- **截图**：screenshot, snapshot, save_as_pdf
- **坐标 CUA**：move, click, double_click, hover, scroll, drag
- **DOM CUA**：get_visible_dom, click_element, type_element, element_info
- **表单**：fill, send_keys, upload, clipboard
- **Tab 管理**：list_tabs, new_tab, switch_tab, close_tab
- **脚本**：evaluate

用法极简：

```bash
# 检查状态
curl http://127.0.0.1:10087/api/status

# 导航到页面
curl -X POST http://127.0.0.1:10087/api/tool \
  -H "Content-Type: application/json" \
  -d '{"name":"navigate","args":{"url":"https://github.com"}}'

# 截图
curl -X POST http://127.0.0.1:10087/api/tool \
  -H "Content-Type: application/json" \
  -d '{"name":"screenshot","args":{}}'
```

并且提供了 Cursor / Claude Code / Codex / OpenClaw 四种 AI 工具的 Skill 文件，复制即用。

#### unibrowse

72 个 tool，覆盖导航、DOM 交互、表单、Cookie、下载、历史、书签、扩展管理。支持多 tab 标签订位（自动生成 `github.com`、`github.com-2` 这类标签）。

```javascript
// 列出所有已附加的 tab
browser_list_attached_tabs()
// 输出：[{ tabId: 123, label: "github.com", ... }, { tabId: 456, label: "gmail.com", ... }]

// 对特定标签操作
browser_screenshot({ tabTarget: "github.com" })
browser_navigate({ url: "https://example.com", tabTarget: 456 })
```

### ⚠️ 特殊补充：SeeClick

SeeClick 不算严格复用你**正在运行**的 Chrome，但它读取你的 Chrome profile 路径来启动一个附加了登录态的新实例。

```python
from seeclick import Agent

# 安装后自动检测 Chrome profile
agent = Agent()
agent.run("打开 LinkedIn，找 Berlin 的 AI 初创公司")
```

独特之处在于它使用 **有限状态机** + **GPT-4o Vision** 双引擎——普通操作用 FSM 确定性执行，选择器失败时回退到视觉定位。

## 五、核心参数对比

| 对比维度 | bb-browser ✅ | WebBridge | agent-chrome-cli | chrome-cdp-skill | SeeClick | browser-harness | agent-browser |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **路径** | A | C（扩展） | A | A | B（拷贝） | A | A+B |
| **连你当前 Chrome** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅(A模式) |
| **安装复杂度** | ⭐ 无 | ⭐⭐⭐ build | ⭐ npm link | ⭐ 无依赖 | ⭐⭐ pip | ⭐⭐ uv tool | ⭐⭐ npm i |
| **Site Adapter** | ✅ 36+平台 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **自主 Agent** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **MCP 支持** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Pi 集成** | ✅ 内置 | ⚠️ HTTP | ⚠️ CLI | ✅ pi install | ⚠️ Python | ⚠️ Python | ⚠️ CLI |
| **核心语言** | CLI | Node.js + 扩展 | Node.js | Node.js | Python | Python | Rust |
| **工具数量** | 103+ 命令 | 34 tools | 20+ 命令 | 13 命令 | 3 agents | Python DSL | 30+ 命令 |
| **Token 效率** | 高(无障碍树) | DOM 两者 | 无障碍树 | 无障碍树 | 截图+DOM | Python | 无障碍树 |

## 六、选型建议

### 如果你已经在用 pi

你已经有了 **[bb-browser](https://github.com/epiral/bb-browser)**，它在这方面有一个很大的优势——**36+ 平台、103+ site adapter**。登录态的复用能力也是第一梯队（连你 Windows Chrome）。

如果你想补充**自主 Agent**的能力，最佳搭配是：

1. **agent-browser 的 MCP Server**（`mcp_connect_stdio` 即可接入，21 个 tool）
2. 或者 **WebBridge**（Chrome 扩展 + HTTP API，34 tools，体验最丝滑）
3. 或者 **browser-harness**（Python DSL，可编程性最强）

### 各场景最佳工具

| 使用场景 | 推荐工具 | 理由 |
|----------|----------|------|
| 快速信息获取 | **bb-browser** | site adapter 一键搞定 |
| 简单页面交互 | **agent-chrome-cli** | npm link 即用，无 daemon |
| 复杂多步操作 | **browser-harness** 或 **browser-use MCP** | 自主 Agent 决策执行 |
| 无缝集成到已有 AI 工具 | **WebBridge** | Chrome 扩展 + HTTP API + Skill 文件 |
| 极致性能 | **agent-browser** | Rust 实现，token 省 17 倍 |
| 视觉理解 | **SeeClick** | GPT-4o Vision 兜底 |
| 超多 tab | **chrome-cdp-skill** | 100+ tab 稳定，`pi install` 即用 |

### 一句话总结

> **没有完美的工具，但一定有适合你场景的。**

- 要**登录态复用 + 信息获取** → bb-browser ✅
- 要**自主 Agent + 登录态** → browser-harness / SeeClick
- 要**轻量无依赖** → agent-chrome-cli / chrome-cdp-skill
- 要**最全工具集** → unibrowse（72 tools）
- 要**最丝滑体验** → WebBridge（Chrome 扩展注入）
- 要**生态最全** → agent-browser（Vercel 出品，MCP 支持）

## 七、写在最后

这轮调研让我感受最深的一点是：**开源社区对"AI Agent 控制浏览器"这件事的探索正在飞速进行**。从去年底只有 Playwright/Puppeteer 两个选择，到现在十几款工具各具特色，这个领域的变化实在太快了。

如果你也在捣鼓 pi 或其他 AI Agent 的浏览器自动化，欢迎留言交流！
