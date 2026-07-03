---
title: "在 WSL2 中连接宿主机 Windows Chrome 调试端口——兼谈 HTTP 代理下的网络调试"
description: "记录如何在 WSL2（HTTP 代理环境）中通过 CDP 连接宿主机 Windows Chrome，并保留现有登录态的完整踩坑与解决方案"
date: 2026-06-12T00:00:00.000Z
tags: ["WSL2","Chrome","CDP","bb-browser","proxy","debugging"]
---

## 背景

[bb-browser](https://github.com/epiral/bb-sites) 是一个浏览器自动化与信息获取工具，支持用 Site Adapter 从 36+ 平台（GitHub、Twitter、知乎等）提取结构化数据。它的核心是通过 **Chrome DevTools Protocol (CDP)** 连接一个真实的 Chrome 浏览器，利用现有登录态执行操作。

我的环境比较特殊：

| 环境 | 详情 |
|------|------|
| 宿主机 | Windows 11 |
| WSL | WSL2 Ubuntu（独立虚拟机，`127.0.0.1` 指向 WSL 自身而非 Windows） |
| 网络 | HTTP 代理 `172.28.32.1:8889`（Windows 上的代理客户端） |
| Chrome | 宿主机的 Windows Chrome |

理想流程很简单：WSL 里的 bb-browser → CDP → Windows Chrome → 利用登录态。但实际跑起来，每一步都是坑。

---

## 问题一览

1. **WSL2 是独立虚拟机** → 不能 `127.0.0.1:9222` 直连 Windows Chrome
2. **HTTP 代理环境** → Node.js 原生 `fetch()` 不识别 `http_proxy` 环境变量
3. **Chrome 调试端口只监听 IPv6** → `[::1]:9222`，IPv4 的 `127.0.0.1:9222` 连不上
4. **Windows 防火墙** → 阻止 WSL 直连 9222 端口
5. **`taskkill /F` 丢失登录态** → 会话 Cookie 被销毁
6. **Chrome 拒绝用默认配置文件启动调试端口** → `--remote-debugging-port` 要求 `--user-data-dir` 指向非默认路径
7. **WSL 网络会变** → WSL2 每次重启，虚拟网卡的 IP 地址都可能不一样

---

## 架构方案

最终采用的方案：

```
┌─────────────────────────────────────────────────────────────────┐
│  WSL2 Ubuntu                                                    │
│                                                                 │
│  bb-browser CLI ←→ bb-browser-daemon (Node.js, port 19824)     │
│                          ↑                                      │
│                    CDP over WebSocket                            │
│                          ↑                                      │
│                    Python Relay (port 19222)                     │
│                          ↑                                      │
│              HTTP CONNECT tunnel through proxy                  │
├──────────────────────────┼──────────────────────────────────────┤
│                          │ HTTP Proxy 172.28.32.1:8889          │
│                          │ (Windows 上的代理客户端)              │
├──────────────────────────┼──────────────────────────────────────┤
│  Windows 11               │                                      │
│                          ↓                                      │
│                    Chrome DevTools (port 9222, [::1])           │
│                          │                                      │
│                    Chrome Browser (登录态保留)                  │
└─────────────────────────────────────────────────────────────────┘
```

### 各组件职责

| 组件 | 角色 | 位置 |
|------|------|------|
| **Windows Chrome** | 提供 CDP 接口 + 登录态 | Windows |
| **Python CDP Relay** | 通过 HTTP CONNECT 隧道转发 CDP 流量 | WSL |
| **bb-browser-daemon** | 管理标签页、执行 CDP 命令 | WSL |
| **HTTP Proxy** | 转发 WSL → Windows 的 TCP 连接 | Windows |

---

## 踩坑记录

### 坑 1：WSL2 不能直连 Windows 端口

WSL2 是独立虚拟机，`127.0.0.1` 是 WSL 自己的环回地址。Windows 宿主机的地址可以通过 `cat /etc/resolv.conf` 找到（通常是 `172.x.x.1` 格式），但这个 IP 会在 WSL 重启后变化。

而且 Windows 防火墙默认阻止 WSL 直连 9222 端口。

**解决**：通过 HTTP 代理的 CONNECT 方法建立隧道，代理本身在 Windows 上，可以访问 `[::1]:9222`。

### 坑 2：Node.js fetch 不走代理

bb-browser-daemon 用 Node.js 的 fetch 连接 CDP 端口。但 Node.js 的 `fetch()` **不识别** `http_proxy`、`https_proxy`、`no_proxy` 这些环境变量——这是 Node.js 原生 fetch 和 `curl`/Python `requests` 的重要区别。

**解决**：用 Python 写一个 TCP 中继，Python 的 socket 可以显式通过 HTTP CONNECT 建立隧道，不依赖 Node.js 的代理设置。

### 坑 3：Chrome 调试端口只监听 IPv6

Chrome 用 `--remote-debugging-port=9222` 启动后，调试服务器监听在 `[::1]:9222`（IPv6 环回），而不是 `127.0.0.1:9222`（IPv4 环回）。

```
# 看到的是 IPv6
netstat -ano | findstr 9222
# TCP    [::1]:9222              [::]:0                 LISTENING       12536
```

这意味着通过代理 CONNECT 到 `127.0.0.1:9222` 是连不上的，必须 CONNECT 到 `[::1]:9222`。

### 坑 4：Chrome 拒绝用默认配置文件路径

`--remote-debugging-port` 有个硬性要求：

```
DevTools remote debugging requires a non-default data directory. Specify this using --user-data-dir.
```

即使显式指定了 Chrome 的默认配置路径 `C:\Users\w\AppData\Local\Google\Chrome\User Data`，它仍然拒绝。必须指向**非默认路径**。

**解决**：用 Windows 的 **Junction（目录链接）** 创建一个别名路径：

```
# 创建一个目录链接，指向原配置
New-Item -ItemType Junction -Path "C:\Users\w\.bb-chrome-profile" `
         -Target "C:\Users\w\AppData\Local\Google\Chrome\User Data"
```

这样 Chrome 看到的是"非默认路径"，但实际读写的是原配置文件。加密密钥、Cookie、登录态全部保留。

### 坑 5：强杀 Chrome 丢失会话 Cookie

之前用 `taskkill /F` 关 Chrome，再重新以调试模式启动。但 `/F` 是强制杀进程，Chrome 没机会把**会话级别的 Cookie**写回磁盘。大部分网站的登录态用的就是会话 Cookie，一杀就没了。

**解决**：不再强杀 Chrome。日常用桌面快捷方式正常关闭再启动，会话 Cookie 能正常持久化。

### 坑 6：Python `exit(0)` 在 `try/except` 中的陷阱

检测 Chrome 是否在线的脚本函数里，用了一个 `try/except` 包裹所有逻辑。在成功分支用了 `exit(0)`——但 Python 的 `exit()` 会抛出 `SystemExit` 异常，被 `except: pass` 静默吞掉，然后程序继续执行到 `exit(1)`，返回"失败"退出码。

```
# 错误写法：exit(0) 永远不会生效
try:
    # ... 连接 Chrome
    if data: print('OK'); exit(0)  # ← 这里抛 SystemExit
except: pass  # ← 被吞了
exit(1)       # ← 永远走到这里
```

**解决**：用 `os._exit(0)` 强制退出，不抛异常；或者用状态变量控制退出码：

```
import os
ok = False
try:
    # ... 连接 Chrome
    if data: ok = True
except: pass
if ok: print('OK', flush=True); os._exit(0)
os._exit(1)
```

### 坑 7：WSL2 网络变化

WSL2 每次重启（包括 Windows 重启后），虚拟网卡的 IP 都可能变化。硬编码的代理地址 `172.31.128.1:8889` 在下次开机可能就变成了 `172.28.32.1:8889`。

**解决**：从环境变量 `$HTTP_PROXY` / `$http_proxy` 动态读取代理地址。

---

## 最终代码

### 1. Windows 桌面快捷方式：`Chrome-Debug.bat`

```
@echo off
echo Starting Chrome with remote debugging (port 9222)...
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="1\Users\w\.bb-chrome-profile" ^
  --no-first-run
```

### 2. Python CDP Relay，`/tmp/cdp-relay.py`

```python
#!/usr/bin/env python3
"""
CDP Relay: Listens on 127.0.0.1:19222 in WSL and forwards to Windows Chrome
via the HTTP proxy. Uses CONNECT method through the proxy to reach
Chrome's CDP port.
"""
import socket, select, sys, threading, os

def _proxy_cfg():
    p = os.environ.get('HTTP_PROXY') or os.environ.get('http_proxy') or 'http://172.28.32.1:8889'
    p = p.replace('http://', '').replace('https://', '')
    p = p.replace('socks5://', '').replace('socks5h://', '')
    if ':' in p:
        host, port = p.rsplit(':', 1)
        return host, int(port)
    return p, 8889

PROXY_HOST, PROXY_PORT = _proxy_cfg()
TARGET_HOST = "[::1]"
TARGET_PORT = 9222
LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 19222

def forward(src, dst):
    try:
        while True:
            r, _, _ = select.select([src, dst], [], [], 1)
            if r:
                data = r[0].recv(4096)
                if not data:
                    break
                r[1].sendall(data)
    except: pass

def handle_client(client):
    try:
        proxy = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        proxy.settimeout(10)
        proxy.connect((PROXY_HOST, PROXY_PORT))
        # HTTP CONNECT tunnel
        proxy.sendall(f"CONNECT {TARGET_HOST}:{TARGET_PORT} HTTP/1.1\r\n"
                      f"Host: {TARGET_HOST}:{TARGET_PORT}\r\n\r\n".encode())
        resp = b""
        while b"\r\n\r\n" not in resp:
            chunk = proxy.recv(4096)
            if not chunk: break
            resp += chunk
        if b"200" not in resp:
            client.close()
            proxy.close()
            return
        t1 = threading.Thread(target=forward, args=(client, proxy), daemon=True)
        t2 = threading.Thread(target=forward, args=(proxy, client), daemon=True)
        t1.start(); t2.start()
        t1.join(); t2.join()
    except: pass
    finally:
        try: client.close()
        except: pass
        try: proxy.close()
        except: pass

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEAEDDR, 1)
    server.bind((LISTEN_HOST, LISTEN_PORT))
    server.listen(10)
    print(f"CDP Relay listening on {LISTEN_HOST}:{LISTEN_PORT}")
    print(f"Forwarding via proxy {PROXY_HOST}:{PROXY_PORT} to {TARGET_HOST}:{TARGET_PORT}")
    while True:
        client, _ = server.accept()
        threading.Thread(target=handle_client, args=(client,), daemon=True).start()

if __name__ == "__main__":
    main()
```

### 3. WSL 启动脚本：`~/start-bb-wsl.sh`

```bash
#!/bin/bash
# source ~/start-bb-wsl.sh
#
# WSL → Windows Chrome CDP 启动脚本
# 自动检测代理地址、启动 relay + daemon

CHROME_DEBUG_PORT="${CHROME_DEBUG_PORT-:-9222}"
CHROME_USER_DATA="${CHROME_USER_DATA:-C:\Users\w\.bb-chrome-profile}"
CHROME_EXE="${CHROME_EXE:-C:\Program Files\Google\Chrome\Application\chrome.exe}"
RELAY_LISTEN_PORT=19222

# 从环境变量读取代理（自动适配 WSL 网络变化）
_proxy="${HTTP_PROXY:-${http_proxy:-http://172.28.32.1:8889}}"
PROXY_HOST="${_proxy#*://}"; PROXY_HOST="${PROXY_HOST%:*}"
PROXY_PORT="${_proxy##*:}"; PROXY_PORT="${PROXY_PORT%%[^0-9]*}"
if [ -z "$PROXY_HOST" ] || ! echo "$PROXY_PORT" | grep -qE '^[0-9]+$'; then
    PROXY_HOST="172.28.32.1"; PROXY_PORT=8889
fi
CHROME_HOST="[::1]"

export BB_BROWSER_CDP_URL="http://127.0.0.1:${RELAY_LISTEN_PORT}"
export no_proxy="$no_proxy,${PROXY_HOST}"

# ---------- 检测函数 ----------
check_chrome_cdp() {
  local host="${1:-$CHROME_HOST}" port="${2:-$CHROME_DEBUG_PORT}"
  python3 -c "
import socket, time, os
ok=False
try:
    s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
    s.settimeout(3)
    s.connect(('$PROXY_HOST',$PROXY_PORT))
    s.sendall(b'CONNECT $host:$port HTTP/1.1\r\nHost: $host:$port\r\n\r\n')
    resp=b''
    while b'\r\n\r\n' not in resp:
        chunk=s.recv(1024)
        if not chunk: break
        resp+=chunk
    if b'200' in resp:
        s.sendall(b'GET /json/version HTTP/1.1\r\nHost: $host:$port\r\nConnection: close\r\n\r\n')
        time.sleep(0.5); data=b''
        s.settimeout(1)
        try:
            while True:
                chunk=s.recv(4096)
                if not chunk: break
                data+=chunk
        except: pass
        if data: ok=True
    s.close()
except: pass
if ok: print('OK',flush=True); os._exit(0)
os._exit(1)
" 2>/dev/null
}

echo "① 检测 Windows Chrome 调试实例..."
if check_chrome_cdp "$CHROME_HOST" "$CHROME_DEBUG_PORT"; then
    echo "   ✅ 发现调试 Chrome ${CHROME_HOST}:${CHROME_DEBUG_PORT}"
    CHROME_FOUND=true
else
    # fallback: 启动 Chrome（略，见完整脚本）
    :
fi

echo "② 清理 WSL 侧旧进程..."
# kill relay + daemon...

echo "③ 启动 CDP Relay..."
(python3 /tmp/cdp-relay.py > /tmp/cdr-relay.log 2>&! &)

echo "④ 启动 bb-browser-daemon..."
(bb-browser-daemon --cdp-host 127.0.0.1 --cdp-port $RELAY_LISTEN_PORT --no-chrome &)

echo "⑤ 验证..."
bb-browser daemon status | grep -q "running" && echo "✅ 启动成功"

# 自动创建标签页
curl -s -X PUT "http://127.0.0.1:${RELAY_LISTEN_PORT}/json/new" > /dev/null 2>&1
```

> 完整脚本见附录，或直接在 WSL 中 `cat ~/start-bb-wsl.sh`。

---

## 使用流程

### 一次性设置

```
# Windows PowerShell（管理员）
# 1. 创建 Chrome 配置的目录链接
New-Item -ItemType Junction -Path "C:\Users\w\.bb-chrome-profile" `
         -Target "C:\Users\w\AppData\Local\Google\Chrome\User Data"

# 2. 把 Chrome-Debug.bat 放到桌面
```

### 日常使用

```
 ┌─────────────────────────────────────────────────────┐
 │  1. 关掉所有 Chrome 窗口                             │
 │  2. Windows 双击桌面 Chrome-Debug.bat                │
 │     → Chrome 以调试模式启动                          │
 │     → 如果显示"谁在使用 Chrome"页面，点一下头像       │
 │                                                      │
 │  3. WSL 执行：                                       │
 │     source ~/start-bb-wsl.sh                        │
 │     → 自动检测调试端口、启动中继、启动 daemon        │
 │     → 显示 ✅ 启动成功                               │
 │                                                      │
 │  4. 使用 bb-browser                                  │
 │     bb-browser tab list                              │
 │     bb-browser open https://github.com               │
 │     bb-browser site github/repo torvalds/linux       │
 └─────────────────────────────────────────────────────┘
```

---

## 为什么不用更简单的方法

| 方法 | 为什么不行 |
|------|-----------|
| `netsh interface portproxy` | Chrome 新版只监听 IPv6 `[::1]:9222`，portproxy v4tov4 不匹配 |
| WSL 里装 Chrome | 缺少系统库依赖，且需要 sudo（用户无密码） |
| 复制 Chrome 配置文件 | 加密密钥不匹配，Google 账号 Token 无法解密 |
| 直接用 `start-bb.bat` 强杀重启 | 丢失会话 Cookie，每次都要重新登录 |

---

## 关键教训

1. **WSL2 的 `127.0.0.1` 是 WSL 自己的环回**，不是 Windows。Windows 的地址在 WSL 中是一个 172.x.x.x 的虚拟网卡 IP，且会变化。

2. **Node.js 原生 fetch 不走代理**。如果需要代理！要么用 `undici`/`node-fetch` 的 proxy 支持，要么用其他语言中转。

3. **Python `exit()` 会抛 `SystemExit`**，在 `try/except` 块里会被捕获。用 `os._exit()` 或者状态变量方式控制退出码。

4. **Chrome 的 `--remote-debugging-port` 要求非默认配置路径**。用 Junction（目录链接）可以在不改变原始文件的情况下满足这个要求。

5. **Windows Chrome 调试端口监听在 IPv6**。跨网络连接时需要特别注意地址格式 `[::1]:9222`。

6. **`taskkill /F` 丢失会话 Cookie**。尽量用正常关闭（`CloseMainWindow`）而不是强制杀进程。

---

## 附录：完整启动脚本

完整脚本见 WSL 中的 `/home/w/start-bb-wsl.sh`，Python 中继见 `/tmp/cdp-relay.py`。

> 如果你遇到类似的问题，欢迎在评论区交流。
> 2026-06-12 · [bb-browser](https://github.com/epiral/bb-sites)

### 相关阅读

- [构建 Halo Publish Tool：用 pi Agent 让 Markdown 一键发布到博客](/posts/halo-publish-tool/)
- [DownloadXBookmarks：无 API Key 的 X 书签导出扩展](/posts/downloadxbookmarks-extension/)
- [Halo Publish 工具优化：一次发布踩坑与修复实录](/posts/halo-publish-optimization/)