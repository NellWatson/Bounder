import fs from 'fs-extra';
import path from 'node:path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLONE_DIR = path.join(__dirname, 'bounder_clone');

async function downloadAsset(url, outputPath) {
  try {
    console.log(`  Downloading: ${url.substring(0, 80)}...`);
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, response.data);
    console.log(`  ✅ Saved to: ${path.relative(CLONE_DIR, outputPath)}`);
    return true;
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    return false;
  }
}

async function fixAssets() {
  console.log('🔧 Fixing CSS and asset loading issues...\n');
  
  // Critical CSS files that need to be downloaded
  const cssUrls = [
    'https://static1.squarespace.com/static/sitecss/55acf641e4b0b8a3dbbdbd91/57/515c7bd0e4b054dae3fcf003/55acf641e4b0b8a3dbbdbd9b/2787/site.css',
    'https://definitions.sqspcdn.com/website-component-definition/static-assets/website.components.spacer/0e73a771-ce32-41b5-9d75-603ebb01b823_108/website.components.spacer.styles.css',
    'https://assets.squarespace.com/universal/scripts-compressed/../styles-compressed/5fc7a936d9b12c49-min.en-US.css'
  ];
  
  // Download CSS files
  console.log('📥 Downloading missing CSS files...');
  for (const url of cssUrls) {
    const urlObj = new URL(url);
    const outputPath = path.join(CLONE_DIR, 'assets', urlObj.hostname, urlObj.pathname);
    await downloadAsset(url, outputPath);
  }
  
  // Get all HTML files
  const htmlFiles = await fs.readdir(CLONE_DIR);
  const htmlFilePaths = htmlFiles
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(CLONE_DIR, f));
  
  console.log('\n📝 Updating HTML files...');
  
  for (const filePath of htmlFilePaths) {
    const fileName = path.basename(filePath);
    console.log(`  Processing ${fileName}...`);
    
    let html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);
    
    // Update external CSS links to local paths
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        try {
          const url = new URL(href);
          const localPath = path.join('assets', url.hostname, url.pathname);
          $(el).attr('href', localPath);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });
    
    // Update script sources
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('//')) {
        $(el).attr('src', 'https:' + src);
      }
    });
    
    // Fix font loading - download Adobe Typekit fonts CSS
    $('script[src*="use.typekit.net"]').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('assets/')) {
        // Keep typekit as external for now since it requires special handling
        $(el).attr('src', src.startsWith('//') ? 'https:' + src : src);
      }
    });
    
    // Ensure images load from local paths
    $('img[src^="https://images.squarespace-cdn.com"]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        const localSrc = src.replace('https://images.squarespace-cdn.com', 'assets/images.squarespace-cdn.com');
        $(el).attr('src', localSrc);
      }
    });
    
    // Fix data-image attributes
    $('[data-image^="https://images.squarespace-cdn.com"]').each((_, el) => {
      const dataImage = $(el).attr('data-image');
      if (dataImage) {
        const localImage = dataImage.replace('https://images.squarespace-cdn.com', 'assets/images.squarespace-cdn.com');
        $(el).attr('data-image', localImage);
      }
    });
    
    // Add fallback styles to ensure basic visibility
    if (!$('style#fallback-styles').length) {
      $('head').append(`
<style id="fallback-styles">
  body { 
    margin: 0; 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #fff;
    color: #333;
  }
  .site-wrapper { min-height: 100vh; }
  img { max-width: 100%; height: auto; }
  .loaded { opacity: 1 !important; }
  * { visibility: visible !important; }
</style>`);
    }
    
    await fs.writeFile(filePath, $.html());
    console.log(`  ✅ Updated ${fileName}`);
  }
  
  console.log('\n✅ Asset fixes complete!');
  console.log('🔄 Restart the server and run visual comparison again.');
}

// Run the fix
fixAssets().catch(console.error);