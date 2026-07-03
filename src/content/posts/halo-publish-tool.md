---
title: "构建 Halo Publish Tool：用 pi Agent 让 Markdown 一键发布到博客"
description: "在上一篇在 WSL2 中连接宿主机 Windows Chrome 调试端口中，我们折腾了一大圈——从 Chrome CDP 调试端口、WSL2 网络代理、Python 中继、到 Halo API 的 POST/GET/PUT 三轮调用——最终验证了通过浏览器登录态发布文章的完整链路。"
date: 2026-06-13T00:00:00.000Z
tags: ["Halo","pi","WSL2","Chrome","bb-browser"]
---

## 背景

在上一篇《在 WSL2 中连接宿主机 Windows Chrome 调试端口》中，我们折腾了一大圈——从 Chrome CDP 调试端口、WSL2 网络代理、Python 中继、到 Halo API 的 POST/GET/PUT 三轮调用——最终验证了**通过浏览器登录态发布文章**的完整链路。

但那个流程太长了。每次都要：

1.  把 Markdown 转成 HTML
2.  判断内容大小决定分不分块
3.  生成 base64
4.  分多次 `bb_browser_eval` 执行
5.  祈祷编码没出错

这显然不是「方便以后发布个人博客」该有的体验。

所以我把整个链路做成了 **pi Agent 的工具包**——一个 Skill + 发布脚本 + 自定义 Tool 扩展。现在只需要说一句：

> 「发布这篇 Markdown」

剩下的全部自动完成。

## 工具包架构

```
halo-publish/
├── SKILL.md                  ← pi 自动发现的 Skill（提供工作流文档）
├── scripts/
│   └── halo-publish.mjs      ← 核心发布脚本（Node.js）
└── (extension)
~/.pi/agent/extensions/
    └── halo-publish.ts       ← 自定义 Tool 扩展（注册 halo_publish 命令）
```

### 三个组件各司其职

组件

语言

职责

**halo-publish.mjs**

Node.js

解析 Markdown → 转 HTML → 生成 Halo API 调用 JS

**SKILL.md**

Markdown

告诉 pi 如何执行流程、何时分块、注意事项

**halo-publish.ts**

TypeScript

注册 `halo_publish` 工具，一键串联全部步骤

## 核心流程

```
用户说 "发布这篇 Markdown"

    ↓

pi 发现 halo-publish Skill + Tool

    ↓

halo-publish.mjs 解析 Markdown
  ├─ 提取 frontmatter（title, slug, tags）
  ├─ 用 Python markdown 库转 HTML
  └─ 判断内容大小

    ↓
    ├─ 小文章 (<11KB) → 生成单个 JS
    │   sessionStorage + API 调用都在一个 eval 里
    │
    └─ 大文章 (>11KB) → 自动分块
        ├─ chunk 0.js: 存储内容前半段
        ├─ chunk 1.js: 存储内容后半段（如果需要）
        ├─ assemble.js: 拼回完整内容
        └─ publish.js: 创建帖子 + 快照 + 发布

    ↓

bb_browser_eval 在 Halo 标签页执行 JS
  └─ 浏览器 Cookie 自动携带认证

    ↓

Halo API 三轮调用：
  1. POST /posts → 创建帖子
  2. POST /snapshots → 写入内容
  3. GET + PUT /posts/{name} → 发布
```

## 关键技术决策

### 1\. 为什么不直接用 Node.js fetch 调 Halo API？

因为 Halo 的认证是 session cookie。直接从 WSL 发请求不带 cookie，需要额外处理认证。而通过浏览器执行 `fetch()`，cookie 自动携带——这是之前折腾好的基础设施红利。

### 2\. 为什么还要分块？

`bb_browser_eval` 工具的实际参数长度限制在 **~11KB 左右**。对于一篇几千字的文章，Markdown 转成 HTML 后动辄 15-20KB。所以脚本会自动检测：

*   如果生成的 JS < 11KB → 单步搞定
*   如果 > 11KB → 拆成 store(分块) + assemble + publish 三步

用户完全无感知。

### 3\. 为什么用 Python 转 HTML 而不是 Node.js 的 markdown-it？

因为系统里已经有 Python 的 `markdown` 库（`pip install markdown`），零依赖。Node.js 那边再装一个 markdown 库需要 `npm install`，多一个步骤。kill 一个 dead simple 的方案：`python3 -c "import markdown; print(markdown.markdown(md))"`。

### 4\. 自定义 Tool vs 只用 bash 脚本？

两者都可以。但自定义 Tool 注册为 pi 的 `halo_publish` 后：

*   参数有类型检查和描述（TypeBox schema）
*   返回结构化结果（不是纯文本）
*   更深的 pi 生态集成

如果不想用扩展，直接执行脚本也完全 OK——Skill 文档里两种方式都写了。

## 核心代码片段

### 自动分块逻辑

```
const MAX_CODE = 11000; // 安全上限

if (htmlStr.length + publishJS.length < MAX_CODE) {
  // 单步：store + publish 合并在一个 eval 里
  const allJS = storeJS + ';' + publishJS;
} else {
  // 分块：根据 MAX_CODE 自动计算每个 chunk 能容纳多少字符
  const chunkSize = MAX_CODE - 150; // 留出 setItem 包裹代码的空间
  let chunks = [];
  for (let i = 0; i < html.length; i += chunkSize) {
    chunks.push(html.slice(i, i + chunkSize));
  }
  // 每个 chunk 生成一个 store JS 文件
  // 最后生成 assemble + publish JS 文件
}
```

### Halo API 三轮调用（在浏览器中执行）

```
// 1. 创建帖子
let post = await fetch('/apis/api.console.halo.run/v1alpha1/posts', {
  method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ post: { spec: { title, slug, tags, ... } } })
}).then(r => r.json());

// 2. 创建快照（写入内容）
let snap = await fetch('/apis/content.halo.run/v1alpha1/snapshots', {
  method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({
    spec: { rawType:'HTML', rawPatch: html, contentPatch: html, ... }
  })
}).then(r => r.json());

// 3. 获取当前状态 + 修改为已发布
let current = await fetch('/apis/content.halo.run/v1alpha1/posts/' + postName)
  .then(r => r.json());
current.spec.headSnapshot = snapName;
current.spec.baseSnapshot = snapName;
current.spec.releaseSnapshot = snapName;
current.spec.publish = true;

await fetch('/apis/content.halo.run/v1alpha1/posts/' + postName, {
  method:'PUT', headers:{'Content-Type':'application/json'},
  body: JSON.stringify(current)
}).then(r => r.json());
```

## 使用演示

### 小文章：一句话搞定

```
用户：发布这篇 hello.md

AI (through halo_publish tool)：
  ✅ 解析 Markdown frontmatter（title: Hello World）
  ✅ 转为 HTML（312 bytes）
  ✅ 单步执行（JS 2.3KB）
  ✅ SUCCESS: Published!
```

### 大文章：自动分两步，用户无感知

```
用户：发布这篇 long-article.md

AI：
  ✅ 内容 16KB，自动分 2 块
  Step 1: store chunk 0 (10KB) ✓
  Step 2: store chunk 1 (6KB)  ✓
  Step 3: assemble (212 bytes)  ✓
  Step 4: publish (2.5KB)       ✓
  ✅ SUCCESS: Published!
```

## 相对上一篇的改进

方面

上一篇（手动）

现在（自动化）

编码

base64 手工分块

自动转 HTML + 自动分块

步骤

6-7 步

1 步或自动

大小判断

人工

脚本自动判断

错误处理

靠肉眼看

脚本返回明确状态

复用性

临时脚本

Skill + Tool 可复用

frontmatter

手动提取

自动解析 title/slug/tags

## 总结

这个工具包的价值不在于技术难度——Halo API 的流程之前已经摸清了。而在于**把一次性的复杂操作封装成可复用的能力**。

pi Agent 的 Skill + Extension 机制非常适合做这种事：

*   **Skill** 提供文档上下文，让 AI 知道该怎么做
*   **Script** 做脏活累活（Markdown 转换、JS 生成、分块计算）
*   **Extension** 注册为工具，让 AI 能一键调用

现在，发博客的流程变成了：

```
写 Markdown → 告诉 pi "发布这篇" → done
```

完整的代码和文档在：  
\- Skill: `~/.pi/agent/skills/halo-publish/SKILL.md`  
\- 脚本: `~/.pi/agent/skills/halo-publish/scripts/halo-publish.mjs`  
\- 扩展: `~/.pi/agent/extensions/halo-publish.ts`

### 相关阅读

- [Halo Publish 工具优化：一次发布踩坑与修复实录](/posts/halo-publish-optimization/)
- [在 WSL2 中连接宿主机 Windows Chrome 调试端口](/posts/wsl2-chrome-cdp/)
- [用 Astro + Cloudflare Pages 免费搭建个人博客](/posts/astro-cloudflare-blog/)

* * *

_2026-06-12 · [Halo](https://github.com/halo-dev/halo) · [pi](https://github.com/earendil-works/pi)_