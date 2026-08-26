import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const language = z.enum(["zh", "en"]);
const sharedFields = {
  title: z.string().min(1),
  summary: z.string().min(1),
  language,
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  translationKey: z.string().optional(),
  draft: z.boolean().default(false),
};

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    ...sharedFields,
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    ...sharedFields,
    kind: z.enum(["software", "design", "research", "other"]),
    completedAt: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    links: z
      .array(
        z.object({
          label: z.string().min(1),
          url: z.url(),
        }),
      )
      .default([]),
  }),
});

export const collections = { blog, projects };
