---
title: "DownloadXBookmarks：一个无 API Key、无 800 条限制的 X 书签导出扩展"
description: "我用 X.com（原 Twitter）收藏了大量技术书签，但官方导出方案限制很大："
date: 2026-06-15T00:00:00.000Z
tags: ["pi","Chrome"]
---

## 背景

我用 X.com（原 Twitter）收藏了大量技术书签，但官方导出方案限制很大：

*   **官方 API v2 只返回最近 800 条书签**
*   **没有批量导出功能**，只能手动逐条操作
*   **没有文件夹结构保留**，X Premium 用户创建的文件夹信息在导出时丢失
*   **需要申请开发者 API Key**，流程繁琐且有速率限制

市面上有些开源方案，但都存在各种不足。这个周末我决定自己写一个 Chrome 扩展 —— **DownloadXBookmarks**。

## 现有方案调研

动手之前，我深入研究了几个开源项目：

项目

方案

⭐

文件夹支持

核心思路

**sytelus/xarchive**

Chrome 扩展 (MV3)

13

✅

Options Page 直接调用 GraphQL API

**sahil-lalani/bookmark-export**

Chrome 扩展 (MV3)

20

❌

ServiceWorker 直接 API 回放

**andycana/x-bookmark-to-markdown-no-api**

Chrome 扩展 (MV3)

4

❌

DOM 监测收藏按钮

**kaichen/twitter-web-exporter**

UserScript

~2300

❌

拦截 XHR/GraphQL 响应

**zhaoscsc/x-bookmark-to-obsidian**

Chrome 扩展 + Native Host

~10

❌

收藏时同步到 Obsidian

**为什么没有直接 fork 一个？**

*   很多项目年久失修，queryId 已经过期
*   缺少文件夹支持（X Premium 的书签文件夹）
*   速率控制不够完善（Twillot 项目就是因为零延迟导致账号被冻结）
*   我想用 MV3 + ES Module 全新架构

## 技术难点

### 1\. 内部 GraphQL API

X.com 网页版使用内部 GraphQL API 来获取书签。这个 API：

*   **没有 800 条限制**，支持游标分页
*   **需要特定 headers**：`Authorization`、`X-Csrf-Token`、`X-Client-Transaction-Id` 等
*   **queryId 每 2-4 周轮换一次**，硬编码注定会过期

### 2\. 反爬与封号风险

速率限制是最大的风险。Twillot 项目就因为请求间隔太短导致大量账号被封。**必须做严格的速率控制。**

### 3\. Service Worker 生命周期

MV3 的 Service Worker 有 30 秒中止限制，不适合长时间运行的分页导出任务。

## 架构设计

### 整体架构

```
Options Page + Service Worker + Content Script
```

**核心思路：**

1.  **Service Worker 最小化** — 仅做被动捕获和打开 Options Page，约 80 行代码
2.  **Options Page 作为主运行环境** — 常驻 Tab，可以长时间运行分页循环
3.  **被动捕获凭据** — 通过 `chrome.webRequest.onSendHeaders` 监听 x.com 的 GraphQL 请求，自动提取 auth headers 和 queryId

### 文件结构

```
DownloadXBookmarks/
├── manifest.json          # MV3
├── background.js          # Service Worker
├── content.js             # Content Script
├── options.html           # Options Page UI
├── options.js             # 主逻辑
├── options.css            # 样式
├── version.js             # 版本
├── lib/                   # 核心模块
│   ├── api.js
│   ├── fetcher.js
│   ├── parser.js
│   ├── folders.js
│   ├── db.js
│   ├── exporter.js
│   ├── utils.js
│   └── query-ids.js
├── vendor/
│   └── dexie.mjs
└── icons/
```

## 关键实现细节

### 1\. Query ID 自动捕获

Service Worker 通过 webRequest.onSendHeaders 自动监听 x.com 的所有 GraphQL 请求，提取 authorization、x-csrf-token 等 headers 和 queryId。

### 2\. 速率限制

2.5s base + 30-50% jitter 延迟，遇到 429 时冷却 5 分钟，指数退避重试，最多 5 次。

### 3\. 三种导出格式

**JSON** — 结构化数据，包含完整元数据
**CSV** — 适合导入 Excel/Google Sheets（带 BOM 头）
**Markdown** — 可读性最高的格式，每条推文含完整信息、图片和链接

## 使用体验

实测成功导出了 147 条书签，耗时约 15 秒（含速率限制延迟），完整无遗漏。

## 技术总结

决策

选择

理由

运行时

Options Page

避免 SW 30s 限制

构建工具

零构建

减少依赖，纯手写 ES Module

数据库

Dexie

零依赖 CDN 单文件

凭证获取

被动 webRequest

用户零操作

Query ID

被动捕获 + fallback

自动适应轮换

速率策略

2.5s + jitter

防止封号

### 踩坑记录

1.  declarativeNetRequest 的 initiatorDomains 配置 — 必须设为 \[chrome.runtime.id\]
2.  ct0 cookie 高频轮换 — 每次请求前重新读取
3.  U+2028/U+2029 字符 — JSON 导出需手动转义
4.  IndexedDB 异步陷阱 — 并发 put 需 transaction 包装

* * *

如果你也被 X.com 的书签导出困扰，欢迎试用或贡献代码！

### 相关阅读

- [在 WSL2 中连接宿主机 Windows Chrome 调试端口](/posts/wsl2-chrome-cdp/)
- [构建 Halo Publish Tool：用 pi Agent 让 Markdown 一键发布到博客](/posts/halo-publish-tool/)