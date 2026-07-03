---
title: "Hugo建立博客"
description: "官方的教程:[点击这里](https://gohugo.io/getting-started/quick-start/)"
date: 2020-05-13T00:00:00.000Z
tags: ["hugo"]
---

初次接触hugo，一头雾水。折腾一下午，才摸索出一丢丢。

官方的教程:[点击这里](https://gohugo.io/getting-started/quick-start/)

第一步：到Hugo的官网下载hugo。

我的是windows系统，下载windows的zip压缩包，解压后配置好环境变量就完事。

然后建立一个博客的主目录，打开powershell或者cmd敲命令就可以了：

```sh
hugo new site your-blog-name
```

第二步：安装主题。

Hugo最难的地方在于安装主题theme。

每个主题的配置都有差异，加上主题的安装文档写得及其简陋，自己折腾的经验如下：

1. 下载主题。

主题用git或者直接下载zip包都可以。

下载好放到博客目录里的themes目录里。

2. exampleSite目录是关键

下载好的主题里，一般都会有一个exampleSite目录，这个目录是示范的配置来的。

有一些主题，直接把exampleSite里面的文件全部复制粘贴到博客的主目录就完成配置了。

但另外一些，只需要复制里面的toml文件到博客主目录就行了。

具体得看文档。

3. 关于toml和yaml

配置文件的格式主要是toml和yaml，还有json的。

这两种格式区别，这个视频讲得很清楚：[点击这里](https://gohugo.io/content-management/front-matter/)

4. 怎么生成静态文件

为了把博客部署到VPS或者github Page 需要生成博客的静态文件，也就是html/css/js 三大件。