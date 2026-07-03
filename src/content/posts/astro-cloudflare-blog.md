---
title: "从零到一：用 Astro + Cloudflare Pages 免费搭建个人博客"
description: "记录从 Hugo 到 Halo 再到 Astro，最终用 Cloudflare Pages 免费托管博客的完整折腾过程，踩坑总结与方案对比。"
date: 2026-07-03
tags: ["博客搭建", "Astro", "Cloudflare", "Cloudflare Pages"]
---

## 一、背景 — 为什么又双叒叕换博客了

我的博客史可以追溯到 2020 年，最早用 **Hugo** 搭在 GitHub Pages 上，后来换了 VPS 用 **Halo** 自建。Halo 功能完善，有后台管理界面，用起来挺顺手的。

但一直有个心病：**费用**。VPS 每月要续费，域名也要续费。虽然钱不多，但总想着能不能省下来。

正好那段时间在研究 Cloudflare，发现 Cloudflare Pages 有**免费套餐，无限带宽**，全球 CDN，还自带 HTTPS。对于个人博客来说，这几乎是最理想的托管方案了。

于是决定：**迁移到 Cloudflare Pages，免费、省心、只写 Markdown 就行。**

## 二、方案选型 — Hugo 还是 Astro？

既然是静态博客，第一个想到的就是老熟人 **Hugo**。

Hugo 确实好——构建速度毫秒级，一个二进制搞定，没有 Node.js 依赖。但它的模板语言（Go Template）写起来有点特殊，以后想加个什么交互功能会比较麻烦。

另一个选项是 **Astro**。

Astro 也是静态站点生成器，但它最大的特点是**组件化**——用标准 HTML/CSS/JS 写组件，可以无缝嵌入 React、Vue、Svelte 等框架。而且 Astro 默认输出零 JS 的纯静态页面，SEO 和性能都非常好。

对比了一下：

| 维度 | Hugo | Astro |
|------|------|-------|
| 构建速度 | 毫秒级 | 秒级（够用） |
| 模板语言 | Go Template（特殊） | HTML + JS（标准） |
| 扩展性 | 有限 | 组件化，灵活 |
| 主题生态 | 丰富 | 丰富 |
| SEO | 优秀 | 优秀 |

最终选了 **Astro**。理由很简单：**Hugo 能做的 Astro 都能做，但 Astro 能做的 Hugo 不一定能做。** 以后想加个搜索、评论区什么的，Astro 生态更方便。

## 三、搭建过程 — 踩坑才是主旋律

### 3.1 初始化项目

用 Astro 官方 CLI 创建项目：

```bash
npm create astro@latest my-blog -- --template blog
```

过程很顺利，模板自带了示例文章、RSS、Sitemap。

### 3.2 迁移旧文章

从 Hugo 迁移到 Astro，最麻烦的是 Frontmatter 格式转换。

Hugo 的文章格式：

```yaml
---
title: "文章标题"
date: 2020-05-13
categories: [hugo]
tags: [hugo]
---
```

Astro 需要：

```yaml
---
title: "文章标题"
description: "文章描述"
pubDate: 2020-05-13
tags: ["hugo"]
---
```

28 篇文章，每一篇都要改。写了个 Node.js 脚本批量处理：

- 提取原有 Frontmatter
- 转换字段名（`date` → `pubDate`）
- 合并 `categories` 到 `tags`
- 从正文第一段提取 `description`

脚本跑完，28 篇全部转换成功，省了不少时间。

### 3.3 Cloudflare Pages 部署

Cloudflare Pages 的部署流程很直接：

1. 把代码推到 GitHub
2. 在 Cloudflare Dashboard 创建 Pages 项目
3. 连接 GitHub 仓库
4. 配置构建参数（Build command: `npm run build`，Output: `dist`）
5. 部署完成

第一次部署就成功了，自动分配了 `xxx.pages.dev` 域名。

绑定自定义域名也很简单——在项目设置里添加域名，Cloudflare 自动配好 DNS 和 SSL 证书。

`blog.455545.xyz` 正式上线。

## 四、主题折腾 — 换了三个才算完

### 4.1 默认模板

Astro 官方博客模板很简洁，但太"模板"了——Hello Astronaut 之类的示例内容，一看就是脚手架生成的。

### 4.2 AstroPaper

第二个主题选了 **AstroPaper**，GitHub 上 4.4k Star，功能很全：

- 暗黑模式
- 全文搜索
- 标签系统
- 动态 OG 图片
- SEO 友好

但折腾了一个多小时，碰到了各种兼容问题。

首先是 **TailwindCSS v4** 和 Astro 的兼容问题。AstroPaper 用了 `@tailwindcss/vite` 插件，但 Astro 最新版内置的 Vite 版本和这个插件不兼容，报错 `Missing field tsconfigPaths`。

尝试了几个方案：

- 切换到 `@tailwindcss/postcss` — 好了
- Google Fonts 因为代理环境连不上 — 换成系统字体
- 动态 OG 图片依赖 Google Sans Code 字体 — 先禁用

改到一半又发现 **pnpm lock 文件**的问题。Cloudflare 构建环境会检测 `pnpm-lock.yaml` 并自动用 pnpm 安装，但 lock 文件和 `package.json` 不一致，报 `ERR_PNPM_OUTDATED_LOCKFILE`。

最后还发现 `package.json` 里有个多余的逗号，导致 JSON 解析失败——Cloudflare 构建平台对 JSON 格式比本地严格。

就这样修修补补，最终放弃了替换 AstroPaper 的想法。不是不能用，而是**每次换主题都要折腾这些依赖问题，太累**。

### 4.3 UINUX Blog

最终选了 **UINUX Blog**——一个写作优先的极简主题。

它的特点正中我的需求：

- **纯 CSS，没有 TailwindCSS** — 不用担心 v3/v4 兼容问题
- **从 Google Fonts 加载字体，但可换成 @fontsource 本地包** — 不依赖 Google API
- **零 JS（除了搜索页）** — 纯静态 HTML
- **六组件** — 极简，几乎没什么可坏的

更关键的是，它用的是 **Astro v6** 和稳定的依赖组合，从创建到构建成功一次通过，零报错。

### 4.4 Cloudflare 构建排错记录

这次折腾下来，总结一下 Cloudflare Pages 上常见的构建问题：

| 问题 | 原因 | 解决 |
|------|------|------|
| `ERR_PNPM_OUTDATED_LOCKFILE` | 有 `pnpm-lock.yaml` 但和 `package.json` 不一致 | 删除 `pnpm-lock.yaml` |
| `patch-package` 报错 | `patches/` 目录版本不匹配 | 删除 `patches/` 和 `prepare` script |
| `JSON.parse` 错误 | `package.json` 最后一项多了逗号 | JSON 不允许 trailing comma |
| Google Fonts 超时 | 构建环境无法访问 Google | 改用本地字体或 @fontsource |

## 五、总结

最终架构：

```
Astro + UINUX Blog 主题 → GitHub → Cloudflare Pages → blog.455545.xyz
```

写作流程：

```
写 Markdown → git add . → git commit → git push → 自动部署
```

简简单单，不用管服务器，不用管证书，不用管维护。

一些心得：

1. **选主题看依赖复杂程度，不是看 Star 数。** 功能越多，出问题的概率越大。
2. **本地构建成功 ≠ Cloudflare 构建成功。** 构建环境差异、JSON 格式严格度差异都可能踩坑。
3. **Cloudflare Pages 真香。** 免费、无限带宽、全球 CDN、自动 HTTPS，个人博客完全够用。

这一路从 Hugo 到 Halo 再到 Astro，换了一圈，最终还是回到了"写 Markdown + git push"这种最原始的发布方式。

挺好的。

### 相关阅读

- [Halo Publish Tool：用 pi Agent 让 Markdown 一键发布到博客](/posts/halo-publish-tool/)
- [Halo Publish 工具优化：一次发布踩坑与修复实录](/posts/halo-publish-optimization/)
- [Google Search Console 无法读取站点地图？完整排查与修复记录](/posts/google-search-console-sitemap/)
- [Hugo 建立博客](/posts/13-hugo-blog-setup/)
