---
title: "Git代替FTP管理虚拟空间"
description: "申请空间，然后装上DZ论坛，或者转个wordpress，再搞个域名，玩得不亦乐乎。"
date: 2020-05-22T00:00:00.000Z
tags: ["git"]
---

突然怀念多年前用虚拟空间的时候，那时候虚拟空间很火，有很多IDC提供免费的虚拟空间。

申请空间，然后装上DZ论坛，或者转个wordpress，再搞个域名，玩得不亦乐乎。

于是这俩天也折腾申请了几个"免费虚拟空间"，想着老是用FTP上传文件很不爽，想用Git来代替，发现还真有。

## 安装git-ftp

官方的教程在这：[点击跳转到git-ftp](https://github.com/git-ftp/git-ftp/blob/master/INSTALL.md)

首先，下载安装git-ftp,用**管理员身份**运行cmd：

```sh
curl https://raw.githubusercontent.com/git-ftp/git-ftp/master/git-ftp > /bin/git-ftp
chmod 755 /bin/git-ftp
```

检测是否安装成功,打开git-bash,运行：

```sh
git-ftp -h
```

如果显示帮助文档，那就说明成功了。

### 安装chcon

因为git-ftp的一些命令依赖"lftp",所以还要安装"lftp".

而安装"lftp"还要装一个Chocolately，Chocolately是一个类似apt-get的工具，不过是用在windows下的。

Chocolately的官方文档在这：[chcon](https://nwgat.ninja/install-lftp-in-chocolately/)

打开cmd,直接复制粘贴以下命令就能安装Chocolately:

```sh
@powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))" && SET PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin
```

上面命令运行完之后，重新打开cmd,输入choco，检测有没有安装成功。

出现一堆帮助文档，说明安装成功。

然后就可以安装lftp了：

```sh
choco install lftp
```

## git-ftp的使用

先创建一个文件夹，用git初始化为仓库：

```sh
mkdir test
cd test
git init
```

然后就可以像使用git一样使用git-ftp了。

git-ftp的参数在这个链接:[git-ftp](https://github.com/git-ftp/git-ftp/blob/master/man/git-ftp.1.md)

我自己测试发现，使用"git ftp push"和"git-ftp push"结果是一样的，所以不用纠结有没有"-".

### git-ftp的配置

```sh
git config git-ftp.url "ftp://ftp.example.net:21/public_html"
git config git-ftp.user "ftp-user"
git config git-ftp.password "secr3t"
```

其中git-ftp.url是配置虚拟主机的ftp地址，可以用IP或者域名。

git-ftp.user是配置虚拟主机的FTP账户名。

git-ftp.password是配置虚拟主机的FTP密码。

### 本地仓库和虚拟主机连接

```sh
git ftp init
```

git ftp init命令是在虚拟主机创建一个.git-ftp.log文件,然后把本地仓库的所有文件上传到虚拟主机。

这个.git-ftp.log文件是用来追踪记录版本的，删除它就相当于把虚拟主机的git仓库删除了。

如果已经用其他工具把文件上传了，那就用以下命令在虚拟主机创建.git-ftp.log文件，相当于建立一个远程git仓库的意思。

```sh
git ftp catchup
```

### 本地仓库推送修改

在本地修改文件，和平时使用git一样，先"git add ."到暂存区，然后"git commit -m 'xxx'"到本地仓库。

最后就可以通过git ftp push更新虚拟主机的文件：

```sh
git ftp push
```

### 把虚拟主机的文件下载下来

- 如果需要下载虚拟主机的文件,用以下命令：

```sh
git ftp download --insecure
```

git ftp download 这个命令不需要虚拟主机建立git仓库就能用.

后面参数的"--insecure"是忽略认证，直接下载，不加这个还需要额外配置认证，干脆忽略就能下载了。

- 另一个下载的命令就和git pull一样了，需要虚拟主机有git仓库，然后下载之后会进行merge操作。

命令如下：

```sh
git ftp pull
```