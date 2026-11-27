# Treanor Digital site

The treanordigital.com website. Static HTML, CSS and JS, no build step, deployed on Netlify (`netlify.toml` publishes the repo root).

## Layout

- `index.html` is the homepage
- `about/`, `apps/`, `perspectives/`, `privacy/`, `services/`, `seo-aeo-geo-audit/` hold the subpages
- `assets/` holds `style.css`, `main.js`, self-hosted fonts and images
- `robots.txt`, `sitemap.xml`, `llms.txt` and the favicons/OG image sit at the root

## Design

v8 uses the 07 Exo direction (Exo Ape inspired): ink `#101114` / `#16181C`, warm off-white `#E6E2DC`, light ground `#F4F4F2`, signal orange `#ED3F1C` for small square markers only. One typeface, Inter Tight (self-hosted variable woff2, SIL OFL). Tokens live at the top of `assets/style.css`.

Hero and about photos are Unsplash placeholders (corridor by Paul Hanaoka, desk by Nikita Kachanovsky) until real workspace photos replace them.

## Local preview

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## History

Moved out of the `AI-Workspace` repo on Nov 27, 2026 with `git subtree split`, so the commits from the brand identity through site v7 are kept here.
