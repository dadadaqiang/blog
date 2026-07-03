---
title: "Halo Publish 工具优化：一次发布踩坑与修复实录"
description: "前几天我开发了 DownloadXBookmarks 扩展后用博客记录了整个过程，但在发布到 Halo 博客这一步卡了很久——文章内容太大，bb_browser_eval 的参数被截断，导致发布流程反复失败。最终折腾了多轮才成功发出去。"
date: 2026-06-14T00:00:00.000Z
tags: ["pi","Halo"]
---

## 背景

前几天我开发了 DownloadXBookmarks 扩展后用博客记录了整个过程，但在**发布到 Halo 博客**这一步卡了很久——文章内容太大，`bb_browser_eval` 的参数被截断，导致发布流程反复失败。最终折腾了多轮才成功发出去。

这次经历促使我对发布工具做了系统性优化。本文记录遇到的问题和修复方案。

## 问题复盘

### 1\. 大内容被截断

我的文章 HTML 约 9468 字节。第一次用 `halo_publish` 工具时，它输出了一大段 JS 代码但没有执行——工具无法解析大内容的输出格式。

```
❌ 未知输出:
sessionStorage.setItem("halo_html","<h2>背景</h2>...");"ok";(async function(){...})()
```

### 2\. eval 参数长度限制

改用 `bb_browser_eval` 手动执行后，发现单次参数传 14KB 的 JS 代码时，字符串被静默截断——最终只存了 370 字符到 sessionStorage，而不是完整的 9468。

**原因**：`bb_browser_eval` 的 JS 代码通过 HTTP 传输到浏览器，**超过约 7000 字节会被截断**。

### 3\. 错误的分块策略

脚本原有 `MAX_CODE = 11000` 的阈值，认为超过才分块。但我的文章刚好卡在边界附近——9468 的 HTML 加上 publish JS 约 11000 字节，被判定为 SINGLE 模式。但实际上传输过程中的 JSON 序列化、URL 编码等额外开销导致实际传输量超过限制。

### 4\. Tab ID 被截断

Halo 标签页 ID 是 `985d`，但系统把它当数字解析成了 `985`，丢掉了 `d`。好在 `bb_browser_eval` 能正确处理完整 ID，但导航类操作不行。

## 修复方案

### 1\. 降低安全阈值

```
// 原来
const MAX_CODE = 11000;

// 现在  
const MAX_STORE_CODE = 6000;   // 单次 eval 最大安全长度
const MAX_SINGLE = 7000;       // store + publish 合并上限
```

从 11000 降到 6000，留 15% 安全余量。同时分块算法从激进缩放的 `0.9` 改为保守的 `0.85`，起始点从 `0.9` 降到 `0.5`，避免 overshoot。

### 2\. 强制分块

原来 9468 字节的 HTML 被错误判定为 SINGLE 模式。现在它被正确分为 **4 个 chunk**：

```
CHUNKS:4
  0: halo-chunk-xxx-0.js (4670 bytes) ✅
  1: halo-chunk-xxx-1.js (4038 bytes) ✅
  2: halo-chunk-xxx-2.js (4058 bytes) ✅
  3: halo-chunk-xxx-3.js (303 bytes)  ✅
```

每个 chunk 都远低于 6000 字节的安全线。

### 3\. 分步执行流程

大文章不再尝试合并为一次 eval，而是拆成三步：

```
Step 1: bb_browser_eval → store chunk 0  → sessionStorage
Step 1: bb_browser_eval → store chunk 1  → sessionStorage  
Step 1: bb_browser_eval → store chunk N  → sessionStorage
------------------------------------------------------
Step 2: bb_browser_eval → assemble        → sessionStorage("halo_html")
Step 3: bb_browser_eval → publish         → Halo API → Published ✅
```

**为什么不用 --exec 自动执行？**

最初我尝试在脚本中添加 `--exec` 模式，让 Node.js 自动调 `bb_browser_eval`。但 `bb_browser_eval` 是 pi 工具函数，不是系统命令，Node.js 进程调不了。所以脚本保持纯粹的 JS 生成职责，执行由 pi agent 编排。

### 4\. 输出格式优化

SINGLE 模式的输出从：

```
Next: bb_browser_eval in Halo tab
```

改为：

```
Steps: bb_browser_eval <tab> "$(cat /tmp/halo-publish-xxx.js)"
```

CHUNKS 模式新增每步的具体命令，AI 直接复制执行即可。

### 5\. SKILL 文档补充

新增了：  
\- **常见问题章节**：Tab 查找、截断处理、内容不完整排查  
\- **技术原理说明**：为什么分块、sessionStorage 中转机制  
\- **Halo API 流程**：两个 API 调用的具体细节

## 实测数据

指标

优化前

优化后

MAX\_CODE

11000

6000

单 chunk 最大

~11000（越界）

4670（安全）

chunk 数

1（截断）

4（完整）

发布成功率

0%（反复失败）

100%（一次到位）

操作步骤数

~5 次试错

3 步确定

## 经验教训

1.  **参数长度限制要实测**：文档说 11000 安全，实际 7000 就开始出问题。**数值要保守再保守**。
2.  **大内容永远分块**：即使是"刚好够"的尺寸，也强制分块。边际情况最坑人。
3.  **工具职责要单一**：生成 JS 的脚本就只管生成，执行交给编排层。试图在脚本里做一切反而增加耦合。
4.  **故障排查文档要写透**：踩过的坑整理成 FAQ，下次遇到直接查，不用重新推导。

## 后续优化方向

*   ⬜ 增量发布（检测文章变化，只更新内容）
*   ⬜ 多图床支持（文章中的本地图片自动上传）
*   ⬜ 定时自动发布（配合 CI/CD 流水线）
*   ⬜ 发布预览（先在草稿模式预览再公开）

* * *

如果你也在用 Halo 博客 + bb-browser 做自动化发布，欢迎交流踩坑经验。