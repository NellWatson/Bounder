# Bounder.io - Static Site Clone

This repository contains a static HTML clone of the Bounder.io website, converted from Squarespace to run on GitHub Pages.

## 📁 Project Structure

- `/bounder_clone` - Main website directory containing all HTML pages and assets
  - `index.html` - Homepage
  - `contact.html` - Contact page
  - `privacy.html` - Privacy Policy
  - `terms.html` - Terms & Conditions (originally `/new-page`)
  - `/assets` - All CSS, JavaScript, and image assets
  - `CNAME` - Custom domain configuration for GitHub Pages
  - `.nojekyll` - Prevents Jekyll processing

- `/screenshots` - Visual comparison between original and cloned site
- `/Backport` - Original backup files
- `Squarespace-Wordpress-Export-07-26-2025.xml` - Source XML export from Squarespace

## 🚀 Deployment to GitHub Pages

### Method 1: Direct Deployment (Recommended)
1. Push this repository to GitHub
2. Go to Settings → Pages
3. Set Source to "Deploy from a branch"
4. Select branch: `main` (or your default branch)
5. Select folder: `/bounder_clone`
6. Click Save

The site will be available at:
- Custom domain: `http://bounder.io` (if CNAME is configured)
- GitHub Pages URL: `https://[your-username].github.io/Bounder/bounder_clone`

### Method 2: Using GitHub Actions
You can also set up GitHub Actions for automatic deployment when you push changes.

## 🛠️ Development Scripts

### Install Dependencies
```bash
npm install
```

### Parse XML Content
```bash
npm run parse-xml
```

### Scrape Live Site
```bash
npm run scrape
```

### Full Build
```bash
npm run build
```

### Verify Clone
```bash
node verify-clone.mjs
```

## 📋 Features

- ✅ All main pages converted from Squarespace
- ✅ Assets downloaded and linked locally
- ✅ Responsive design preserved
- ✅ Contact forms (structure preserved, backend integration needed)
- ✅ GitHub Pages ready

## ⚠️ Notes

- Contact forms are preserved but require backend integration (e.g., Formspree, Netlify Forms)
- Some Typekit fonts may not load due to licensing restrictions
- Newsletter signup requires email service integration
- Analytics and tracking scripts have been preserved but may need updating

## 🔧 Customization

To modify the site:
1. Edit HTML files directly in `/bounder_clone`
2. Update styles in the embedded CSS or external stylesheets
3. Modify navigation links as needed
4. Add or remove pages by creating new HTML files

## 📊 Verification

Screenshots comparing the original and cloned site are available in the `/screenshots` directory for quality assurance.

## 📞 Support

For issues or questions about the clone, please open an issue in this repository.

## 📄 License

The Bounder technology has been released as free and open source under the MIT License.

---

*This static clone was created to preserve the Bounder.io website content and make it available on GitHub Pages.*