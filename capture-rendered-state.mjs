import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'bounder_perfect_clone');

console.log('🎯 Starting PERFECT clone capture with rendered state...\n');

async function downloadResource(url, outputPath) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, response.data);
    return true;
  } catch (error) {
    console.log(`  ❌ Failed to download: ${url.substring(0, 60)}...`);
    return false;
  }
}

async function captureRenderedPage(browser, url, outputName) {
  console.log(`📸 Capturing ${outputName}...`);
  const page = await browser.newPage();
  
  // Set viewport and user agent
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Intercept and modify responses to work offline
  await page.setRequestInterception(true);
  
  const resources = new Map();
  
  page.on('request', request => {
    request.continue();
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (response.status() === 200) {
      try {
        if (url.includes('.css') || url.includes('.js') || url.includes('.woff') || url.includes('.ttf')) {
          const buffer = await response.buffer();
          resources.set(url, buffer);
        }
      } catch (e) {
        // Some resources might not be accessible
      }
    }
  });
  
  // Navigate and wait for full render
  await page.goto(url, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 60000
  });
  
  // Wait for fonts and animations
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Force all lazy-loaded images to load
  await page.evaluate(() => {
    // Scroll to trigger lazy loading
    window.scrollTo(0, document.body.scrollHeight);
    
    // Force load all images
    document.querySelectorAll('img[data-src]').forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
    
    // Wait for images
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve;
        }))
    );
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Capture the fully rendered HTML with inline styles
  const renderedHTML = await page.evaluate(() => {
    // Get all computed styles for every element
    function getInlineStyles(element) {
      const computed = window.getComputedStyle(element);
      let styles = '';
      
      // Critical styles to preserve
      const importantProps = [
        'display', 'position', 'top', 'left', 'right', 'bottom',
        'width', 'height', 'margin', 'padding', 'border',
        'background', 'background-color', 'background-image', 'background-size', 'background-position',
        'color', 'font-family', 'font-size', 'font-weight', 'line-height',
        'text-align', 'opacity', 'visibility', 'z-index',
        'transform', 'transition', 'overflow', 'flex', 'grid'
      ];
      
      for (const prop of importantProps) {
        const value = computed.getPropertyValue(prop);
        if (value && value !== 'none' && value !== 'auto' && value !== '0px') {
          styles += `${prop}: ${value}; `;
        }
      }
      
      return styles;
    }
    
    // Apply inline styles to all elements
    document.querySelectorAll('*').forEach(el => {
      const styles = getInlineStyles(el);
      if (styles) {
        el.setAttribute('style', (el.getAttribute('style') || '') + '; ' + styles);
      }
    });
    
    // Get all stylesheets content
    let allCSS = '';
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of rules) {
          allCSS += rule.cssText + '\n';
        }
      } catch (e) {
        // Cross-origin stylesheets might not be accessible
        // Try to fetch them
        if (sheet.href) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          document.head.appendChild(link);
        }
      }
    }
    
    // Add critical styles inline
    const styleTag = document.createElement('style');
    styleTag.textContent = allCSS;
    document.head.appendChild(styleTag);
    
    // Remove scripts that might break offline
    document.querySelectorAll('script[src*="squarespace.com"]').forEach(s => {
      if (!s.src.includes('static')) s.remove();
    });
    document.querySelectorAll('script:not([src])').forEach(s => {
      if (s.textContent.includes('Squarespace') || s.textContent.includes('YUI')) {
        s.remove();
      }
    });
    
    return document.documentElement.outerHTML;
  });
  
  // Download all resources found
  for (const [url, buffer] of resources.entries()) {
    try {
      const urlObj = new URL(url);
      const resourcePath = path.join(OUTPUT_DIR, 'assets', urlObj.hostname, urlObj.pathname);
      await fs.ensureDir(path.dirname(resourcePath));
      await fs.writeFile(resourcePath, buffer);
    } catch (e) {
      // Invalid URL or write error
    }
  }
  
  // Process HTML to update asset paths
  const $ = cheerio.load(renderedHTML);
  
  // Update all external resource URLs to local paths
  const elementsToProcess = [];
  $('link[href], script[src], img[src], img[data-src], img[data-image]').each((_, el) => {
    elementsToProcess.push(el);
  });
  
  for (const el of elementsToProcess) {
    const $el = $(el);
    const attributes = ['href', 'src', 'data-src', 'data-image'];
    
    for (const attr of attributes) {
      const url = $el.attr(attr);
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'))) {
        try {
          const fullUrl = url.startsWith('//') ? 'https:' + url : url;
          const urlObj = new URL(fullUrl);
          const localPath = path.join('assets', urlObj.hostname, urlObj.pathname);
          $el.attr(attr, localPath);
          
          // Also download the resource if we haven't already
          const outputPath = path.join(OUTPUT_DIR, localPath);
          if (!await fs.pathExists(outputPath)) {
            await downloadResource(fullUrl, outputPath);
          }
        } catch (e) {
          // Invalid URL
        }
      }
    }
  }
  
  // Update background images in inline styles
  $('[style*="background-image"]').each((_, el) => {
    const $el = $(el);
    const style = $el.attr('style');
    if (style) {
      const updated = style.replace(/url\(['"]?(https?:\/\/[^'")]+)['"]?\)/g, (match, url) => {
        try {
          const urlObj = new URL(url);
          const localPath = path.join('assets', urlObj.hostname, urlObj.pathname);
          return `url('${localPath}')`;
        } catch (e) {
          return match;
        }
      });
      $el.attr('style', updated);
    }
  });
  
  // Save the processed HTML
  const outputPath = path.join(OUTPUT_DIR, outputName);
  await fs.writeFile(outputPath, $.html());
  
  // Take a screenshot for verification
  const screenshotPath = path.join(OUTPUT_DIR, 'screenshots', outputName.replace('.html', '.png'));
  await fs.ensureDir(path.dirname(screenshotPath));
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  await page.close();
  console.log(`  ✅ Saved ${outputName}`);
  return true;
}

async function captureAllPages() {
  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(path.join(OUTPUT_DIR, 'assets'));
  await fs.ensureDir(path.join(OUTPUT_DIR, 'screenshots'));
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });
  
  const pages = [
    { url: 'https://www.bounder.io/', filename: 'index.html' },
    { url: 'https://www.bounder.io/contact', filename: 'contact.html' },
    { url: 'https://www.bounder.io/privacy', filename: 'privacy.html' },
    { url: 'https://www.bounder.io/new-page', filename: 'new-page.html' },
    { url: 'https://www.bounder.io/gallery-shift', filename: 'gallery-shift.html' },
    { url: 'https://www.bounder.io/ride-to-live-shift', filename: 'ride-to-live-shift.html' },
    { url: 'https://www.bounder.io/intro', filename: 'intro.html' }
  ];
  
  for (const page of pages) {
    await captureRenderedPage(browser, page.url, page.filename);
  }
  
  // Create 404 page from index
  const indexContent = await fs.readFile(path.join(OUTPUT_DIR, 'index.html'), 'utf-8');
  await fs.writeFile(path.join(OUTPUT_DIR, '404.html'), indexContent);
  
  // Create CNAME file
  await fs.writeFile(path.join(OUTPUT_DIR, 'CNAME'), 'www.bounder.io');
  
  await browser.close();
  
  console.log('\n✅ PERFECT clone complete!');
  console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
  console.log('\nTo test locally:');
  console.log('  cd bounder_perfect_clone');
  console.log('  python3 -m http.server 8000');
  console.log('  open http://localhost:8000');
}

// Run the capture
captureAllPages().catch(console.error);