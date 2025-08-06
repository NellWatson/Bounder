import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'bounder_enhanced');

console.log('🚀 Creating ENHANCED perfect clone with external link fixes...\n');

async function downloadAsset(url, localPath) {
  try {
    const outputPath = path.join(OUTPUT_DIR, localPath);
    if (await fs.pathExists(outputPath)) return true;
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, response.data);
    console.log(`  ✅ Downloaded: ${path.basename(url)}`);
    return true;
  } catch (error) {
    console.log(`  ⚠️ Could not download: ${url.substring(0, 60)}...`);
    return false;
  }
}

async function clonePageEnhanced(url, filename) {
  console.log(`\n📄 Cloning ${filename}...`);
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    protocolTimeout: 120000
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Capture all network resources
  const resources = new Map();
  
  await page.setRequestInterception(true);
  page.on('request', request => {
    request.continue();
  });
  
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    
    if (status === 200 || status === 304) {
      try {
        const buffer = await response.buffer();
        resources.set(url, buffer);
      } catch (e) {
        // Some resources might not be bufferable
      }
    }
  });
  
  // Navigate to the page
  console.log(`  Navigating to ${url}...`);
  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  
  // Wait for everything to render
  console.log('  Waiting for full render...');
  await new Promise(r => setTimeout(r, 8000));
  
  // Scroll to load all lazy content
  await page.evaluate(() => {
    return new Promise(resolve => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Capture all CSS and computed styles
  console.log('  Capturing styles...');
  const allStyles = await page.evaluate(() => {
    let css = '';
    
    // Get all stylesheet contents
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of rules) {
          css += rule.cssText + '\n';
        }
      } catch (e) {
        console.log('Could not access stylesheet:', sheet.href);
      }
    }
    
    // Apply inline styles to preserve rendering
    const elementsToStyle = document.querySelectorAll('*');
    elementsToStyle.forEach(el => {
      const computed = window.getComputedStyle(el);
      const importantProps = [
        'display', 'position', 'top', 'left', 'right', 'bottom',
        'width', 'height', 'margin', 'padding', 'border',
        'background', 'background-color', 'background-image', 
        'background-size', 'background-position', 'background-repeat',
        'color', 'font-family', 'font-size', 'font-weight', 'line-height',
        'text-align', 'opacity', 'visibility', 'z-index',
        'transform', 'overflow', 'flex', 'grid'
      ];
      
      let inlineStyle = '';
      importantProps.forEach(prop => {
        const value = computed.getPropertyValue(prop);
        if (value && value !== 'none' && value !== 'auto' && value !== '0px') {
          inlineStyle += `${prop}: ${value}; `;
        }
      });
      
      if (inlineStyle) {
        el.setAttribute('style', (el.getAttribute('style') || '') + '; ' + inlineStyle);
      }
    });
    
    return css;
  });
  
  // Get the final HTML
  const html = await page.content();
  
  // Process with Cheerio
  const $ = cheerio.load(html);
  
  // Remove problematic scripts
  $('script').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src');
    const content = $el.html();
    
    if (src && (src.includes('recaptcha') || src.includes('grecaptcha'))) {
      $el.remove();
    } else if (content && (content.includes('Squarespace.afterBodyLoad') || 
                          content.includes('Y.Squarespace'))) {
      $el.remove();
    }
  });
  
  // Add captured CSS
  $('head').append(`
    <style id="captured-styles">
      ${allStyles}
    </style>
  `);
  
  // Add enhanced fallback styles
  $('head').append(`
    <style id="enhanced-fallback">
      * { visibility: visible !important; }
      body { 
        margin: 0; 
        font-family: proxima-nova, -apple-system, BlinkMacSystemFont, sans-serif;
      }
      img { max-width: 100%; height: auto; }
      .loaded { opacity: 1 !important; }
      
      /* Ensure Bounder logo and navigation are visible */
      header, nav, .header-inner, .header-display-desktop {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Fix hero text visibility */
      .title-desc-wrapper, .page-title, .page-description {
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Ensure content sections are visible */
      .content, .content-wrapper, .site-inner-wrapper {
        opacity: 1 !important;
        visibility: visible !important;
      }
    </style>
  `);
  
  // Download and save all resources
  console.log('  Processing assets...');
  const assetMap = new Map();
  
  for (const [url, buffer] of resources.entries()) {
    try {
      const urlObj = new URL(url);
      const localPath = path.join('assets', urlObj.hostname, urlObj.pathname);
      const outputPath = path.join(OUTPUT_DIR, localPath);
      
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, buffer);
      assetMap.set(url, localPath);
    } catch (e) {
      // Invalid URL
    }
  }
  
  // Update all asset references
  $('link[href], script[src], img[src], img[data-src], img[data-image], source[srcset]').each((_, el) => {
    const $el = $(el);
    const attrs = ['href', 'src', 'data-src', 'data-image', 'srcset'];
    
    attrs.forEach(attr => {
      const value = $el.attr(attr);
      if (value) {
        // Handle different URL formats
        let urls = [value];
        if (attr === 'srcset') {
          urls = value.split(',').map(u => u.trim().split(' ')[0]);
        }
        
        urls.forEach(url => {
          if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
            const fullUrl = url.startsWith('//') ? 'https:' + url : url;
            const localPath = assetMap.get(fullUrl);
            
            if (localPath) {
              if (attr === 'srcset') {
                $el.attr(attr, value.replace(url, localPath));
              } else {
                $el.attr(attr, localPath);
              }
            } else {
              // Try to compute local path
              try {
                const urlObj = new URL(fullUrl);
                const computedPath = path.join('assets', urlObj.hostname, urlObj.pathname);
                $el.attr(attr, computedPath);
              } catch (e) {
                // Keep original
              }
            }
          }
        });
      }
    });
  });
  
  // Update inline style background images
  $('[style*="background-image"]').each((_, el) => {
    const $el = $(el);
    let style = $el.attr('style');
    
    // Extract and replace URLs
    const urlMatches = style.match(/url\(['"]?(https?:\/\/[^'")]+)['"]?\)/g);
    if (urlMatches) {
      urlMatches.forEach(match => {
        const url = match.match(/url\(['"]?(https?:\/\/[^'")]+)['"]?\)/)[1];
        const localPath = assetMap.get(url);
        
        if (localPath) {
          style = style.replace(match, `url('${localPath}')`);
        } else {
          try {
            const urlObj = new URL(url);
            const computedPath = path.join('assets', urlObj.hostname, urlObj.pathname);
            style = style.replace(match, `url('${computedPath}')`);
          } catch (e) {
            // Keep original
          }
        }
      });
      $el.attr('style', style);
    }
  });
  
  // IMPORTANT: Add target="_blank" to all external links
  console.log('  Adding target="_blank" to external links...');
  $('a[href]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    
    if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//'))) {
      // Check if it's an external link (not bounder.io)
      if (!href.includes('bounder.io')) {
        $el.attr('target', '_blank');
        $el.attr('rel', 'noopener noreferrer');
        console.log(`    Added target="_blank" to: ${href}`);
      }
    }
  });
  
  // Save the HTML
  const outputPath = path.join(OUTPUT_DIR, filename);
  await fs.writeFile(outputPath, $.html());
  
  // Take screenshot
  const screenshotPath = path.join(OUTPUT_DIR, 'screenshots', filename.replace('.html', '.png'));
  await fs.ensureDir(path.dirname(screenshotPath));
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  await browser.close();
  console.log(`  ✅ Saved ${filename}`);
  
  return true;
}

async function createEnhancedClone() {
  // Prepare output directory
  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(path.join(OUTPUT_DIR, 'assets'));
  await fs.ensureDir(path.join(OUTPUT_DIR, 'screenshots'));
  
  // Clone all pages
  const pages = [
    { url: 'https://www.bounder.io/', filename: 'index.html' },
    { url: 'https://www.bounder.io/contact', filename: 'contact.html' },
    { url: 'https://www.bounder.io/privacy', filename: 'privacy.html' },
    { url: 'https://www.bounder.io/new-page', filename: 'terms.html' },
    { url: 'https://www.bounder.io/gallery-shift', filename: 'gallery-shift.html' },
    { url: 'https://www.bounder.io/ride-to-live-shift', filename: 'ride-to-live-shift.html' }
  ];
  
  for (const page of pages) {
    await clonePageEnhanced(page.url, page.filename);
  }
  
  // Create additional files
  console.log('\n📝 Creating additional files...');
  
  // 404 page
  const indexContent = await fs.readFile(path.join(OUTPUT_DIR, 'index.html'), 'utf-8');
  await fs.writeFile(path.join(OUTPUT_DIR, '404.html'), indexContent);
  
  // CNAME for GitHub Pages
  await fs.writeFile(path.join(OUTPUT_DIR, 'CNAME'), 'www.bounder.io');
  
  // Simple server script
  await fs.writeFile(path.join(OUTPUT_DIR, 'serve.js'), `
const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`);
});
  `);
  
  // Create .nojekyll file for GitHub Pages
  await fs.writeFile(path.join(OUTPUT_DIR, '.nojekyll'), '');
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ ENHANCED CLONE COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📁 Files saved to: ${OUTPUT_DIR}`);
  console.log('\n✅ All external links now open in new tabs');
  console.log('\nTo test locally:');
  console.log('  cd bounder_enhanced');
  console.log('  python3 -m http.server 8080');
  console.log('  open http://localhost:8080');
  console.log('\n💡 Or use Node.js:');
  console.log('  cd bounder_enhanced');
  console.log('  npm install express');
  console.log('  node serve.js');
  console.log('\n📦 Ready for GitHub Pages deployment!');
}

// Run the enhanced clone
createEnhancedClone().catch(console.error);