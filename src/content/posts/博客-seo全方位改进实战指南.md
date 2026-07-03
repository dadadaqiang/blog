---
title: "博客 SEO 全方位改进实战指南"
description: "从 Astro + Cloudflare Pages 博客从零到一的完整SEO优化记录，包含标题、URL、内链、结构化数据、性能优化等全套方案。"
date: 2026-07-03
tags: ["SEO", "AEO", "Astro", "Cloudflare", "博客搭建"]
---

> 之前把博客从 Hugo 迁移到 Astro + Cloudflare Pages，顺便做了一次全方位的 SEO 优化。下面把所有改进点和操作步骤整理一下，顺便把剩下的事儿也做完。

---

## 一、为什么要 SEO

博客如果只写好内容，还不够。要被人搜到、被 AI 搜索引用，还需要：

1. **让搜索引擎懂你的内容**（SEO）
2. **让 AI 引擎主动引用**（AEO）

这两者其实离得不远：**内容结构清晰 + 关键词准确 + 页面加载快**，搜索/AI 都会给你高分。

---

## 二、SEO 改进清单

| 项目 | 状态 | 说明 |
|:----|:----|:----|
| 1. 默认页面描述 | ✅ 已改 | 从 "A quiet place to read" 换成正式描述 |
| 2. 文章 URL 优化 | ✅ 已改 | 29 篇文章 URL 全部换成英文 slug |
| 3. Google Search Console | ✅ 已配置 | 添加验证 meta 标签 |
| 4. 提交 Sitemap | ⏳ 待验证 | Cloudflare 可能在 Bot Fight Mode 里 |
| 5. robots.txt | ✅ 已改 | Sitemap 地址指向正确域名 |
| 6. 文章内链 | ✅ 已加 | 17 篇文章底部都有"相关阅读" |
| 7. 标题层级 | ✅ 已检查 | 全部分析无 H1 重复、跳级 |
| 8. OG 图片 | ✅ 已改 | 显示 "G400 技术笔记" |
| 9. 性能优化 | ✅ 已做 | 移除 Google Fonts，换本地字体 |
| 10. 结构化数据 | ✅ 已加 | 文章页有 BreadcrumbList |
| 11. Hreflang | ✅ 已加 | 添加 zh-CN x-default 声明 |

---

## 三、具体改进步骤

### 1. 默认页面描述

**文件**：`src/components/Layout.astro`

```astro
// 改前
description = "A quiet place to read.",

// 改后  
description = "记录技术踩坑、AI 编程工具折腾与解决方案的个人博客",
```

首页、标签页、搜索页等都用这个默认描述。写得具体点，搜索引擎和 AI 都会抓住关键词。

### 2. 文章 URL 优化

把所有中文文件名改成英文：

```bash
# 批量改名脚本
for f in *.md; do
  # 根据标题生成英文 slug
  # 例如：用 Astro 和 Cloudflare Pages 免费搭建个人博客.md → astro-cloudflare-blog.md
done
```

英文 URL 更干净，也利于 SEO 和 AEO。

### 3. Google Search Console 验证

在 Google Search Console 添加站点 → 选 **URL prefix** → 填 `https://blog.455545.xyz` → 验证方式选 **HTML tag**：

```html
<meta name="google-site-verification" content="6S9Th-tZ2kJZpoeU9ZdOXGIwV1RbpvFt8_RO2uyBTyk" />
```

放到 `src/components/Layout.astro` 的 `<head>` 里就行。

### 4. 提交 Sitemap

部署成功后：

1. 入 Google Search Console
2. 左侧 **Sitemaps**
3. 填 `sitemap-index.xml` → Submit

如果显示"无法抓取"，检查 Cloudflare 设置——**Bot Fight Mode** 可能被打开了，关掉它。

### 5. robots.txt

```txt
User-agent: *
Allow: /

Sitemap: https://blog.455545.xyz/sitemap-index.xml
```

放在 `public/robots.txt`。

### 6. 文章内链（内部链接）

给文章底部加"相关阅读"区块：

```markdown
### 相关阅读

- [相关文章标题](/posts/slug/)
- [相关文章标题](/posts/slug/)
```

我给了 17 篇文章加了内链，形成了一个小网络。

### 7. 标题层级检查

确保：

- 每篇文章只有一个 `<h1>`（标题本身就是 h1）
- 后面的 `##`、`###` 依次递进
- 没有跳级（h1 → h3 跳过 h2）

### 8. Open Graph 图片

默认 OG 图片显示 `G400 技术笔记`，社交分享时会自动生成带标题的图片。

### 9. 性能优化

移除 Google Fonts，改用本地字体：

```css
/* global.css */
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";

:root {
  --font-body: Georgia, "Times New Roman", serif;
  --font-heading: "Inter", sans-serif;
  --font-mono: Consolas, "Courier New", monospace;
}
```

Layout.astro 移除 fonts.googleapis.com 的 preconnect 和 stylesheet。

### 10. 结构化数据（BreadcrumbList）

文章页新增面包屑 JSON-LD：

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "首页", "item": "https://blog.455545.xyz/" },
    { "@type": "ListItem", "position": 2, "name": "文章标题", "item": "https://blog.455545.xyz/posts/slug/" }
  ]
}
```

### 11. Hreflang 声明

```html
<link rel="alternate" href="https://blog.455545.xyz" hreflang="zh-CN" />
<link rel="alternate" href="https://blog.455545.xyz" hreflang="x-default" />
```

告诉搜索引擎这是中文站。

---

## 四、后续建议

### 性能
用 PageSpeed Insights 再测一次，看看还有哪些优化点（图片懒加载、渲染阻塞 CSS 等）。

### 内容结构
每篇文章的 H2 小标题最好写成问题形式，AEO 友好：

```markdown
## 为什么需要重新部署？
## 如何解决 JSON 解析错误？
## Cloudflare Pages 常见问题有哪些？
```

### 关键词
在文章开头、结尾自然出现目标关键词。不要堆砌。

---

## 五、总结

从 Hugo → Halo → Astro，换了三个主题，踩了不少坑。但每次折腾都有收获：

1. **Astro 适合写博客** — 零 JS 静默渲染，SEO 友好
2. **Cloudflare Pages 免费够用** — 无限带宽、全球 CDN、自动 HTTPS
3. **SEO 是系统工程** — 从标题、URL、内链到结构化数据，缺一不可

博客的SEO优化不是一次性搞定的，持续迭代才是王道。

---

> 这是一篇记录博客SEO改进的技术博客。如果你也在搭博客，欢迎交流心水 😅

---

**标签**：`SEO`、`AEO`、`Astro`、`Cloudflare`、`博客搭建`