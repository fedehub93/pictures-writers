# 05 — Take the brand out of the code

Status: ready-for-agent
Blocked by: 01

## Problem

The first site's brand is compiled into the product: UploadThing origin, host suffixes, contact email, redirects, static sitemap paths, `robots` disallow list, `llms.txt` copy, JSON-LD founder and country, `lang`, `locale`, 23 files in `public/`, and the `"Pictures Writers"` defaults in `getSettings()`.

## What

In this order, because reversing it breaks the running site:

1. Add the Installation-settings fields that will hold these values and seed them from the current constants for the first Installation: `contactEmail`, `locale`, `defaultCountry`, `llmsExtra`, `logoUrl`, organisation JSON-LD fields.
2. Move the brand assets out of `public/` only after `Settings.logoUrl` points at uploaded media, and only after the JSON-LD stops hardcoding `/logo.png`.
3. Configure the `/ebooks/*` and `/concorso-tre-colori-2025/` redirects at the proxy, then delete them from `next.config.mjs`.
4. Generate `llms.txt` and `llms-full.txt` from settings and published pages, appending `Settings.llmsExtra`; drop the hardcoded copy.
5. Replace `UPLOADTHING_FILE_ORIGIN` and the host suffixes with configuration (see ticket 02).
6. Replace the `"Pictures Writers"` defaults in `src/data/settings.ts` and the corresponding `Seo` defaults with neutral ones.
7. Add a CI check that fails when `pictureswriters` appears in `src/`, `prisma/`, `public/`, `next.config.mjs`.

## Done when

- `grep -ri pictureswriters src/ prisma/ public/ next.config.mjs` returns nothing and CI enforces it.
- The first Installation renders identical metadata, JSON-LD, contact email, sitemap and `llms.txt` from the database.
- A fresh Installation has no trace of any brand.

## Production impact

**The riskiest ticket.** Each deletion must come after its replacement is live and verified. Never merge step 2 and step 3 in the same deploy.
