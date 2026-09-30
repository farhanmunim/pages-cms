import { defineConfig, envField } from 'astro/config';

// Static site: no adapter needed for Cloudflare Pages.
// CF_PAGES_URL is provided automatically by Cloudflare Pages at build time
// and is used for absolute URLs (canonical, Open Graph).
export default defineConfig({
  site: process.env.SITE_URL || process.env.CF_PAGES_URL || 'http://localhost:4321',
  env: {
    schema: {
      // Set SHOW_DRAFTS=true (e.g. on a Cloudflare Pages preview branch) to
      // include draft content in the build. Defaults to false.
      SHOW_DRAFTS: envField.boolean({ context: 'server', access: 'public', default: false }),
    },
  },
});
