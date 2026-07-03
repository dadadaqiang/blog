---
title: "LAN Transfer — 在局域网内像聊天一样传文件"
description: "> 零配置、跨平台、实时 — 在局域网内像聊天一样传文件"
date: 2026-06-25T00:00:00.000Z
tags: ["局域网","文件传输","工具"]
---

## LAN Transfer · 局域网传输工具

> 零配置、跨平台、实时 — 在局域网内像聊天一样传文件

* * *

## 为什么需要它？

在日常工作中，我经常遇到这样的场景：

*   **WSL 开发环境**里跑着服务，但需要把文件传给 Windows 桌面或手机
*   **办公室局域网**内，同事之间互传文档，不想用微信（压缩画质、限制大小）
*   **跨设备**传文本片段（代码、链接、通知内容），懒得掏数据线

市面上当然有各种解决方案：微信、QQ、AirDrop、SMB 共享、Python `http.server`……但它们要么需要登录、要么步骤繁琐、要么只能在苹果生态里用。

于是我用一个周末做了 **LAN Transfer** — 一个极简的局域网传输工具。

* * *

## 功能概览

*   ✅ **文字传输** — 发送任意文本，支持多行，一键复制
*   ✅ **文件传输** — 拖拽或点击选择，自动上传
*   ✅ **图片预览** — 图片文件自动生成缩略图，点击放大
*   ✅ **实时推送** — WebSocket 实时推送，新消息即时出现
*   ✅ **传输记录** — 持久化保存，刷新页面不丢失
*   ✅ **深色主题** — 原生暗色 UI，护眼且美观
*   ✅ **零依赖部署** — 仅需 Node.js，一条命令启动

* * *

## 技术栈

层

技术

后端

Node.js HTTP Server + WebSocket (ws)

前端

原生 HTML/CSS/JS（无框架）

实时通信

WebSocket（事件推送）

数据持久化

JSON 文件存储

端口转发

netsh（Windows → WSL 转发）

> 特意选择了零框架方案 — 一个 `server.js` + 一个 `index.html`，没有构建工具、没有 npm run build，拿到就能用。

* * *

## 快速开始

```
# 克隆或下载项目后
cd lan-transfer
npm install
npm start
```

启动后你会看到：

```
✅ 局域网传输服务已启动

🌐 本机访问:   http://localhost:3000
📡 局域网访问: http://192.168.1.100:3000
```

在同一个局域网内的手机、平板、其他电脑上打开 **局域网访问** 地址即可使用。

* * *

## 设计细节

### 双通道消息模型

消息分两种类型：

1.  **文本消息** — 直接 POST 提交，存入 JSON，推送到所有连接
2.  **文件消息** — multipart 上传，以 UUID 重命名存储在 `uploads/` 目录，自动推导 MIME 类型

每个消息包含唯一 ID、类型、时间戳，前端根据类型渲染不同的 UI。

### 实时推送

使用 WebSocket 实现三个事件的实时推送：

```
// 新消息
{ event: 'new', message: { id, type, content|filename, time } }

// 删除消息
{ event: 'delete', id: 'xxx' }

// 清空所有
{ event: 'clear' }
```

所有已连接的客户端会即时同步，无需手动刷新。

### WSL 端口转发

当运行在 WSL 中时，`start.sh` 会自动调用 Windows 的 `netsh interface portproxy` 配置端口转发，让局域网设备可以直接通过 Windows 的 IP 访问 WSL 里的服务。

还配合 `setup-portforward.bat` / `cleanup-portforward.bat` / `cleanup.sh` 方便管理转发规则。

### 前端交互细节

*   **拖拽上传** — 支持拖拽文件到页面任意位置
*   **Ctrl+Enter 发送** — 键盘快捷键，和微信一样顺手
*   **复制反馈** — 点击复制后显示"已复制!"动画
*   **图片放大** — 点击缩略图打开暗色模态框
*   **深色主题** — CSS 变量驱动，全程无框架纯原生

* * *

## 真实使用场景

我在学校办公室用这个工具来：

1.  把 Windows 桌面上的 **论文通知文件**（PDF、Word 文档）快速传到手机
2.  在同事之间 **分享文本通知** — 复制粘贴到页面，发送后大家都能看到
3.  WSL 开发环境生成的 **报表、截图**，直接浏览器拖拽上传到 Windows 桌面

* * *

## 项目结构

```
lan-transfer/
├── server.js                 # HTTP + WebSocket 服务端
├── index.html                # 前端页面（单页应用）
├── package.json              # 依赖配置
├── start.sh                  # WSL 一键启动（含端口转发）
├── setup-portforward.bat     # Windows 手动配置端口转发
├── cleanup-portforward.bat   # Windows 清理端口转发
├── cleanup.sh                # WSL 清理端口转发
├── uploads/                  # 上传文件存储目录
└── messages.json             # 消息持久化存储
```

* * *

## 总结

LAN Transfer 不是什么惊天动地的项目，但它解决了一个非常具体的痛点：**局域网内快速传东西**。

它的设计哲学是：

1.  **零学习成本** — 打开浏览器就能用
2.  **零依赖** — 一个 Node.js 文件 + 一个 HTML 文件
3.  **即时反馈** — WebSocket 实时推送
4.  **隐私优先** — 数据只存在本地局域网，不上云

如果你也有跨设备传文件的需求，不妨试试 — 或者直接 fork 改成你想要的版本。