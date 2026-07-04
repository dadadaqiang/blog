---
title: "WSL2 开发环境优化记：从 relay 地狱到直连自由"
description: "记录如何将 WSL2 开发环境从 Python relay + 代理隧道的复杂链路，升级到 WSLg + 本地 Chrome 直连的简洁方案"
date: 2026-07-04T00:00:00.000Z
tags: ["WSL2", "bb-browser", "Chrome", "WSLg", "开发环境"]
---

## 一、引言：WSL2 的甜蜜与痛苦

WSL2 自诞生以来就被称为"Windows 上最美的 Linux"——真正 Linux 内核、Docker 原生支持、apt 生态完整……对于像我这样在 Windows 上用 AI 开发工具的人来说，它几乎是必需品。

但用了一段时间后，我开始感受到一种说不清的别扭：**WSL2 终究是台虚拟机**。

具体表现是：

- **网络不通**：WSL 的 `localhost` 和 Windows 的 `localhost` 不是同一个，想从 WSL 里访问 Windows 上跑的服务，必须绕路。
- **进程隔离**：WSL 里不能直接调用 Windows 程序，反过来也一样。
- **文件系统慢**：`/mnt/c` 访问 Windows 文件，跨 OS 读写性能感人。

我的日常操作链是这样的：

1. Windows 端跑 Chrome，开 `--remote-debugging-port=9222` 暴露 CDP 接口
2. WSL 端用 Python 写了个 relay 脚本，监听 `127.0.0.1:19222`，通过 Clash 代理隧道转发到 Windows Chrome 的 CDP 端口
3. bb-browser 连接 relay，才能操作 Windows Chrome

三步启动、两个脚本、动态获取 Windows IP……每次开机都要手动跑，偶尔哪步出错，整个链路就断了。

**这个过程太烦了。**

## 二、问题拆解：relay 到底在干什么

我现在的架构是这样的：

```bash
# 启动顺序
1. ~/start-bb.bat        # Windows 端：启动 Chrome with CDP
2. ~/start-cdp-relay.sh  # WSL 端：启动 Python 中继
3. ~/start-bb-browser.sh # WSL 端：bb-browser 连接 relay
```

背后的原理是：

```
bb-browser (WSL) → relay.py (:19222) → Clash 代理 (:10808) → Chrome CDP (:9222)
```

**为什么不能直连？**

WSL2 是 Hyper-V 虚拟机，有独立的网络栈。WSL 里的 `localhost:9222` 指的是 WSL 自己的 9222 端口，不是 Windows 那个。所以必须通过某种"桥接"机制把请求转发到 Windows 的 Chrome。

relay 脚本的工作方式是：

1. WSL 端监听 `127.0.0.1:19222`
2. 有人连 19222 时，连到 Windows 的 Clash 代理（`192.168.128.1:10808`）
3. 通过代理发 `CONNECT` 命令，让代理隧道转发到 Windows 的 `localhost:9222`
4. 数据双向转发

这个 relay 不是多余的——它同时解决了两个问题：

- WSL 不知道 Windows 的真实 IP（`host.docker.internal` 不可用）
- Chrome CDP 只绑定 `127.0.0.1`，从外网来的连接会被拒绝

**一条 4 跳链路，每跳都是潜在故障点。**

## 三、探索过的解决方案

### 方案 1：host.docker.internal

WSL2 有个多播 DNS 解析器，理论上可以把 `host.docker.internal` 解析到 Windows 主机 IP。

但在我的 WSL 环境（内核 5.10.16.3，2021 年的）中，这个解析不存在。

手动加 hosts 也不行——Chrome CDP 只绑 `localhost`，从外网 IP 连上来会被拒绝。

### 方案 2：Mirrored 网络模式

Windows 11 22H2+ 支持 WSL2 镜像网络模式，WSL 和 Windows 共享同一个网络栈，`localhost` 互通。

```ini
# %USERPROFILE%\.wslconfig
[wsl2]
networkingMode=mirrored
```

这个方案很美好，但有两个前提：

1. **需要 Windows 11**（我是 Windows 10）
2. **只解决了网络层**，进程和文件系统仍然隔离

而且——我根本不想为了用 WSL 去重装系统。

### 方案 3：WSL 内装 Chrome（最终方案）

WSLg 是 WSL2 的 GUI 支持组件，可以让 Linux GUI 程序直接显示在 Windows 桌面上。

如果我在 WSL 里装一个 Chrome，它的 CDP 端口就在 WSL 内部，bb-browser 直接连 `localhost:9222` 就行了——不需要 relay、不需要代理隧道、不需要动态 IP。

**Chrome 从"Windows 那边的程序"变成"WSL 这边的程序"，网络隔离问题直接消失。**

但这个方案有一个前提：WSLg 得能用。

## 四、最终方案：三步改造

### 第一步：更新 WSL 内核

原来的内核版本是 **5.10.16.3**（2021 年），太老了，WSLg 都没有。

```bash
# PowerShell（管理员）运行
wsl --update --web-download
wsl --shutdown
# 重新打开 WSL
uname -r  # 应该显示 6.18.x
```

从 5.10 → 6.18，内核大升级，WSLg 也跟着可用。

### 第二步：WSL 内安装 Chrome

```bash
# 安装 Chrome（带依赖自动修复）
wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i /tmp/chrome.deb || sudo apt install -f -y
rm /tmp/chrome.deb

# 安装中文字体（否则 Chrome 里中文乱码）
sudo apt install -y fonts-noto-cjk
```

安装中文字体这一步很关键——WSL 默认没有 CJK 字体，装了 Chrome 后中文会显示成方块。`fonts-noto-cjk` 解决了这个问题。

### 第三步：配置 bb-browser 直连

```bash
# 启动 Chrome（带 CDP）
mkdir -p ~/.chrome-data
google-chrome-stable --remote-debugging-port=9222 --user-data-dir=~/.chrome-data &

# 启动 bb-browser daemon（直连 localhost，不需要 relay）
BB_BROWSER_CDP_URL=http://127.0.0.1:9222 bb-browser daemon start --no-chrome
```

**搞定。三条命令，都在 WSL 内部完成，没有跨 VM 通信。**

启动后会弹出一个 Chrome 窗口（WSLg 投射到 Windows 桌面上），用鼠标登录你需要的站点就行。`~/.chrome-data` 目录会保存登录态，下次启动还在。

## 五、效果对比

| 项目 | 改造前 | 改造后 |
|------|--------|--------|
| WSL 内核 | 5.10 (2021) | 6.18 |
| WSLg | 不可用 | 可用 |
| Chrome 位置 | Windows 端 | WSL 内（窗口投射到桌面） |
| CDP 连接 | relay → 代理隧道 → Windows Chrome | 直连 localhost:9222 |
| 启动步骤 | 3 条命令 + 手动启动 relay | 1 条命令 |
| 中文显示 | — | Noto CJK 正常显示 |
| 依赖项 | Python relay 脚本、代理隧道、动态 IP | 无 |

**以前的启动流程：**

```
打开 Windows Terminal
→ 跑 start-bb.bat（启动 Chrome）
→ 跑 start-cdp-relay.sh（启动 Python relay）
→ 跑 start-bb-browser.sh（启动 daemon）
→ 偶尔某步出错，排查半天
```

**现在的启动流程：**

```
打开 WSL
→ 跑一条启动脚本（或者直接告诉 pi "帮我启动 Chrome"）
→ 搞定
```

## 六、如果再来一次：各种方案的适用场景

| 你的环境 | 推荐方案 |
|---------|---------|
| Windows 11 | Mirrored 网络模式 + WSLg，一步到位 |
| Windows 10（像我一样） | WSL 更新 + WSLg + WSL 内装软件 |
| 不需要 GUI | headless Chrome + bb-browser，更轻量 |
| 重度 Windows 办公 + 开发 | 双机方案更省心（Linux 开发机 + Windows 办公机） |
| 想彻底告别 WSL | 纯 Linux 双系统或 Mac |

## 七、总结

**WSL2 不是原罪，老版本才是。**

很多"WSL 不好用"的抱怨，来源是：

1. 用了 2021 年的内核，WSLg 都没有
2. 习惯了手动启动服务，没做成自动化
3. 不知道 WSL 内可以装 Chrome

2024/2025 年的 WSL 已经有了巨大改进——WSLg 让 GUI 应用成为可能，内核更新到 6.x，性能和兼容性都好很多。

**关键教训：先 `wsl --update` 再吐槽。**

---

## 附录：常用命令速查

```bash
# 更新 WSL（PowerShell 管理员）
wsl --update --web-download

# 查看内核版本
uname -r

# 启动 Chrome（WSL 内）
google-chrome-stable --remote-debugging-port=9222 --user-data-dir=~/.chrome-data &

# 启动 bb-browser daemon
BB_BROWSER_CDP_URL=http://127.0.0.1:9222 bb-browser daemon start --no-chrome

# 验证 CDP 连接
curl -s http://localhost:9222/json/version | python3 -c "import sys,json; print(json.load(sys.stdin)['Browser'])"
```

## 附录：我的完整启动脚本

```bash
#!/bin/bash
# ~/start-pi-chrome.sh
# 一键启动 Chrome + bb-browser

# 杀掉旧进程
pkill -9 -f google-chrome 2>/dev/null
pkill -9 -f bb-browser 2>/dev/null
sleep 2

# 启动 Chrome
mkdir -p ~/.chrome-data
google-chrome-stable --remote-debugging-port=9222 --user-data-dir=~/.chrome-data &
sleep 3

# 启动 bb-browser
BB_BROWSER_CDP_URL=http://127.0.0.1:9222 bb-browser daemon start --no-chrome

echo "✅ Chrome + bb-browser 已启动"
```
