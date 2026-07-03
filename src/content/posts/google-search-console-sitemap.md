---
title: "Google Search Console 无法读取站点地图？一份完整的排查与修复记录"
description: "我的博客（基于 Halo Pro 2.25.0）刚完成升级和 SEO 基建，一切准备就绪后，我把 Sitemap 提交到了 Google Search Console，结果看到了一个让人头疼的红色提示："
date: 2026-06-20T00:00:00.000Z
tags: ["Cloudflare","Halo"]
---

## 背景

我的博客（基于 Halo Pro 2.25.0）刚完成升级和 SEO 基建，一切准备就绪后，我把 Sitemap 提交到了 Google Search Console，结果看到了一个让人头疼的红色提示：

> **无法读取此站点地图**

已发现的网页：**0**。这意味着 Google 压根没读到我的 Sitemap 内容，自然也不会发现我博客里的任何文章。

* * *

## 初步排查：Cloudflare 配置

我的博客前面有 Cloudflare 代理（橙色云开启），所以第一个想到的是 Cloudflare 的安全设置出了问题。

检查了以下项目：

*   **Bot Fight Mode** → 已关闭 ✅
*   **Under Attack Mode** → 已关闭 ✅
*   **Security Level** → 标准
*   **WAF 规则** → 无特殊拦截

全部正常，Googlebot 不应该被 Cloudflare 拦下。于是我用 `curl` 验证：

```
$ curl -I https://book.455545.xyz/sitemap.xml
HTTP/2 404
```

等等，**HEAD 请求返回 404？** 那 GET 请求呢？

```
$ curl -s -o /dev/null -w "HTTP %{http_code}" https://book.455545.xyz/sitemap.xml
HTTP 200
```

GET 正常，HEAD 404。这看起来像 Cloudflare 的行为差异，但 Google Search Console 通常用的是 GET 啊……

* * *

## 关键发现：Accept 请求头

继续深入测试，我发现了一个更微妙的差异。

```
# 不带 Accept 头 → 正常
$ curl -s -o /dev/null -w "HTTP %{http_code}" https://book.455545.xyz/sitemap.xml
HTTP 200

# 带 Accept: text/html → 404！
$ curl -s -o /dev/null -w "HTTP %{http_code}" -H "Accept: text/html" https://book.455545.xyz/sitemap.xml
HTTP 404

# Accept: */* → 正常
$ curl -s -o /dev/null -w "HTTP %{http_code}" -H "Accept: */*" https://book.455545.xyz/sitemap.xml
HTTP 200

# Accept: application/xml → 404！
$ curl -s -o /dev/null -w "HTTP %{http_code}" -H "Accept: application/xml" https://book.455545.xyz/sitemap.xml
HTTP 404
```

**真相浮出水面！**

下面是完整的测试矩阵：

请求方式

User-Agent

Accept 头

状态码

GET

—

—

**200**

GET

—

`*/*`

**200**

GET

—

`text/html`

**404**

GET

—

`application/xml`

**404**

GET

Googlebot

`text/html,application/xhtml+xml`

**404**

HEAD

—

—

**404**

Google Search Console 在抓取 Sitemap 时，会携带类似 `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8` 的请求头。**问题就出在这里**——当 `text/html` 出现在 Accept 中时，Halo 的 Sitemap 插件返回了 404。

这就是典型的**服务端内容协商（Content Negotiation）**问题。Halo 的 Sitemap 端点根据 `Accept` 头判断客户端想要 HTML 格式，但它没法把 XML 格式的 Sitemap 渲染成 HTML，于是就返回了 404。

* * *

## 修复方案

### 方案一：修改 Halo 插件（不可行）

如果 Halo 的 Sitemap 插件能正确处理 Accept 头、忽略内容协商直接返回 XML，那是最优雅的解法。但插件代码修改成本高，且需要等插件更新。

### 方案二：Cloudflare 规则

尝试在 Cloudflare 添加页面规则或转换规则来修改请求头，但 Cloudflare Free 计划的部分规则需要 Pro/Business 才支持。

### 方案三：OpenResty / Nginx 配置（✅ 采用）

博客跑在 1Panel 上，前端是 OpenResty（Nginx 的增强版）。最直接的方式就是在 Nginx 层面为 `sitemap.xml` 单独设置一个 `location` 块，**覆写 Accept 请求头**。

在 1Panel → 网站 → `book.455545.xyz` → 设置 → 配置文件中，找到 `location /` 块，在前面加上：

```
location = /sitemap.xml {
    proxy_set_header Accept "*/*";
    proxy_pass http://127.0.0.1:10086;
}
```

保存后重载 OpenResty 即可生效。

* * *

## 验证修复

修复后再次测试：

```
$ curl -s -o /dev/null -w "HTTP %{http_code}" \
  -H "Accept: text/html,application/xhtml+xml" \
  -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  https://book.455545.xyz/sitemap.xml

HTTP 200
```

完美！**所有场景都返回 200 了。**

```
$ curl -s https://book.455545.xyz/sitemap.xml | head -3
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
```

内容和 Content-Type 都正确。

* * *

## 修复后：等待 Google 重试

虽然服务端已经修好了，但 Google Search Console 不会立刻刷新状态——Google 缓存的仍然是修复前的失败结果。

一般来说，Google 会在 **1-3 天内自动重试** Sitemap 读取。你也可以手动触发：

1.  进入 **Search Console → 站点地图**
2.  点击已提交的 Sitemap 条目
3.  点击右侧的 **更多选项（...）→ 删除**
4.  重新提交 Sitemap 地址

或者通过 **网址检查** 工具输入 Sitemap URL → **请求索引编制**。

* * *

## 经验总结

这次排查虽然花了不少时间，但也学到了几点：

1.  **别把问题都怪到 Cloudflare 头上。** 一开始我花了很多时间检查 Cloudflare 的安全设置、页面规则，结果问题的根源在应用层。
2.  **HEAD vs GET 不一致是个重要线索。** 虽然不是这次的根本原因，但帮助我找到了深入排查的方向。
3.  **Accept 头是排查内容协商问题的关键。** 服务端正确的内容协商应该处理所有合理的 Accept 值，如果某个值导致 404，那就是 Bug。
4.  **Nginx 的 `location =` 精确匹配是最直接的修复方式。** 在反向代理场景中，利用 Nginx 的灵活配置可以快速解决应用层的问题，而不需要改代码。

如果你的 Sitemap 也遇到了类似的问题，不妨用这个简单的 curl 命令测一下：

```
curl -s -o /dev/null -w "HTTP %{http_code}" \
  -H "Accept: text/html" \
  https://你的域名/sitemap.xml
```

如果返回 404，那很可能和我遇到的是同一个问题，试试 Nginx 层覆写 Accept 头就解决了。