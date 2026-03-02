# GitHub Pages Setup Guide

This document explains how the documentation site is configured and how to enable it.

## How It Works

The documentation uses **Jekyll** (GitHub's static site generator) with GitHub Pages to automatically build and deploy the site.

## Configuration Files

### Jekyll Configuration

- **`_config.yml`** - Main Jekyll configuration with site metadata
- **`Gemfile`** - Specifies the `github-pages` gem for Jekyll dependencies
- **`_layouts/default.html`** - Custom HTML template with Bootstrap styling

### Domain Configuration

The site uses the default GitHub Pages URL: `https://mrded.github.io/fixtures-ts/`

## Enabling GitHub Pages

1. Push the `docs/` folder to your repository:

   ```bash
   git add docs/
   git commit -m "Add documentation site"
   git push
   ```

2. In your GitHub repository, go to **Settings** → **Pages**

3. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: Select your main branch (e.g., `main` or `master`)
   - **Folder**: Select `/docs`

4. Click **Save**

5. GitHub will automatically build and deploy your site

## Site URL

Your documentation site will be available at:

```
https://mrded.github.io/fixtures-ts/
```

### Optional: Custom Domain

If you want to use a custom domain in the future:

1. Create a `CNAME` file in the `docs/` folder with your domain:

   ```
   docs.fixtures-ts.com
   ```

2. In your DNS provider, add a CNAME record:

   ```
   docs.fixtures-ts.com → mrded.github.io
   ```

3. In GitHub repository settings → Pages, configure your custom domain

## Local Development

To preview the site locally before pushing:

```bash
# Install dependencies (first time only)
cd docs
bundle install

# Run Jekyll server
bundle exec jekyll serve

# Open http://localhost:4001
```

## File Structure

```
docs/
├── _config.yml           # Jekyll configuration
├── _layouts/             # HTML templates
│   └── default.html
├── assets/               # CSS and static files
│   └── css/
│       └── style.scss
├── index.md              # Homepage
├── getting-started.md    # Installation, quick start, and API reference
├── file-organization.md  # Practical patterns for larger projects
├── CNAME                 # Custom domain (optional)
└── Gemfile               # Ruby dependencies
```

## Adding New Pages

1. Create a new `.md` file in the appropriate directory

2. Add front matter at the top:

   ```markdown
   ---
   title: Page Title
   ---

   ## Your Content
   ```

3. Update `_layouts/default.html` to add the page to the navigation sidebar

4. Commit and push - GitHub Pages will automatically rebuild

## Troubleshooting

### Build Failures

Check the **Actions** tab in your GitHub repository to see build logs.

### 404 Errors

Make sure:

- GitHub Pages is enabled in repository settings
- The `docs/` folder is selected as the source
- You're using the correct URL

### Styling Issues

The site uses Bootstrap 5.3.3 (loaded via jsDelivr CDN). Custom CSS is in `docs/assets/css/style.scss`.

## Resources

- [GitHub Pages Documentation](https://docs.github.com/pages)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Markdown Guide](https://www.markdownguide.org/)
