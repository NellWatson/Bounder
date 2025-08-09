# Slana Website Clone

This is a local clone of www.slana.org - a website about psychedelic therapies for trauma treatment.

## Structure

```
.
├── slana_clone/          # The cloned website files
│   ├── index.html        # Main HTML file
│   ├── assets/           # All images, CSS, and JS files
│   └── index.json        # Manifest of scraped pages
├── server.js             # Local development server
├── scrape.mjs            # Website scraping script
└── Squarespace-Wordpress-Export-07-25-2025.xml  # Original site export
```

## Running Locally

To view the website locally:

```bash
node server.js
```

Then open http://localhost:8080 in your browser.

## Private Hosting Options

Here are some cost-effective private hosting alternatives to Squarespace:

### Free Options:
1. **GitHub Pages** - Free static site hosting (public repos only)
2. **Netlify** - Free tier with 100GB bandwidth/month
3. **Vercel** - Free tier for personal projects
4. **Cloudflare Pages** - Unlimited bandwidth on free tier

### Low-Cost Options:
1. **DigitalOcean** - $4/month for basic droplet
2. **Linode** - $5/month for basic VPS
3. **AWS S3 + CloudFront** - Pay per usage, typically <$5/month for small sites
4. **Firebase Hosting** - Free tier generous, then pay-as-you-go

### Recommended for Your Use Case:
Since this is a single-page static site, I recommend:
- **Netlify** or **Vercel** for easy deployment with custom domain support
- Both offer free SSL certificates and global CDN
- Simple drag-and-drop or Git-based deployment

## Deployment

### GitHub Pages (Recommended - Free)
1. Create a new repository on GitHub
2. Push this code to the repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/slana.git
   git branch -M main
   git push -u origin main
   ```
3. Go to Settings → Pages in your GitHub repository
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click Save
7. Your site will be available at: `https://YOUR_USERNAME.github.io/slana/`

To use a custom domain:
- Add a CNAME file with your domain (e.g., `www.slana.org`)
- Configure your domain's DNS to point to GitHub Pages

### For Netlify:
1. Sign up at netlify.com
2. Drag the `slana_clone` folder to their dashboard
3. Your site will be live immediately
4. Add a custom domain in settings

### For Vercel:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the `slana_clone` directory
3. Follow the prompts to deploy