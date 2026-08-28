---
title: 基于 Cloudflare R2 的个人图床系统搭建
summary: 使用 Cloudflare R2 搭建图床并优化图片传输
cover: "https://img.galaxyrio.top/media/2026/08/217f8f5c603d5ea107d96f6f6c2ea6b9.png"
language: zh
translationKey: personal image host based on cloudflare r2
author: galaxyrio
date: 2026-08-27
time: 22:00
category: learning
series:
tags:
  - image-host
  - Tutorial
featured: false
status: publish
links: []
---

## 前言

写 Markdown 的时候，图片很容易被当成文章旁边的一件“小事”：建一个 `assets` 文件夹，再用相对路径引用就好了。只在一台电脑、一个目录里写作时，这确实没有什么问题。

但当我开始在多台设备之间同步 Markdown，麻烦也随之出现。像 `../assets/example.png` 这样的路径，只能放在原来的目录结构里。文章换一台电脑、换一个编辑器，或者从笔记目录移动到博客仓库后，图片可能就找不到了。

我也试过直接用 Git 同步文章和图片。Git 当然能保存二进制文件，但图片无法像文本一样方便地比较和合并，历史中的二进制对象会让仓库越来越臃肿。为了几篇文章，再引入 Git LFS 又显得有些重。

过去我还折腾过一些免费图床和微博图床，但图片地址、外链规则和服务寿命都存在问题，而且会随着平台政策变化变得越来越难用。短期省下的配置时间，最后往往变成了迁移成本。

于是，图床几乎成了多设备 Markdown 写作的必然选择。

## 目标和实现框架

这套图床需要满足几个朴素的目标：

- 图片离开本地目录后，文章在任何设备上都能正常显示；

- 上传动作足够简单，最好拖入图片就能得到 Markdown；

- 对外使用自己的域名，不把所有文章绑定在某一家图床的 URL 上；

- R2 只保存原图，尺寸与格式优化交给分发层完成；

- 日常用量下成本足够低，同时保留清晰的迁移路径。

最终，我采用了下面这套架构：

```text
本地截图或图片
      ↓
PicGo 上传
      ↓
Cloudflare R2 保存原图
      ↓
img.example.top 提供稳定地址
      ↓
Cloudflare Images 自动调整格式、尺寸和质量
      ↓
博客与读者浏览器
```

这几个组件的职责很清楚：PicGo 负责上传和生成 Markdown 链接；R2 是原图仓库；`img.example.top` 是对外不变的地址；Cloudflare Images 则根据浏览器和设备，在请求时生成并缓存更合适的版本。

我选择 R2，一方面是因为它提供 S3 兼容 API，可以直接接入现成的上传工具；另一方面是因为它能绑定自己的域名，而且公网出口流量不单独收费。对个人博客来说，这套计费方式也比较友好，具体数字放在文末再谈。

## 准备工作

开始之前，需要准备：

- 一个已经接入 Cloudflare 的域名，并且与 R2 存储桶位于同一个 Cloudflare 账号；

- 一个 R2 存储桶，建议专门用于博客图片；

- 桌面端 PicGo；

- 一个准备分配给图床的子域名，例如 `img.example.top`。

如果还没有存储桶，可以在 Cloudflare 的 R2 页面创建一个 Standard 存储桶。桶名只在后台和上传配置中使用，不必与图片域名相同。

## 通过自身域名访问 R2

进入 R2，选择图片存储桶，在 **Settings → Custom Domains** 中添加：

```text
img.example.top
```

Cloudflare 会展示即将创建的 DNS 记录。确认后连接域名，等待状态从 `Initializing` 变为 `Active` 即可。这里最好让 Cloudflare 自动创建记录，不要提前手动添加同名的 A 或 CNAME；如果提示冲突，再去 DNS 页面检查是否已经存在 `img` 记录。

如果没有自己的域名，也可以打开 **Public Development URL** 。`r2.dev` 主要用于开发测试并可能受到限流，正式图床最好还是使用自定义域。Cloudflare 的 [R2 公共存储桶文档](https://developers.cloudflare.com/r2/buckets/public-buckets/) 对这两种访问方式有更完整的说明。

![](https://img.galaxyrio.top/media/2026/08/9dadb2a080388ee5c4083b455b289a65.png)

完成后检查存储桶状态，公共 URL 访问显示“已允许”，且域显示为我们刚自定义的域名就说明配置成功。

可以手动向 R2 上传一张测试图片，例如把对象路径设为：

```text
test/origin-test.jpg
```

然后在浏览器中访问：

```text
https://img.example.top/test/origin-test.jpg
```

正常情况下应该能直接看到图片。直接打开 `https://img.example.top/` 得到 404 并不代表失败，因为 R2 不会通过域名根路径列出桶内的全部对象。

## 设置用于连接 PicGo 的令牌

PicGo 需要通过 R2 的 S3 API 上传文件，因此要单独创建一组凭证。在 R2 Overview 中进入 Manage in API Tokens，创建一个 User API Token。权限设置参考：

- Permission：`Object Read & Write`；

- Bucket scope：只允许访问图片存储桶；

- 不授予账号管理权限，也不授权其他存储桶。

创建完成后，Cloudflare 会给出以下内容，其中后三项会用到：

```text
令牌值：
53位

为 S3 客户端使用以下凭据：
访问密钥 Access Key ID：
32位
机密访问密钥 Secret Access Key：
64位

为 S3 客户端使用管辖权地特定的终结点：
S3 API Endpoint：
https://<ACCOUNT_ID>[32位].r2.cloudflarestorage.com
```

这一页面不会再次显示，一定要妥善保管页面内容，例如放进密码管理器。

## 设置 PicGo

在 PicGo 的插件设置中搜索并安装 `picgo-plugin-s3`，插件来源为 `wayjam`，然后重启一次 PicGo。这个插件支持 S3 兼容存储，字段定义可以参考它的 [项目说明](https://github.com/wayjam/picgo-plugin-s3)。

进入 **图床设置 - Amazon S3**，可以按下面的方式配置：

| PicGo 配置项                            | 填写内容                                                              |
| ------------------------------------ | ----------------------------------------------------------------- |
| Access Key ID                        | 刚刚创建的 R2 Access Key ID                                            |
| Secret Access Key                    | 刚刚创建的 R2 Secret Access Key                                        |
| Bucket Name                          | R2 图片存储桶名称                                                        |
| Upload Path                          | `media/{year}/{month}/{md5}.{extName}`                            |
| Region                               | `auto`                                                            |
| Endpoint                             | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`                   |
| Path Style Access / Force Path Style | `true`                                                            |
| Reject Unauthorized                  | `true`                                                            |
| ACL                                  | `private`                                                         |
| Output URL Pattern                   | `https://img.example.top/media/{year}/{month}/{uploadedFileName}` |

上传路径中的 `{md5}` 会用图片内容生成文件名。这样既能避开中文文件名和重名问题，也能让修改后的图片自然获得一个新地址，减少缓存与覆盖带来的混乱。

`Output URL Pattern` 决定 PicGo 最终复制什么地址。它必须与 `Upload Path` 对齐：前者生成对外 URL，后者决定对象在 R2 中的真实位置。按本文使用的插件版本，这套配置只依赖 `Output URL Pattern`，`urlPrefix`、`urlSuffix` 等旧字段保持为空即可。

这里还有一个容易混淆的点：R2 并不使用传统 S3 对象 ACL 来决定自定义域能否公开读取。PicGo 中的 `ACL=private` 只是沿用插件维护者给出的 R2 兼容值，并不是这套图床的权限开关；真正控制公开访问的是 R2 存储桶与自定义域的连接状态。绑定公共自定义域后，知道对象路径的人就能读取文件，因此这个桶里不要混放私密内容。相关差异可以在 [R2 的 S3 兼容性列表](https://developers.cloudflare.com/r2/api/s3/api/) 中查到。

保存后，把 Amazon S3 设为默认图床，并将 PicGo 的复制格式改为 Markdown。如果版本支持“上传后自动复制链接”，也可以一并开启。

在进入下一步之前可以先拖一张测试图片进 PicGo。上传成功后，R2 中应该出现类似的对象路径：

```text
media/2026/08/4aa4f41e38817e5fd38ac870f40dbc70.jpg
```

![](https://img.galaxyrio.top/media/2026/08/ea8d1c4aa1547d45b3c9d652bf54418f.png)

PicGo 返回的地址则应该是：

```text
https://img.galaxyrio.top/media/2026/08/4aa4f41e38817e5fd38ac870f40dbc70.jpg
```

逐字符比较两者在 `media/` 之后的内容，必须完全一致。随后在浏览器中打开 PicGo 返回的地址，确认能够显示图片。

如果测试没有得到预期结果，可以按现象缩小范围：

- 返回地址中出现桶名：确认插件已经更新、Output URL Pattern 已保存，并且没有把模板简写成 `https://img.example.top/{path}`，随后检查 Endpoint 末尾是否夹带桶名；

- R2 中已有对象，但图片地址返回 404：检查自定义域状态和对象路径；

- PicGo 无法上传：上传失败不会报错，可以在日志里可以查看错误详情。检查 Token 权限、Endpoint、桶名和 `Path Style Access`。

到这里，一个可用的个人图床已经搭好了。接下来的 Cloudflare Images 不是上传所必需的，但它能让读者不必下载尺寸过大的原图。

##  Cloudflare 自动压缩图片

R2 适合保存原图，但博客页面不应该总把几千像素、几 MB 的原文件直接交给手机浏览器。我的做法是让 R2 保留最佳质量的原图，再用 Cloudflare Images 在访问时自动生成合适的版本。Cloudflare 官方也给出了 [R2 保存原图、Images 负责动态优化](https://developers.cloudflare.com/reference-architecture/diagrams/content-delivery/optimizing-image-delivery-with-cloudflare-image-resizing-and-r2/) 的参考架构。

先进入 **Images - Transformations**，选择 `example.top` 这个 Zone 并启用 Transformations。

**Sources** 决定转换引擎可以从哪里读取原图，Flow 则决定哪些干净 URL 会自动应用转换。由于 `img.example.top` 与转换所在的 Zone 相同，Cloudflare 默认已经允许这个来源；这里保持 `Allowed origins` 即可，不要切换成 `Any origin`。后者会让第三方也能借你的 Zone 转换互联网上的图片，没有必要。具体规则可参考 [Sources 官方说明](https://developers.cloudflare.com/images/optimization/transformations/sources/)。

接着进入 **Automation - Add custom flow**，创建一个名为 `blog-media-auto` 的 Flow。条件设置为：

- URL Path：`/media/*`；

- 文件类型：JPEG、JPG、PNG、WebP；

- GIF 可以按需要加入，SVG 则最好不放进这个 Flow，因为 SVG 本质上是文本格式，这意味着通常可以直接用 git 管理。

转换动作可以使用下面这一组参数：

| 选项       | 推荐值           |
| -------- | ------------- |
| Format   | `auto`        |
| Width    | `auto`        |
| Quality  | `medium-high` |
| Fit      | `scale-down`  |
| Metadata | `none`        |

`format=auto` 会按浏览器能力返回 AVIF、WebP 或兼容格式；`width=auto` 会结合浏览器提示或设备信息选择合适的宽度，而不是让手机照单全收桌面尺寸原图。各参数的当前行为可以查看 [Transformation Flows 文档](https://developers.cloudflare.com/images/optimization/transformations/flows/)。

这里有一个很容易漏掉的细节：先在 Flow 编辑面板中点一次 **Save**，回到 Flow 列表后，还要再点页面上的 **Save**，才能真正发布并启用规则。

到这里，整套流程介绍完成。

## 成本与额度

截至 2026 年 8 月，R2 Standard 免费层包含每月 10 GB-month 存储、100 万次 Class A 操作和 1,000 万次 Class B 操作，公网出口流量免费；Cloudflare Images Free 则包含每月 5,000 个唯一转换。价格和额度可能调整，发布或照做前最好再看一遍 [R2 Pricing](https://developers.cloudflare.com/r2/pricing/) 和 [Cloudflare Images Pricing](https://developers.cloudflare.com/images/pricing/)。

“唯一转换”按原图与参数组合计算：同一张图片使用相同参数，在同一个月内重复访问只计一次，不同宽度则会分别计数。若达到免费额度，必要时可以暂时关闭 `blog-media-auto`，让原来的干净 URL 直接返回 R2 原图；这也是把存储层和优化层分开的好处。

## 结语

以上就是我的图床系统搭建方案，本文的所有图片也都使用 PicGo 上传、Cloudflare R2 存储并经 Cloudflare Images Transformations 优化。
