import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { contentCategories, publicationStatuses } from "./data/contentMeta";
import { contentIdFromPath } from "./utils/localizedContent";

const language = z.enum(["zh", "en"]);
const optionalText = z.preprocess(
  (value) => value === null || value === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);
const date = z.preprocess(
  (value) => value instanceof Date ? value.toISOString().slice(0, 10) : value,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .refine((value) => {
      const [year, month, day] = value.split("-").map(Number);
      const candidate = new Date(Date.UTC(year, month - 1, day));
      return candidate.getUTCFullYear() === year &&
        candidate.getUTCMonth() === month - 1 &&
        candidate.getUTCDate() === day;
    }, "Use a valid calendar date"),
);
const time = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm format");
const links = z
  .array(
    z.object({
      label: z.string().trim().min(1),
      url: z.url(),
    }),
  )
  .default([]);
const sharedFields = {
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  language,
  translationKey: optionalText,
  author: z.string().trim().min(1),
  date,
  time,
  category: z.enum(contentCategories),
  series: optionalText,
  tags: z.array(z.string().trim().min(1)).default([]),
  featured: z.boolean().default(false),
  status: z.enum(publicationStatuses).default("draft"),
  links,
  cover: optionalText,
};

const contentSchema = z.object(sharedFields);

const blog = defineCollection({
  loader: glob({
    base: "./src/content/blog",
    pattern: "**/*.{md,mdx}",
    generateId: ({ entry }) => contentIdFromPath(entry),
  }),
  schema: contentSchema,
});

const projects = defineCollection({
  loader: glob({
    base: "./src/content/projects",
    pattern: "**/*.{md,mdx}",
    generateId: ({ entry }) => contentIdFromPath(entry),
  }),
  schema: contentSchema,
});

export const collections = { blog, projects };
