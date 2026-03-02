# fixtures-ts Documentation

This directory contains the documentation site for fixtures-ts, built with Jekyll and hosted on GitHub Pages.

## Local Development

To run the documentation site locally:

1. Install Ruby and Bundler:

   ```bash
   gem install bundler
   ```

2. Install dependencies:

   ```bash
   cd docs
   bundle install
   ```

3. Run the Jekyll server:

   ```bash
   bundle exec jekyll serve
   ```

4. Open http://localhost:4001 in your browser

## Structure

- `_config.yml` - Jekyll configuration
- `_layouts/` - Page templates
- `assets/` - CSS and other static assets
- `index.md` - Homepage
- `getting-started.md` - Installation, quick start, and API reference
- `file-organization.md` - Practical patterns for larger projects

## Publishing

The site is automatically published to GitHub Pages when changes are pushed to the repository. GitHub Pages builds the site using Jekyll.

### Custom Domain

To use a custom domain, update the `CNAME` file with your domain name, or remove it to use the default `username.github.io/repo-name` URL.

### GitHub Pages Settings

In your repository settings, configure GitHub Pages to build from the `docs/` folder on your main branch.

## Editing

Documentation is written in Markdown with front matter:

```markdown
---
title: Page Title
---

## Content

Your markdown content here...
```

The layout is automatically applied to all pages via `_layouts/default.html`.
