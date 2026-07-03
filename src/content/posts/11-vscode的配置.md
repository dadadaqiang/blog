---
title: "vscode的配置"
description: "最后用上了vscode,把编辑器，终端，解释器啥的都集成到一块，用起来实在是香啊。"
date: 2020-05-15T00:00:00.000Z
tags: ["编辑器"]
---

之前干活习惯了分开用工具，编辑用sublime,远程用putty,用本地终端powershell来运行git以及Python之类的，实在繁琐。

最后用上了vscode,把编辑器，终端，解释器啥的都集成到一块，用起来实在是香啊。

做了一些简单的配置如下：

1. Markdown

- 中文

设置成中文需要安装插件，搜索Chinese Language插件即可。

- 自动保存

自动保存在setting里面设置。

在离开编辑的时候保存，那就选择onfocuschange。

延迟多少毫秒之后保存，那就选择delay。

- 实时预览

快捷键 ctrl+k,然后按v。

2. git

因为习惯敲命令，所以就没有配置太多git按钮。

系统环境变量设置好git的路径之后，vscode打开终端就能用了。

3. ssh

远程连接服务器需要安装remote ssh插件。

安装之后左侧会出现一个电脑标志，点击"+"就能新建一个远程host,按照提示配置config文档就ok。

config文档：

```
Host 主机名
 HostName 主机IP
 User 登录用户
```