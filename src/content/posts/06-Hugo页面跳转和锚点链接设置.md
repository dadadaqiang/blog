---
title: "Hugo页面跳转和锚点链接设置"
description: "Hugo提供了两种写法："
date: 2020-05-17T00:00:00.000Z
tags: ["Hugo"]
---

Hugo生成markdown页面之后，如果想在markdown页面里插入超链接，跳转到另一个页面，写法和原生的markdown不一样。

## Hugo插入超链接地址的写法

Hugo提供了两种写法：

```
{{ < ref "path/to/document.md#锚点" > }}
{{ < relref "path/to/document.md#锚点" > }}
```

其中**relref**插入的是被引用文档的相对链接地址，**ref**插入的是被引用文档的完整链接地址。

## 跳转路径

ref和relref的跳转路径，是相对内容目录**content/**的路径。

例如，被引用文档完整路径是site/content/post/ABC.md

在markdown的写法是这样：

```
[提示文字]({{  < ref "localhost:1313/content/blog/post/ABC.md" >  }}) #本地运行的baseURL是localhost:1313
[提示文字]({{  < relref "blog/post/ABC.md" >  }})
```

## 锚点

锚点是指定位到所跳转文档的某个位置。

Hugo将Markdown文档转换为网页的时候，会将Markdown里的**标题内容**自动生成锚点。

锚点也可以自己定义，在标题后面加上{#锚点}就可以了。

比如：#这是个标题{#ABC}，这样就会生成对应的锚点"ABC"。

跳转文档，并且定位到某个标题，Markdown的写法是这样：

```
{{  < ref  "path/to/document.md#某标题" >  }}
{{  < relref "path/to/document.md#某标题" >  }}
```

也可以忽略路径，表示的是跳转到当前页面的某个标题。

比如以下标记，就是跳转到本页面标题的"跳转路径":

```
[点击这里跳转到"跳转路径"]({{  < relref "#跳转路径" >  }})
```

最后，我找到一篇很详细介绍Hugo使用的博文：[komantao](https://kuang.netlify.app/blog/hugo.html)