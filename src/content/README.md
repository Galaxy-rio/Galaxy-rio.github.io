# 内容写作说明 / Content authoring guide

`blog/` 和 `projects/` 分别保存博客与项目的 Markdown 或 MDX 文件。页面只显示文件本身使用的语言，不会自动翻译正文。请在每个文件的 frontmatter 中明确填写 `language: zh` 或 `language: en`。

两个目录都提供 `_template.md`。两份模板使用完全相同的 frontmatter，复制后只需根据内容修改字段，并在发布前把 `status` 从 `draft` 改为 `publish`。目录会被递归读取，因此可以使用 `blog/2026/`、`blog/2027/` 等年份子目录。

The `blog/` and `projects/` directories contain Markdown or MDX source files. Each page is presented in its original language; body content is never translated automatically. Set `language: zh` or `language: en` explicitly in every file's frontmatter.

如果同一内容由作者分别撰写了中英文版本，请使用相同的路径和基础文件名，只用 `.zh.md` 与 `.en.md` 区分语言，并为两个文件填写完全相同的 `translationKey`：

```text
blog/
└─ 2026/
   ├─ astro-content-guide.zh.md
   └─ astro-content-guide.en.md
```

```yaml
# 两个文件都填写
translationKey: "astro-content-guide"
```

每个 `translationKey` 在同一集合中最多只能有一个中文版本和一个英文版本。配对文件必须位于同一子目录并使用相同的基础文件名，否则构建会报告错误。列表只显示一个版本：中文界面优先中文、英文界面优先英文；首选版本不存在时显示另一语言。公开地址不会包含 `.zh` 或 `.en`，例如 `/en/blog/2026/astro-content-guide/`。

没有 `translationKey` 的文件会被视为独立内容。如果计划以后补充翻译，可以提前填写一个稳定且唯一的 `translationKey`。

## 统一表头 / Shared frontmatter

```md
---
title: "内容标题"
summary: "用于列表页的简短摘要。"
cover:
language: zh
translationKey:
author: galaxyrio
date: "2026-08-27"
time: "21:30"
category: learning
series:
tags: []
featured: false
status: draft
links: []
---

正文从这里开始。发布前将 `status` 改为 `publish`。
```

字段说明：

- `translationKey`：可选；人工撰写的中英文版本填写相同的稳定 key。
- `cover`：可选题图；可填写完整外链（例如 `cover: "https://img.example.top/cover.jpg"`）或 `public/` 下资源对应的站内路径（例如 `cover: "/images/covers/example.jpg"`）。留空时不显示题图；填写后会同时出现在列表卡片和内容页标题区域。
- `author`：作者名称，默认模板填写 `galaxyrio`。
- `date` 与 `time`：内容发布时间，分别使用带引号的 `YYYY-MM-DD` 与 `HH:mm`；网站按上海时区组合显示和排序。
- `category`：`software`（软件）、`design`（设计）、`handcraft`（手工）、`research`（科研）或 `learning`（学习）。
- `series`：可选；同一合集中的内容填写相同的稳定 key，例如 `series: "astro-notes"`。
- `tags`：标签数组，例如 `tags: [Astro, 学习记录]`。
- `featured`：是否作为精选内容，填写 `true` 或 `false`。
- `status`：只能填写 `draft` 或 `publish`；草稿不会出现在网站中。
- `links`：相关链接数组；没有链接时填写 `[]`，有链接时使用以下格式：

```yaml
links:
  - label: GitHub
    url: https://github.com/Galaxy-rio
```

页面标题已经由 frontmatter 中的 `title` 生成，因此正文建议直接从 `##` 二级标题开始；右侧文章目录只收集这些二级标题。单语言文件名可以使用 `optical-test-tool.md`；成对版本使用 `optical-test-tool.zh.md` 与 `optical-test-tool.en.md`。文件名应保持英文小写并适合 URL。
