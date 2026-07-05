---
title: "bb-browser 卡顿与 404 问题排查指南"
description: "使用 Pi 编码代理 + bb-browser 时频繁卡住、操作超时或 404 错误的完整排查与解决方案"
date: 2026-07-05T00:00:00.000Z
tags: ["bb-browser", "Pi", "Chrome", "CDP", "Debug", "AI工具"]
---

## 背景

最近在使用 Pi（编码代理）通过 bb-browser 工具进行浏览器自动化操作时，频繁遇到两个问题：

1. **操作卡住**：执行 `bb-browser snap`、`bb-browser eval` 等命令后长时间无响应，最终超时报错
2. **404 错误**：操作返回 "Not found" 或页面资源加载失败

经过深入排查，定位到了 5 个根因，并整理了一套完整的解决方案。

## 环境说明

- **系统**：WSL2 Ubuntu + Windows Chrome（通过 CDP 转发）
- **bb-browser 版本**：0.14.2
- **Chrome 版本**：150.0.7871.46
- **代理**：HTTP 代理 `http://192.168.128.1:10808`

## 症状

| 现象 | 持续时间 | 触发条件 |
|------|---------|---------|
| 命令卡住 30 秒后超时 | 频繁 | 连续执行多个操作后 |
| 返回 404 / Not found | 间歇性 | 操作特定页面时 |
| 页面元素无法交互 | 持续 | 打开复杂 SPA 页面后 |
| daemon 无响应 | 偶发 | 长时间未重启 |

## 根因分析

### 根因一：Tab 坏请求堆积（最大元凶）

通过 `bb-browser network requests --tab <tabId>` 检查各个标签页的网络请求状态：

| Tab | 页面 | 请求总数 | 失败/挂起 |
|-----|------|---------|----------|
| `5c04` | build.nvidia.com | **500** 个 | **67 个失败** |
| `b560` | docs.api.nvidia.com | 236 个 | 23 个失败（404/410/503） |
| `e2bd` | docs.api.nvidia.com | 110 个 | 正常 |

Chrome 的每个标签页有自己的渲染进程。当页面有大量 pending 或 failed 的网络请求时，**这些坏请求会阻塞渲染进程的事件循环**。bb-browser 通过 CDP (Chrome DevTools Protocol) 发送的命令需要等待渲染进程空闲才能执行，导致：

- `snap` 命令等待 DOM 就绪 → 被 pending 请求拖住
- `eval` 命令等待 JS 执行 → 被卡住
- `click` / `fill` 等交互命令 → Chrome 来不及处理

**为什么会有这么多坏请求？** 像 build.nvidia.com 这类 SPA（单页应用）会在初始化时加载大量第三方脚本：Adobe Analytics、Amplitude、Meta Pixel、Cookie 同意 SDK 等。在 WSL2 环境 + HTTP 代理下，部分 CDN 资源加载失败或超时是很常见的。

### 根因二：CDP 命令超时过长

在 bb-browser 源码中发现了关键配置：

```js
// chunk-ELAKRFAZ.js
var COMMAND_TIMEOUT = 3e4; // 30秒!
```

bb-browser 的命令超时是 **30 秒**。这意味着：

1. 你发送一个 `snap` 命令
2. CDP 将命令转发到 Chrome 渲染进程
3. 渲染进程正忙着处理 67 个失败的请求
4. CDP 命令在队列中等待
5. **30 秒后** 才抛出超时错误

这就是"卡住"的直接感受来源 —— 不是真的卡死，而是要等很久才知道失败了。

### 根因三：Daemon 日志被完全丢弃

```
/proc/231/fd/1 → /dev/null
/proc/231/fd/2 → /dev/null
```

bb-browser daemon 的 **stdout 和 stderr 都被重定向到了 `/dev/null`**。任何错误信息、异常堆栈、连接断开警告都不可见。当一个操作失败时，我们没有任何日志可以排查：

- CDP WebSocket 断开 → 日志被丢弃
- 命令执行异常 → 日志被丢弃
- 页面加载超时 → 日志被丢弃

这让问题排查变成了"黑盒"操作。

### 根因四：代理环境变量可能干扰

```
HTTP_PROXY=http://192.168.128.1:10808
HTTPS_PROXY=http://192.168.128.1:10808
no_proxy=localhost,127.0.0.1,::1,172.31.128.1
```

虽然 `no_proxy` 包含了 `localhost` 和 `127.0.0.1`（CDP 连接走本地），但 Chrome 页面加载的外部资源（CDN 脚本、字体、统计服务等）会经过代理。如果代理偶尔变慢或不稳定：

- 部分资源加载超时 → 变成 pending 请求
- 资源加载失败 → 变成 failed 请求
- 累积到一定数量 → 渲染进程被阻塞

### 根因五：Chrome 长期不重启

分析时的状态：

| 指标 | 数值 |
|------|------|
| Chrome 运行时间 | 1 小时 13 分钟 |
| Chrome 内存占用 | 1.7 GB |
| 累积操作命令数 | 1504 条 |
| 打开标签页数 | 3 个 |

Chrome 的 CDP 连接质量会随时间下降。页面累积的坏请求、内存泄漏、JS 堆增长都会导致：
- CDP 响应延迟增加
- WebSocket 连接不稳定
- 命令执行越来越慢

## 解决方案

### 应急修复（立即执行）

```bash
# 1. 停止 daemon（关闭所有标签页）
bb-browser daemon stop

# 2. 等待几秒确保进程退出
sleep 2

# 3. 重新启动（干净的 Chrome 实例）
bb-browser daemon start

# 4. 验证状态
bb-browser daemon status
# 应该输出：Daemon running: yes | CDP connected: yes
```

重启后不要立即打开大型 SPA 页面，优先使用 site adapter。

### 日常操作规范

#### 1. 用完即关 tab

```bash
# 每次操作完成后关闭标签页
bb-browser close
```

不要留多个标签页闲置。每次只用 1 个 tab，用完就关。

#### 2. 优先使用 site adapter

site adapter 是通过 `eval` 在后台执行 JS 提取数据，不会加载完整页面，效率高得多：

```bash
# 推荐 ✓ — 轻量，无页面渲染开销
bb-browser site github/repo owner/repo --json
bb-browser site arxiv/search "query" --json
bb-browser site youtube/transcript VIDEO_ID --json

# 避免 ✗ — 加载完整 SPA，容易卡顿
bb-browser open https://github.com/owner/repo
bb-browser snap -i
```

#### 3. 用 eval 代替 snapshot 提取内容

当需要获取页面文本时：

```bash
# 推荐 ✓ — 直接执行 JS，不依赖 DOM snapshot
bb-browser eval "document.body.innerText.substring(0, 5000)"

# 避免 ✗ — snapshot 需要等待 DOM 完全就绪
bb-browser snap
```

#### 4. 用 jina_reader 替代浏览器打开

对于纯内容获取场景（文章阅读、文档查阅），jina_reader 比 bb-browser 更轻量：

```
# 使用 pi 的 jina_reader 工具
jina_reader https://example.com/article
```

#### 5. 定期重启 daemon

建议每隔 **2-3 小时**或感觉操作变慢时重启一次：

```bash
# 一键重启
bb-browser daemon stop && sleep 1 && bb-browser daemon start
```

### 进阶配置

#### 1. 检查网络请求状态

当感觉卡顿时，先检查各标签页的健康状况：

```bash
# 查看所有标签页
bb-browser tab list

# 检查指定标签页的网络请求
bb-browser network requests --tab <tabId>

# 统计失败请求数
bb-browser network requests --tab <tabId> | grep -cE '(FAILED|状态: [45][0-9]{2})'
```

如果失败请求超过 10 个，建议关闭该标签页。

#### 2. 关注版本更新

```bash
# 查看当前版本
bb-browser --version

# 检查最新版本
npm view bb-browser version

# 更新到最新
npm update -g bb-browser
```

当前最新版本为 0.14.2，保持更新可以获得 bug 修复和性能改进。

#### 3. 监控 Chrome 资源占用

```bash
# 查看 Chrome 内存占用
ps aux | grep chrome | grep -v grep | awk '{sum+=$6} END {printf "Chrome RSS: %.0f MB\n", sum/1024}'

# 查看 daemon 状态
bb-browser daemon status
```

如果 Chrome 内存占用超过 2GB，建议重启 daemon。

## 排查流程图

当你遇到 bb-browser 卡顿或 404 时，按以下顺序排查：

```
1. bb-browser daemon status
   ├── Daemon 未运行 → bb-browser daemon start
   └── CDP 未连接 → 检查 Chrome 是否运行，检查 CDP 端口（默认 9222）

2. bb-browser tab list
   ├── 标签页过多 → 关闭不需要的标签页
   └── 查看页面 URL → 是否加载了大型 SPA？

3. bb-browser network requests --tab <tabId>
   ├── 失败请求 > 10 → 关闭该标签页，重新打开
   └── 有 pending 请求 → 等待或关闭标签页

4. Chrome 运行时间
   ├── > 2 小时 → 建议重启 daemon
   └── 内存 > 2GB → 建议重启 daemon

5. 还是卡？
   ├── bb-browser daemon stop && sleep 1 && bb-browser daemon start
   └── 改用 site adapter 或 jina_reader
```

## 总结

bb-browser 是一个非常强大的工具，它让你用真实浏览器的登录态来获取信息和操作页面。但在使用过程中需要注意几个关键点：

| 要点 | 说明 |
|------|------|
| **Tab 管理** | 用完即关，避免累积坏请求 |
| **使用 site adapter** | 轻量高效，避免加载完整页面 |
| **定期重启** | 2-3 小时重启一次 daemon |
| **优先用 eval** | 直接执行 JS，不依赖 DOM snapshot |
| **监控健康** | 定期检查网络请求状态和内存 |

记住一个原则：**bb-browser 适合"操作"而非"浏览"**。如果要浏览内容，用 `jina_reader` 或 `fetch_content`；如果要操作页面（点击、填写、登录），再用 bb-browser。

这样分工配合，才能发挥每个工具的最大价值。
