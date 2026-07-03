# SEO / AEO 改进清单

博客地址：https://blog.455545.xyz
框架：Astro + UINUX Blog
托管：Cloudflare Pages

---

## 🔴 高优先级

### 1. 修复默认页面描述

**文件：** `src/components/Layout.astro`

```astro
// 改前
description = "A quiet place to read.",

// 改后
description = "记录技术踩坑、AI 编程工具折腾与解决方案的个人博客",
```

首页、标签页、搜索页等未单独传 description 的页面都会用到这个默认值。
搜索引擎和 AI 引擎都靠 description 判断页面内容，务必写得有信息量。

---

### 2. 文章 URL 优化

当前 slug 包含中文，例如：

```
/posts/用-astro-和-cloudflare-pages-免费搭建个人博客/
```

建议改成英文或拼音 slug，更干净。可以在文章 Frontmatter 中自定义 slug（取决于主题支持情况）。

---

### 3. 启用 Google Search Console

主题支持通过环境变量配置 Google 站长验证：

1. 在 [search.google.com/search-console](https://search.google.com/search-console) 添加你的博客
2. 获取验证代码
3. 在项目根目录创建 `.env` 文件：

```
PUBLIC_GOOGLE_SITE_VERIFICATION=你的验证代码
```

4. 重新构建部署

---

## 🟡 中优先级

### 4. 提交 Sitemap 到搜索引擎

当前 Sitemap 地址：

```
https://blog.455545.xyz/sitemap-index.xml
```

提交到：

- **Google Search Console** → Sitemaps → 输入地址提交
- **Bing Webmaster Tools** → Sitemaps → 提交
- **百度站长平台** → Sitemap → 提交

### 5. 添加 robots.txt

确保搜索引擎爬虫能正常抓取。在 `public/robots.txt` 中：

```
User-agent: *
Allow: /

Sitemap: https://blog.455545.xyz/sitemap-index.xml
```

### 6. 文章内添加内链

28 篇文章之间缺少互相链接。内链帮助搜索引擎理解网站结构，也能传递权重。

建议做法：

- 写新文章时，顺手链接到相关旧文章
- 旧文章更新时，添加指向新文章的链接
- 相关文章推荐（可在文章底部手动添加 "相关阅读" 区块）

### 7. 检查 H1/H2 标题层级

每篇文章确保：

- 只有一个 `<h1>`
- `<h2>` 按内容逻辑分段
- 不要跳级（h1 → h3 跳过 h2）

### 8. 优化 Open Graph 图片

当前默认 OG 图片是 `/og/default.png`，内容比较通用。
可以为热门文章单独设置 OG 图片，增加社交分享点击率。

---

## 🟢 低优先级

### 9. 性能优化

用 PageSpeed Insights 测试：

```
https://pagespeed.web.dev/
```

重点关注：

- **LCP（ Largest Contentful Paint）** — 首屏加载速度
- **CLS（ Cumulative Layout Shift）** — 页面布局稳定性
- **FCP（ First Contentful Paint）** — 首次内容渲染

### 10. 结构化数据优化

当前文章页有 JSON-LD 的 `BlogPosting` 和 `Organization` schema。
可以补充：

- `BreadcrumbList` — 面包屑导航
- `FAQPage` — 常见问题（如果文章是问答形式）

### 11. 添加 Hreflang

目前是中文博客，但缺少 `hreflang` 声明。在 `Layout.astro` 的 `<head>` 中添加：

```html
<link rel="alternate" href="https://blog.455545.xyz" hreflang="zh-CN" />
<link rel="alternate" href="https://blog.455545.xyz" hreflang="x-default" />
```

---

## 执行建议

| 优先级 | 事项 | 预估时间 |
|:------:|:----|:--------:|
| 🔴 | 改默认 description | 5 分钟 |
| 🔴 | 文章 URL 优化 | 后续文章注意 |
| 🔴 | 启用 Google Search Console | 10 分钟 |
| 🟡 | 提交 Sitemap | 5 分钟 |
| 🟡 | 添加 robots.txt | 5 分钟 |
| 🟡 | 文章内链 | 逐篇补充 |
| 🟡 | 检查 H1/H2 层级 | 1 小时 |
| 🟢 | 性能优化 | 按需 |
| 🟢 | 结构化数据 | 后续优化 |
