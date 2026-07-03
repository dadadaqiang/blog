---
title: "Git部署Hugo博客"
description: "今天折腾部署又踩了一堆坑。"
date: 2020-05-15T00:00:00.000Z
tags: ["hugo","git"]
---

用Hugo建立好本地博客之后，自然而然想把生成的静态博客部署到VPS。

今天折腾部署又踩了一堆坑。

最主要的教训就是，切记不要用root用户直接操作。

因为用root用户操作rm,结果把系统的所有命令都删除了…重装了VPS系统俩次，简直是血的教训。

回归正题，如何用git把博客部署到VPS.

参考了其他博主的做法，最常见的就是用git的hook来实现。

hook我不是很理解，大概就是一个会自动触发脚本的东西。

即，当在客户端用git push博客文件到VPS的裸仓库的时候，hook里面的脚本就会被触发。

所以，只需要在hook里面写一个触发脚本，把最新push到的博客文件统统copy到web的www目录下就可以了。

有个疑问，为什么不直接在web的www建一个git仓库来实现呢？

后来想明白了，不直接在www建git仓库大概是考虑到安全的原因。

把开发和发布的目录隔离开，互不干涉。

#### 1.VPS的设置

VPS安装好git之后，自己建一个目录初始化一个git裸仓库。

命令：

```sh
git init --bare
```

运行上面命令之后，当前目录会产生不少文件和子目录。

其中有一个目录是hooks.

进入hooks目录，建一个脚本:post-receive

内容如下：

```sh
#!/bin/sh
GIT_REPO=/your/path/git  #git裸仓库路径
TMP_GIT_CLONE=/tmp/blog  #临时文件夹
PUBLIC_HTML=/your/path/www  #放置web的www目录
rm -rf ${TMP_GIT_CLONE}
git clone $GIT_REPO $TMP_GIT_CLONE
rm -rf ${PUBLIC_HTML}/*
cp -rf ${TMP_GIT_CLONE}/* ${PUBLIC_HTML}/
```

当然，前提是你得装好nigix，apache或者caddy等等web服务器，设置好www目录才行。

#### 2.客户端的设置

客户端就很简单了，按照平时使用git就可以了。

在Hugo生成的静态博客目录public中建立git仓库，push到VPS就可以了。

```sh
git add --all
git commit -m '一些说明'
git push origin master
```

在git push的时候，我直接用普通用户remote到VPS的仓库执行操作是行不通的。

因为VPS上面的post-receice 脚本里的操作需要root权限才能执行。

所以没办法，最后只好用root用户来push，隐隐约约觉得有安全隐患。

当然，专业部署web肯定不是用git来部署，而且也不会直接在web服务器上搭建git。

另外，Hugo也有专门的部署工具，所以用git来部署，权当是玩票性质了。

还有一点是，如果git的速度很慢，git push还不如用FTP上传更快….

### 相关阅读

- [Hugo 建立博客](/posts/13-hugo-blog-setup/)
- [Hugo 添加使用图片资源](/posts/07-hugo-images/)
- [Hugo 页面跳转和锚点链接设置](/posts/06-hugo-redirect-anchor/)