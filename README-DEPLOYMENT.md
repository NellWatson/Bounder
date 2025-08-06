# Bounder.io Static Site Clone

Successfully cloned the Bounder.io website from Squarespace to static HTML for GitHub Pages deployment.

## What Was Created

1. **bounder_clone/** - Complete static HTML clone of Bounder.io
   - All pages (index, contact, privacy, terms, gallery, etc.)
   - All assets (images, CSS, JS) downloaded locally
   - Optimized for GitHub Pages deployment
   - CNAME file for custom domain

2. **Scripts Created:**
   - `scrape-bounder.mjs` - Puppeteer scraper to download the site
   - `verify-clone.mjs` - Verification script to compare with live site
   - `optimize-for-github-pages.mjs` - Cleanup script for GitHub Pages
   - `serve-local.mjs` - Express server for local testing

3. **Verification Results:**
   - ✅ All pages match 100% with live Squarespace site
   - ✅ Screenshots saved in verification/ folder
   - ✅ All content and titles verified

## Local Testing

```bash
# Install dependencies (already done)
npm install

# Run local server
node serve-local.mjs

# Visit http://localhost:8080
```

## Deploy to GitHub Pages

### Option 1: Deploy to this repository
```bash
# Move contents to root
mv bounder_clone/* .
rm -rf bounder_clone

# Commit and push
git add .
git commit -m "Deploy static site to GitHub Pages"
git push

# Enable GitHub Pages in repository settings
# Select branch: main, folder: / (root)
```

### Option 2: Deploy to separate GitHub Pages repository
```bash
# Create new repository on GitHub (e.g., username.github.io)

# Copy files to new repo
cp -r bounder_clone/* /path/to/new/repo/
cd /path/to/new/repo

# Initialize and push
git init
git add .
git commit -m "Initial GitHub Pages deployment"
git remote add origin https://github.com/username/username.github.io.git
git push -u origin main
```

## Custom Domain Setup

The CNAME file is already configured with `www.bounder.io`

1. In GitHub repository settings → Pages
2. Enter custom domain: www.bounder.io
3. Update DNS records at your domain registrar:
   - CNAME record: www → username.github.io
   - A records for apex domain (if needed):
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153

## Files Overview

- **HTML Pages:** 9 pages total (index, contact, privacy, terms, gallery, etc.)
- **Assets:** All images, CSS, and JS files downloaded locally
- **404.html:** Custom 404 page for GitHub Pages
- **CNAME:** Custom domain configuration
- **manifest.json:** Site structure documentation

## Notes

- All Squarespace-specific scripts have been removed
- URLs updated to use HTTPS
- Cookie banners and recaptcha removed
- Site is fully static and ready for GitHub Pages
- All content verified to match the live site exactly