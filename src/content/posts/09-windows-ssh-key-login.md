---
title: "windows配置ssh免密登录linux"
description: "生成公钥私钥对，既可以在服务器上进行，也可以在本地客户端进行。"
date: 2020-05-15T00:00:00.000Z
tags: ["linux","git"]
---

懒人一个，连密码都不想输，因此设置一下ssh和git免密登录。

#### 1. ssh免密登录

##### 第一步:生成公钥私钥对

生成公钥私钥对，既可以在服务器上进行，也可以在本地客户端进行。

在服务器上进行，那就得把私钥传输出去，相对来说不大安全，所以我选择在本地客户端生成公钥私钥对。

```sh
ssh-keygen -t rsa
```

RSA是默认的加密类型。默认的RSA长度是2048位，如果想更安全一些，可以指定4096位长度。

```sh
ssh-keygen -b 4096 -t rsa
```

生成过程中会让你指定目录来保存密钥，默认就行了。

默认的目录是在C:\Users\用户名.ssh。

然后还会让你输入一个密码给密钥加密，可以加密，也可以不加密。

完成之后，在指定目录下就会有两个文件，一个是id_rsa，这是私钥，不能泄露。另一个是id_rsa.pub,这个可以分发。

##### 第二步:公钥上传到服务器

用FTP工具把id_rsa.pub上传到服务器。

在用户目录下建立.ssh文件夹和authorized_keys文件。

注意，如果是想root免密码登录，就在root目录下建立，如果是想普通用户免密码登录，那就再对应的用户目录建立。

```sh
mkdir .ssh
touch authorized_keys
```

把id_rsa.pub内容复制到authorized_keys.

```sh
cat id_rsa.pub >> authorized_keys
rm id_rsa.pub
```

重启ssh服务。

```sh
service sshd restart
```

然后用终端ssh就能连接：

```sh
ssh 用户@IP
```

**如何调试**

如果没有成功，可以用下面命令debug,看看哪里出错，最常见就是id_rsa路径没有设置好，或者服务器的公钥文件没有设置好。

```sh
ssh -vT 用户@IP
```

可以指定私钥的路径来解决：

```sh
ssh -T -i C:\User\your\id_rsa\path 用户@IP
```

如果实在不行，直接拷贝对应的私钥公钥到对应目录。

**权限设置**

为了更好保护公钥私钥，设置权限：

```sh
chmod 700 .ssh
chmod 600 authorized_keys
```

**别名设置**

输入IP还是很麻烦，可以在本地的C:\Users\用户名.ssh目录下修改config文件。

```
Host 你喜欢的名字
    HostName 服务器IP
    User 登录用户名
    IdentityFile C:\Users\w\.ssh\id_rsa
```

这样登录是时候只需要:

```sh
ssh 你喜欢的名字
```

#### 2. git免密操作

ssh可以免密登录之后，git用ssh登录就不用重复设置了。

不过ssh登录默认是root登录，要设置成普通用户免密登录的话，还要进行以下操作。

先用root用户登录。

```sh
vim .ssh/authorized_keys
```

复制里面的公钥。

然后切换到普通用户。在普通用户的目录下建立.ssh目录和authorized_keys文件。

```sh
mkdir .ssh
vim authorized_keys
```

把复制好的公钥粘贴进去。

然后进行权限设置：

```sh
chmod 700 .ssh
chmod 600 authorized_keys
```

#### 3. linux设置密码登录和密钥登录

服务器设置好密钥可以成功登录之后，可以取消掉原来的用户密码登录。

**一定要先测试密钥能不能登录，不然就登录不了!**

```sh
vim /etc/ssh/sshd_config
PasswordAuthentication no     //yes改为no  
ChallengeResponseAuthentication no  //yes改为no  

RSAAuthentication yes   //去掉前面的注释  
PubkeyAuthentication yes  //去掉前面的注释  
AuthorizedKeysFile .ssh/authorized_keys  //去掉前面的注释
```

### 相关阅读

- [Windows 连接 VPS SSH permissions for key are too open](/posts/windows-ssh-permissions-too-open/)
- [搭建富强如何挑选适合的 VPS](/posts/choose-vps-proxy/)
- [如何测评 VPS 各项指标](/posts/vps-benchmark/)