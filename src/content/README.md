# 内容写作说明 / Content authoring guide

`blog/` 和 `projects/` 分别保存博客与项目的 Markdown 或 MDX 文件。页面只显示文件本身使用的语言，不会自动翻译正文。请在每个文件的 frontmatter 中明确填写 `language: zh` 或 `language: en`。

两个目录都提供 `_template.md`。复制模板、改成稳定的英文小写文件名，并在发布前把 `draft` 改为 `false`；以下示例与模板字段一致。

The `blog/` and `projects/` directories contain Markdown or MDX source files. Each page is presented in its original language; body content is never translated automatically. Set `language: zh` or `language: en` explicitly in every file's frontmatter.

如果同一内容由作者分别撰写了中英文版本，可以为两个文件填写相同的可选 `translationKey`，用来建立人工翻译版本之间的关联。

## 博客示例 / Blog example

```md
---
title: "文章标题"
summary: "列表页使用的简短摘要"
language: zh
publishedAt: 2026-08-25
tags: [Astro, 学习记录]
draft: true
---

正文从这里开始。
```

## 项目示例 / Project example

```md
---
title: "项目名称"
summary: "项目简介"
language: zh
kind: software
tags: [Python]
featured: false
draft: true
links:
  - label: GitHub
    url: https://github.com/Galaxy-rio
---

在这里记录项目目标、过程、职责和结果。只填写真实信息。
```

项目 `kind` 可选值为 `software`、`design`、`research` 或 `other`。文件名应使用稳定、适合 URL 的英文小写 slug，例如 `optical-test-tool.md`。发布日期、完成日期和链接应采用真实信息；框架不会为缺少的履历、论文或项目生成占位事实。
