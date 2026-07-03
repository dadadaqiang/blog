---
title: "Hugo添加使用图片资源"
description: "如果是用网络上的图片，只要添加网络上的图片链接地址就可以了。"
date: 2020-05-17T00:00:00.000Z
tags: ["Hugo","markdown"]
---

Hugo搭建好博客之后，markdown里怎么把图片资源添加到hugo中？

## 使用网络资源

如果是用网络上的图片，只要添加网络上的图片链接地址就可以了。

markdown的写法：

```
![unsplash上的一张图](https://images.unsplash.com/photo-1524397057410-1e775ed476f3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=750&q=80)
```

当然，你可以搭建自己的图床，有图片的网络链接就可以。

## 使用本地图片资源

当然你也可以直接用自己电脑上的图片。

先把你需要用的图片放到Hugo生成目录下的static

然后markdown的写法，是以static为根目录：

```
![放置图片的位置](/markdown的图片/图片.PNG)
```

**原理**

原理这篇博客有介绍:[Hugo中添加并使用图片资源](https://courage007.github.io/hugo-use-notes/01hugo%E4%B8%AD%E6%B7%BB%E5%8A%A0%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/hugo%E4%B8%AD%E6%B7%BB%E5%8A%A0%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/)

Hugo生成页面的时候，会做以下事情：

1. 获取主题资源，复制theme/static/* 到 public/
2. 获取你自己添加的资源，复制static/* 到 public/
3. 遍历content下文件，获取文件头信息，把markdown转换成html
4. 渲染，包括正文页面，列表页面，分类页面，主页等等。