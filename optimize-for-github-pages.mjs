import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLONE_DIR = path.join(__dirname, 'bounder_clone');

async function optimizeForGitHubPages() {
  console.log('🔧 Optimizing site for GitHub Pages deployment...\n');
  
  // Get all HTML files
  const htmlFiles = await fs.readdir(CLONE_DIR);
  const htmlFilePaths = htmlFiles
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(CLONE_DIR, f));
  
  for (const filePath of htmlFilePaths) {
    const fileName = path.basename(filePath);
    console.log(`Processing ${fileName}...`);
    
    try {
      let html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html);
      
      // Remove Squarespace-specific scripts
      $('script:contains("SQUARESPACE")').remove();
      $('script:contains("Y.Squarespace")').remove();
      $('script[src*="squarespace.com"]').each((_, el) => {
        const src = $(el).attr('src');
        if (!src.includes('static') && !src.includes('universal')) {
          $(el).remove();
        }
      });
      
      // Remove recaptcha if not needed
      $('script[src*="recaptcha"]').remove();
      $('.grecaptcha-badge').remove();
      
      // Remove cookie banner code
      $('.cookie-banner-mount-point').remove();
      $('.cookie-banner-manager').remove();
      
      // Fix base href
      $('base').attr('href', '/');
      
      // Update canonical URLs to use GitHub Pages domain
      $('link[rel="canonical"]').attr('href', (i, href) => {
        if (href) {
          return href.replace('http://www.bounder.io', 'https://www.bounder.io');
        }
        return href;
      });
      
      // Update meta og:url
      $('meta[property="og:url"]').attr('content', (i, content) => {
        if (content) {
          return content.replace('http://www.bounder.io', 'https://www.bounder.io');
        }
        return content;
      });
      
      // Fix any absolute URLs to use HTTPS
      $('a[href^="http://www.bounder.io"]').each((_, el) => {
        const href = $(el).attr('href');
        $(el).attr('href', href.replace('http://', 'https://'));
      });
      
      // Remove Squarespace edit/admin elements
      $('[data-content-field]').removeAttr('data-content-field');
      $('[data-annotation-alignment]').removeAttr('data-annotation-alignment');
      $('[data-edit-main-image]').removeAttr('data-edit-main-image');
      
      // Add viewport meta if missing
      if (!$('meta[name="viewport"]').length) {
        $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1">');
      }
      
      // Save optimized HTML
      await fs.writeFile(filePath, $.html());
      console.log(`  ✅ Optimized ${fileName}`);
      
    } catch (error) {
      console.error(`  ❌ Error processing ${fileName}:`, error.message);
    }
  }
  
  // Create a simple index.json for the manifest
  const manifest = {
    name: "Bounder",
    description: "Technology for making sure that drones stay only where they belong",
    pages: htmlFilePaths.map(p => path.basename(p)),
    optimized: true,
    timestamp: new Date().toISOString()
  };
  
  await fs.writeFile(
    path.join(CLONE_DIR, 'site-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('\n✅ Optimization complete!');
  console.log('📦 Site is ready for GitHub Pages deployment');
  console.log('\nNext steps:');
  console.log('1. Move contents of bounder_clone/ to your GitHub Pages repository');
  console.log('2. Commit and push to GitHub');
  console.log('3. Enable GitHub Pages in repository settings');
  console.log('4. Configure custom domain if needed');
}

// Run optimization
optimizeForGitHubPages().catch(console.error);