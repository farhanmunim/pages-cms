import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { SHOW_DRAFTS as SHOW_DRAFTS_ENV } from 'astro:env/server';

/** Content types that have listings, drafts and detail pages (besides pages). */
export type ContentKey = 'posts' | 'projects' | 'services' | 'resources';
export const CONTENT_KEYS: ContentKey[] = ['posts', 'projects', 'services', 'resources'];
export const LABELS: Record<ContentKey, string> = {
  posts: 'Blog',
  projects: 'Projects',
  services: 'Services',
  resources: 'Resources',
};

export type Draftable = CollectionEntry<'pages' | ContentKey>;
export type Author = CollectionEntry<'authors'>;
export type Category = CollectionEntry<'categories'>;
export type Tag = CollectionEntry<'tags'>;

/**
 * Drafts are hidden from production builds. They are visible in `astro dev`
 * and in builds run with SHOW_DRAFTS=true (e.g. a preview deployment).
 */
export const SHOW_DRAFTS = import.meta.env.DEV || SHOW_DRAFTS_ENV;

export const isPublished = (entry: { data: { status: 'draft' | 'published' } }) =>
  SHOW_DRAFTS || entry.data.status === 'published';

/* ------------------------------------------------------------- Globals */

export async function getSite() {
  const entry = await getEntry('site', 'site');
  if (!entry) throw new Error('Missing src/content/settings/site.yml');
  return entry.data;
}

export type PermalinkKey = 'pages' | ContentKey | 'categories' | 'tags' | 'authors';
const DEFAULT_PERMALINKS: Record<PermalinkKey, string> = {
  pages: '',
  posts: 'blog',
  projects: 'projects',
  services: 'services',
  resources: 'resources',
  categories: 'category',
  tags: 'tags',
  authors: 'authors',
};

const trimSlashes = (s: string) => s.trim().replace(/^\/+|\/+$/g, '');

/** URL prefixes from Permalinks settings, with blueprint defaults as fallback. */
export async function getPermalinks(): Promise<Record<PermalinkKey, string>> {
  const data = (await getEntry('permalinks', 'permalinks'))?.data ?? {};
  const out = { ...DEFAULT_PERMALINKS };
  for (const key of Object.keys(out) as PermalinkKey[]) {
    const value = (data as Partial<Record<PermalinkKey, string>>)[key];
    if (value !== undefined) out[key] = trimSlashes(value);
  }
  return out;
}

/** Route path (without leading slash) for a prefix + optional slug. */
export const routePath = (prefix: string, slug?: string) => [prefix, slug].filter(Boolean).join('/');
/** Site-relative href with trailing slash (Astro's default "directory" output). */
export const href = (prefix: string, slug?: string) => `/${routePath(prefix, slug)}/`.replace(/\/+$/, '/');

/* ------------------------------------------------------------- Entries */

export async function getPublishedPages() {
  return (await getCollection('pages')).filter(isPublished).sort(byTitle);
}

export async function getPublished(key: ContentKey): Promise<CollectionEntry<ContentKey>[]> {
  const entries = (await getCollection(key)).filter(isPublished) as CollectionEntry<ContentKey>[];
  return key === 'posts' ? entries.sort(byDateDesc) : entries.sort(byTitle);
}

export const byTitle = (a: { data: { title: string } }, b: { data: { title: string } }) =>
  a.data.title.localeCompare(b.data.title);

export const byDateDesc = (a: CollectionEntry<ContentKey>, b: CollectionEntry<ContentKey>) => {
  const da = 'date' in a.data && a.data.date ? a.data.date.getTime() : 0;
  const db = 'date' in b.data && b.data.date ? b.data.date.getTime() : 0;
  return db - da || byTitle(a, b);
};

/** Short text for listings and meta descriptions. */
export function summaryOf(entry: Draftable): string {
  const d = entry.data as { excerpt?: string; summary?: string; description?: string };
  return d.excerpt ?? d.summary ?? d.description ?? '';
}

export const tagsOf = (entry: Draftable): string[] =>
  'tags' in entry.data ? entry.data.tags : [];

export const isFeatured = (entry: Draftable): boolean =>
  'featured' in entry.data && entry.data.featured;

export const formatDate = (date?: Date) =>
  date ? date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

/* ------------------------------------------------------------- Taxonomy */

export const authorName = (a: Author) => `${a.data.first_name} ${a.data.last_name}`.trim();

export async function getAuthorsSorted() {
  return (await getCollection('authors')).sort((a, b) => authorName(a).localeCompare(authorName(b)));
}

/** A category and all of its descendants (ids), for hierarchical listings. */
export function categoryFamily(id: string, categories: Category[]): string[] {
  const ids = [id];
  for (let i = 0; i < ids.length; i++) {
    for (const c of categories) if (c.data.parent === ids[i] && !ids.includes(c.id)) ids.push(c.id);
  }
  return ids;
}

/** Nested category tree: root categories with their children, sorted by name. */
export function categoryTree(categories: Category[]) {
  const byName = (a: Category, b: Category) => a.data.name.localeCompare(b.data.name);
  const known = new Set(categories.map((c) => c.id));
  const childrenOf = (id: string) => categories.filter((c) => c.data.parent === id).sort(byName);
  const roots = categories.filter((c) => !c.data.parent || !known.has(c.data.parent)).sort(byName);
  const build = (c: Category): CategoryNode => ({ category: c, children: childrenOf(c.id).map(build) });
  return roots.map(build);
}
export type CategoryNode = { category: Category; children: CategoryNode[] };

/** All published entries (posts, projects, services, resources) that carry a tag. */
export async function entriesWithTag(tagId: string) {
  const result: CollectionEntry<ContentKey>[] = [];
  for (const key of CONTENT_KEYS) {
    result.push(...(await getPublished(key)).filter((e) => tagsOf(e).includes(tagId)));
  }
  return result;
}

/** All published entries written by an author, grouped by collection. */
export async function entriesByAuthor(authorId: string) {
  const groups: { key: ContentKey; entries: CollectionEntry<ContentKey>[] }[] = [];
  for (const key of CONTENT_KEYS) {
    const entries = (await getPublished(key)).filter((e) => e.data.author === authorId);
    if (entries.length) groups.push({ key, entries });
  }
  return groups;
}
