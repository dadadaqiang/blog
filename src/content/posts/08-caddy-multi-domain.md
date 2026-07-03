---
title: "Caddyfile配置多个域名"
description: "不过，caddy现在已经升级到v2版本，v2版本相比v1难用多了，为了方便快捷，我还是拿旧版caddy来用。"
date: 2020-05-16T00:00:00.000Z
tags: ["web"]
---

使用caddy搭建web非常简单，相比apache,ngixn工业级别来说，比较容易配置。

不过，caddy现在已经升级到v2版本，v2版本相比v1难用多了，为了方便快捷，我还是拿旧版caddy来用。

在github上找旧版caddy v1的release,下载解压就能得到编译好的caddy，把它放到bin目录里就能用了：

```sh
wget https://github.com/caddyserver/caddy/releases/download/v1.0.4/caddy_v1.0.4_linux_amd64.tar.gz
tar zxvf caddy_v1.0.4_linux_amd64.tar
cp caddy /usr/bin/
```

配置caddy主要是通过Caddyfile。

```sh
vim /etc/caddy/Caddyfile
```

配置如下：

```sh
test.com {

    root /var/www/example.com
    tls XXX@mail   #你的邮箱，会自动申请和续约tls
    log ./caddy.log #日志    
}

www.test.com{
    root /var/www/example.com
    tls XXX@mail   #你的邮箱，会自动申请和续约tls
    log ./access.log #日志 
}
```

最后后台运行：

```sh
nohup caddy -agree -conf /etc/caddy/Caddyfile > /root/caddy.log 2>&1 &
```

通过caddy.log可以查看启动输出的信息，可以用来调试。