# Treanor Digital site

The treanordigital.com website. Static HTML, CSS and JS, no build step, deployed on Netlify (`netlify.toml` publishes the repo root).

## Layout

- `index.html` is the homepage
- `about/`, `apps/`, `perspectives/`, `privacy/`, `services/`, `seo-aeo-geo-audit/` hold the subpages
- `assets/` holds `style.css`, `main.js`, self-hosted fonts and images
- `robots.txt`, `sitemap.xml`, `llms.txt` and the favicons/OG image sit at the root

## Local preview

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## History

Moved out of the `AI-Workspace` repo on Nov 27, 2026 with `git subtree split`, so the commits from the brand identity through site v7 are kept here.
