---
title: "解决1Panel OpenResty 80端口占用问题"
description: "1Panel面板并运行OpenResty时，OpenResty一直在重启。"
date: 2020-05-20T00:00:00.000Z
tags: []
---

### **现象**

1Panel面板并运行OpenResty时，OpenResty一直在重启。

### **原因**

查看1Panel的容器，找到OpenResty的日志，发现是80端口一直被占用。

### **解决方案**

如果提示80端口被占用，通常是因为其他服务（如Nginx或Apache）已经占用了该端口。

##### **查看端口情况**

```
1
netstat -utpln | grep 80
```

##### **停止或卸载冲突服务**

如果是Nginx或Apache占用了端口，可以通过以下命令停止服务：

```
1
2
sudo systemctl stop nginx
sudo systemctl disable nginx
```

##### **修改OpenResty监听端口**

如果不想停止其他服务，可以修改OpenResty的配置文件，使用其他端口（如8080）。编辑配置文件：

```
1
sudo nano /usr/local/openresty/nginx/conf/nginx.conf
```