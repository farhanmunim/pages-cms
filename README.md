# [ARCHIVED] Astro + Pages CMS website

> **This repository is sunset and archived.** It is kept for reference only and is no longer
> maintained or deployed.

A Git-based website: content is edited in **[Pages CMS](https://pagescms.org)**, stored as plain
files in this repository, built by **[Astro](https://astro.build)** and deployed to
**Cloudflare Pages** on every commit.

```
Pages CMS (app.pagescms.org) ──commit──▶ GitHub repo ──build──▶ Cloudflare Pages ──▶ live site
                                          │
                                          └── src/content/**  +  public/media/**
```

No database, no paid services, no servers to run.

## Editing content (editor guide)

1. Go to <https://app.pagescms.org>, sign in with GitHub and open this repository.
   Pages CMS reads `.pages.yml` from the repo and shows the sidebar:
   - **Content**: Pages, Posts, Projects, Services, Resources
   - **Organisation**: Categories, Tags
   - **Settings**: Authors, Site settings, Permalinks
   - **Media**: the shared library (`public/media/`), used by all image/file fields
2. **Add an entry** in a collection, fill in the fields, save. Saving creates a Git commit.
3. Set **Status** to *Published* to make an entry appear on the live site. *Draft* entries are
   ignored by the production build (they are visible in `npm run dev` and in builds with
   `SHOW_DRAFTS=true`).
4. Cloudflare Pages rebuilds and deploys automatically after every commit (about a minute).

Useful details:

- **Slugs / URLs**: the file name is generated from the title (lowercased, hyphenated) and becomes
  the URL slug. Fill in the optional **Slug** field to override it. Slugs must be unique.
- **Posts** get their **Publish date** set to "now" when created; edit it freely.
- **Categories** are hierarchical (set a *Parent category*); a parent's page lists posts from its
  sub-categories too. **Tags** are flat and shared by posts, projects, services and resources.
  Create tags/categories first, then pick them from the reference field.
- **Cover image**: pick an image from the media library and fill in the **Alt text**.
- **Attachments** (projects, resources): any file from the media library, e.g. a PDF.
- **Authors**: create one entry per person in *Settings → Authors* (name, avatar, social links,
  bio). Pick the author on each entry. Author pages are served at `/authors/<slug>/`.
- **Site settings**: name, tagline, meta description, logo, favicon, social image, footer text,
  social links, and raw HTML injected into the `<head>` and before `</body>` of every page.
- **Permalinks**: the URL prefix for each content type. Empty = site root (default for pages).
- A page with the slug `home` is rendered at the top of the homepage.
- **Version history**: every save is a commit, so `git log` / GitHub history is the version history.

## Local development

```sh
npm install
npm run dev        # http://localhost:4321 (drafts are shown)
npm run build      # production build to dist/ (drafts hidden)
npm run preview    # serve dist/
npm run check      # type-check
```

To preview drafts in a build: `SHOW_DRAFTS=true npm run build`.

## Deploying to Cloudflare Pages

Connect the GitHub repository to Cloudflare Pages (Workers & Pages → Create → Pages → Connect to Git)
with these settings:

| Setting            | Value           |
| ------------------ | --------------- |
| Framework preset   | Astro           |
| Build command      | `npm run build` |
| Build output dir   | `dist`          |
| Node version       | 22 (read from `.node-version`) |

No environment variables or secrets are required. Optional variables:

| Variable      | Purpose                                                                                 |
| ------------- | --------------------------------------------------------------------------------------- |
| `SITE_URL`    | Absolute site URL for canonical/Open Graph tags. Defaults to Cloudflare's `CF_PAGES_URL`. Set it to your custom domain once you have one. |
| `SHOW_DRAFTS` | `true` to include drafts (e.g. on a preview branch). Defaults to `false`.               |

## Project layout

```
.pages.yml                  Pages CMS configuration (collections, fields, media, globals, sidebar)
src/content.config.ts       Astro content collections mirroring .pages.yml
src/content/
  pages/ posts/ projects/ services/ resources/   Markdown entries (frontmatter + rich text body)
  categories/ tags/                              YAML entries
  authors/                                       Markdown entries (bio in body)
  settings/site.yml, permalinks.yml              Globals
public/media/               Shared media library (images, PDFs, ...)
src/lib/content.ts          Content helpers (drafts, permalinks, taxonomy)
src/pages/index.astro       Homepage
src/pages/[...path].astro   Every other CMS-driven URL, built from the Permalinks settings
src/views/*.astro           Page templates (entry, listing, category, tag, author)
src/layouts/Base.astro      Site layout (head tags, nav, footer, script injection)
```
