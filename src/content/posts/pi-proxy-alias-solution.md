---
title: "pi 代理连接问题：一个 alias 解决 WSL2 镜像模式下按需走代理"
description: "WSL2 镜像模式下 Windows 开启代理后 pi 连不上？不用改 settings.json，一个 alias 搞定按需走代理，退出自动恢复。"
date: 2026-07-11T00:00:00.000Z
tags: ["pi", "WSL2", "proxy", "网络"]
---

## 问题：WSL2 镜像模式 + 代理 = 连不上

我的开发环境是 **WSL2 Ubuntu（镜像模式）**，Windows 上开着 Clash 代理（端口 10808），WSL 和 Windows 共享网络，`127.0.0.1` 直通宿主机。

在这种配置下，终端里的 `curl`、`wget` 等工具都能正常走代理，但 [pi](https://pi.dev) 这个 AI 编程助手却连不上 API。

排查发现：**pi 没有自动检测系统代理**，它只有在你主动配置时才走代理。

---

## pi 的代理机制

翻了下 pi 的源码，核心逻辑在 [`http-dispatcher.ts`](https://github.com/badlogic/pi-coding-agent/blob/main/src/core/http-dispatcher.ts) 里：

```ts
export function applyHttpProxySettings(httpProxy: string | undefined): void {
    const proxy = httpProxy?.trim();
    if (!proxy) return;
    process.env.HTTP_PROXY ??= proxy;
    process.env.HTTPS_PROXY ??= proxy;
}
```

启动时，pi 会读取 `~/.pi/agent/settings.json` 中的 `httpProxy` 字段，如果配了就用 `undici.EnvHttpProxyAgent` 创建一个支持代理的 HTTP 分发器。

也就是说：

- settings.json 里 **没配** `httpProxy` → 直连
- 配了 → 所有 HTTP 请求走代理

官方文档（`docs/settings.md`）也有说明：

```json
{
  "httpProxy": "http://127.0.0.1:7890"
}
```

---

## 为什么不想配死在 settings 里？

如果直接把 `httpProxy` 写进 `~/.pi/agent/settings.json`，pi **每次启动都会走代理**。

但我的情况是：**有需要才开代理**，平时直连就行（有些 API 直连更快，而且代理偶尔会不稳定）。

我需要的是**按需启用**，不是全局固定。

---

## 方案对比

### 方案一：临时环境变量

```bash
$ HTTP_PROXY=http://127.0.0.1:10808 pi
```

这是最直接的方式——环境变量只对该条命令生效，退出 pi 自动恢复。但每次都要敲一长串，记端口也很烦。

### 方案二：export + unset

```bash
$ export HTTP_PROXY=http://127.0.0.1:10808
$ pi   # 走代理
$ unset HTTP_PROXY HTTPS_PROXY
```

比方案一更麻烦，还要手动清理。

### 方案三：Shell alias（最终选择）

```bash
alias pia='HTTP_PROXY=http://127.0.0.1:10808 HTTPS_PROXY=http://127.0.0.1:10808 pi'
```

加到 `~/.bashrc` 后：

- `pi` — 直连
- `pia` — 走代理（pi alias）

退出 pi 后自动恢复，不污染环境变量，不多记端口。

---

## 为什么环境变量方案能生效？

关键在 pi 的源码细节。`applyHttpProxySettings` 用的是 `??=`（空值合并赋值）：

```ts
process.env.HTTP_PROXY ??= proxy;   // 已有就不覆盖
process.env.HTTPS_PROXY ??= proxy;
```

所以如果启动前环境变量已经设好了，settings.json 里的值就被忽略。也就是说：

**环境变量优先级 > settings.json**

利用这个特性，alias 写法在启动 pi 前把代理信息通过环境变量注入，pi 启动时发现 `HTTP_PROXY` 已经存在，就不会用 settings.json 的值覆盖，而 `EnvHttpProxyAgent` 会自然读取环境变量来路由请求。

---

## 检查是否冲突

加 alias 前建议先检查有没有被占用：

```bash
$ type pia
bash: type: pia: not found   # 干净，可以用
```

---

## 完整操作

把下面这行加到 `~/.bashrc`（或 `~/.zshrc`）：

```bash
alias pia='HTTP_PROXY=http://127.0.0.1:10808 HTTPS_PROXY=http://127.0.0.1:10808 pi'
```

然后 `source ~/.bashrc` 或新开终端即可生效。

---

## 总结

| 方式 | 优点 | 缺点 |
|------|------|------|
| settings.json 配死 | 一劳永逸 | 每次启动都走代理 |
| 临时环境变量 | 按需，退出恢复 | 要记端口，容易打错 |
| **Shell alias** | **按需，零记忆成本** | **需要先加一行配置** |

Shell alias 是最适合"偶尔用代理"场景的方案——多打一个 `a` 字母，换来完全可控的代理开关。

---

*如果你也用 pi + WSL2 + Windows 代理，配好这个 alias 能省不少心。*
