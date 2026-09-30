import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Pages CMS stores references as the referenced entry's file path
// (reference field `value: "{path}"`, e.g. "src/content/tags/astro.yml").
// Reduce that to the entry id Astro uses: the file name without extension.
const toId = (v: string) => v.split('/').pop()!.replace(/\.[^.]+$/, '');

// Pages CMS may write empty fields as "" or null; treat both as "not set".
const blank = (v: unknown) => (v === '' || v === null ? undefined : v);

const optString = z.preprocess(blank, z.string().optional());
const ref = z.preprocess(blank, z.string().transform(toId).optional());
const refs = z.preprocess(
  (v) => (Array.isArray(v) ? v.filter(Boolean) : []),
  z.array(z.string()).transform((list) => list.map(toId)),
);
const status = z.preprocess(blank, z.enum(['draft', 'published']).default('draft'));
const featured = z.preprocess(blank, z.boolean().default(false));
const cover = z.preprocess(blank, z.object({ image: optString, alt: optString }).optional());
const socialLinks = z.preprocess(
  (v) => (Array.isArray(v) ? v : []),
  z.array(z.object({ platform: z.string(), url: z.string(), handle: optString })),
);

const md = (dir: string) => glob({ pattern: '**/*.md', base: `./src/content/${dir}` });
const yml = (dir: string) => glob({ pattern: '**/*.yml', base: `./src/content/${dir}` });

// Fields shared by every draftable content type.
const base = {
  title: z.string(),
  slug: optString,
  status,
  author: ref,
  cover,
};

const pages = defineCollection({
  loader: md('pages'),
  schema: z.object({ ...base, description: optString }),
});

const posts = defineCollection({
  loader: md('posts'),
  schema: z.object({
    ...base,
    excerpt: optString,
    date: z.preprocess(blank, z.coerce.date().optional()),
    featured,
    categories: refs,
    tags: refs,
  }),
});

const projects = defineCollection({
  loader: md('projects'),
  schema: z.object({
    ...base,
    featured,
    tags: refs,
    summary: optString,
    url: optString,
    attachment: optString,
  }),
});

const services = defineCollection({
  loader: md('services'),
  schema: z.object({ ...base, featured, tags: refs, summary: optString }),
});

const resources = defineCollection({
  loader: md('resources'),
  schema: z.object({
    ...base,
    featured,
    tags: refs,
    description: optString,
    url: optString,
    attachment: optString,
  }),
});

const categories = defineCollection({
  loader: yml('categories'),
  schema: z.object({ name: z.string(), slug: optString, parent: ref }),
});

const tags = defineCollection({
  loader: yml('tags'),
  schema: z.object({ name: z.string(), slug: optString }),
});

const authors = defineCollection({
  loader: md('authors'),
  schema: z.object({
    first_name: z.string(),
    last_name: z.string(),
    avatar: optString,
    social: socialLinks,
  }),
});

// Globals: single YAML files edited as "file" entries in Pages CMS.
const site = defineCollection({
  loader: glob({ pattern: 'site.yml', base: './src/content/settings' }),
  schema: z.object({
    name: z.string(),
    tagline: optString,
    description: optString,
    logo: optString,
    favicon: optString,
    social_image: optString,
    copyright: optString,
    social: socialLinks,
    head_html: optString,
    footer_html: optString,
  }),
});

const permalinks = defineCollection({
  loader: glob({ pattern: 'permalinks.yml', base: './src/content/settings' }),
  schema: z.object({
    pages: optString,
    posts: optString,
    projects: optString,
    services: optString,
    resources: optString,
    categories: optString,
    tags: optString,
    authors: optString,
  }),
});

export const collections = {
  pages,
  posts,
  projects,
  services,
  resources,
  categories,
  tags,
  authors,
  site,
  permalinks,
};
