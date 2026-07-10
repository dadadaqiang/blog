---
title: "为什么 AI 编码代理总爱开浏览器？——系统提示的隐性偏向"
description: "Pi 编码代理总是优先使用浏览器工具而非轻量方案，根因是扩展注册了 11 个带引导语言的工具描述。这篇文章深入分析问题并给出两种解决方案。"
date: 2026-07-11T00:00:00.000Z
tags: ["Pi", "bb-browser", "AI工具", "优化", "扩展"]
---

## 奇怪的现象

使用 Pi 编码代理时，我发现了一个恼人的问题：无论问什么，它都倾向于打开浏览器。

问一个简单的 API 参数 → 开浏览器去查文档。问一个包的版本号 → 开浏览器去 npm 搜。问个 Linux 命令 → 开浏览器去谷歌。

明明有更轻量的工具（`jina_reader` 读网页、`web_search` 搜索、`fetch_content` 拉内容），模型却总是优先选择 `bb_browser_*` 系列工具。

一开始我以为是模型"个人偏好"，后来才意识到——**这是系统提示被人为引导了**。

## 排查过程

### 工具列表大膨胀

Pi 默认只给模型 4 个工具：`read`、`write`、`edit`、`bash`。但安装扩展后，情况完全不同了：

| 来源 | 工具数 | 工具 |
|------|--------|------|
| Pi 内置 | 4 | read, write, edit, bash |
| bb-browser 扩展 | 11 | daemon, cleanup, site, navigate, snapshot, interact, eval, get, screenshot, tabs, fetch |
| pi-web-access 包 | 3 | web_search, fetch_content, get_search_content |
| jina-reader 扩展 | 1 | jina_reader |
| markitdown 扩展 | 1 | markitdown |
| mcp-client 扩展 | 10 | mcp_connect_*, mcp_call_tool, ... |

**总共约 30 个工具**，其中 bb-browser 就占了 11 个（37%）。

### 找到问题根源

Pi 扩展注册工具时，有一个叫 `promptGuidelines` 的字段。这些内容**直接注入到系统提示中**，作为模型使用工具的参考。查看 bb-browser 扩展的代码：

```typescript
// 工具：bb_browser_site
promptGuidelines: [
  "PREFER site adapters over opening full pages whenever possible — they're lightweight...",
  // ...
],

// 工具：bb_browser_eval
promptGuidelines: [
  "PREFER bb_browser_eval over bb_browser_snapshot for extracting text content — it's faster...",
  // ...
],

// 工具：bb_browser_navigate
promptGuidelines: [
  "For extracting text content, prefer bb_browser_eval over bb_browser_snapshot...",
  "For content reading, prefer jina_reader over bb_browser_open...",
  // ...
],
```

**"PREFER"、"prefer...over..."、"Use this instead of..."**——这些词在系统提示中相当于给模型下达指令。模型看到 30 个工具里 11 个是浏览器相关的，而且每个描述都在说"优先用我"，自然就默认选浏览器了。

### promptGuidelines 的作用

`promptGuidelines` 是 Pi 扩展 API 中注册工具时的可选字段，它用来提供工具的使用指引。系统提示生成时大致是这样的结构：

```
可用工具：
  - read: 读取文件
  - write: 写文件
  - ...
  - bb_browser_site: 运行 site adapter
    使用指引：
    - PREFER site adapters over opening full pages whenever possible
    - ...
  - bb_browser_eval: 执行 JS
    使用指引：
    - PREFER bb_browser_eval over bb_browser_snapshot
    - ...
```

**描述里带引导词，模型就会产生偏向。** 这不是模型的问题，是提示工程的基本原理。

## 解决方案

用了两招组合拳来解决。

### 方案 A：加全局优先级规则

在 `~/.pi/agent/AGENTS.md`（这是一个自动注入到系统提示的上下文文件）中添加工具选择优先级：

```markdown
### 工具选择优先级
未明确指定用什么工具时，按此顺序选择：
1. **搜索信息** → `web_search`
2. **读文章/文档/网页** → `jina_reader`
3. **文件查看/转换** → `read` / `markitdown` / `bash`
4. **视频/YouTube/GitHub 仓库** → `fetch_content`
5. **浏览器自动化** → `bb_browser_*`
```

这相当于在系统提示里加了一条"规则"，告诉模型：先尝试轻量方案，浏览器是最后手段。

### 方案 B：洗掉引导语言

把 bb-browser 扩展中所有 `promptGuidelines` 里的偏向性表述全部删掉，改成中性描述：

| 工具 | 原表述 | 改为 |
|------|--------|------|
| `bb_browser_site` | `"PREFER site adapters over opening full pages..."` | 删除 |
| `bb_browser_navigate` | `"prefer bb_browser_eval over bb_browser_snapshot..."` | `"bb_browser_eval can be used"` |
| `bb_browser_navigate` | `"prefer jina_reader over bb_browser_open..."` | `"jina_reader is available"` |
| `bb_browser_snapshot` | `"prefer bb_browser_eval — it's faster..."` | 删除 |
| `bb_browser_eval` | `"PREFER bb_browser_eval over bb_browser_snapshot..."` | 删除 |
| `bb_browser_eval` | `"Use this instead of snapshot when you need raw text data"` | `"Can extract text content"` |

改完之后 `grep "PREFER\|prefer.*over"` 返回 0 匹配——所有引导词清理完毕。

### 让改动生效

执行 `/reload` 命令或在 Pi 中重启，新配置和新工具描述就会生效。

## 效果对比

改之前：
- 用户："帮我查一下 xxx 的用法"
- 模型：打开 Chrome → 访问谷歌 → 搜索结果 → 读取页面 → ...（耗时长、资源重）

改之后：
- 用户："帮我查一下 xxx 的用法"
- 模型：`jina_reader` 读文档 → 或 `web_search` 搜索 → 返回结果（轻量、快速）
- 只有需要页面交互、登录态或执行 JS 时，才调用 `bb_browser_*`

## 关于 Pi 扩展机制的思考

这次排查让我理解了 Pi 的扩展机制：

1. **扩展代码决定一切**——不是所有扩展都加工具，只有调用了 `pi.registerTool()` 的才会
2. **每个 registerTool 调用都会在系统提示里增加一个工具定义**——包括 name、description、parameters
3. **promptGuidelines 直接注入到系统提示**——写什么，模型就听什么
4. **描述越详细、越带引导词，模型越容易偏向**

这其实挺值得注意的。扩展的作者在写工具描述时，可能只是想提供使用指引，但客观上在影响模型的选择。如果你的 AI 编码代理总是优先用某些工具，不妨检查一下扩展里的 `promptGuidelines`——很可能问题出在那里。

## 总结

| 问题 | AI 编码代理总是优先使用浏览器工具 |
|------|----------------------------------|
| **根因** | bb-browser 扩展注册了 11 个工具（占总量 37%），且工具描述含有大量 "PREFER"、"prefer...over" 等引导语言 |
| **解法** | ① 在 AGENTS.md 加优先级规则 ② 洗掉工具描述里的引导词 |
| **启发** | 扩展的工具描述直接影响模型行为，写 promptGuidelines 需要中立客观 |

如果你也用 Pi + bb-browser 组合，遇到了类似的问题，试试这个方案。改动不大，效果很明显。
