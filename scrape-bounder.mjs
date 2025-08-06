import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

const ROOT   = 'https://www.bounder.io';
const OUTDIR = './bounder_clone';
const CONCURRENCY = 4;

// --- helpers --------------------------------------------------------------
const sleep = ms => new Promise(r => setTimeout(r, ms));
const urlToFile = u => {
  let p = new URL(u).pathname.replace(/\/$/, '/index');
  return path.join(OUTDIR, p.endsWith('.html') ? p : `${p}.html`);
};
const saveFile = async (filePath, data) => {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, data);
};

// --- main crawler ---------------------------------------------------------
console.log('Starting Bounder.io scraper...');
const browser = await puppeteer.launch({headless: 'new'});

const queue    = [ROOT];
const visited  = new Set();
const manifest = [];

const dlLimit  = pLimit(8);   // assets
const pgLimit  = pLimit(CONCURRENCY);   // pages

// Add known pages from XML export
const knownPages = [
  ROOT,
  `${ROOT}/new-page`,
  `${ROOT}/contact`, 
  `${ROOT}/intro`,
  `${ROOT}/privacy`,
  `${ROOT}/ride-to-live-shift`,
  `${ROOT}/gallery-shift`
];

// Add known pages to queue
knownPages.forEach(page => {
  if (!queue.includes(page)) {
    queue.push(page);
  }
});

while (queue.length) {
  const url = queue.shift();
  if (visited.has(url)) continue;
  visited.add(url);

  await pgLimit(async () => {
    try {
      const p = await browser.newPage();
      
      // Set a user agent to avoid being blocked
      await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await p.goto(url, {waitUntil: 'networkidle2', timeout: 60000});
      await sleep(1500);  // Give Squarespace JS more time to load
      
      // Scroll to bottom to trigger lazy loading
      await p.evaluate(() => {
        return new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            
            if(totalHeight >= scrollHeight){
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
      
      await sleep(1000); // Wait for lazy-loaded content

      const html = await p.content();
      const filePath = urlToFile(url);
      manifest.push({url, file: path.relative(OUTDIR, filePath)});
      
      // --- parse for new links & assets
      const $ = cheerio.load(html);
      
      // Handle Squarespace lazy-loaded images
      $('img[data-src]').each((_, img) => { 
        const dataSrc = $(img).attr('data-src');
        if (dataSrc) {
          $(img).attr('src', dataSrc);
        }
      });
      
      // Find all internal links
      $('a[href]').each((_, a) => {
        const href = $(a).attr('href');
        if (!href) return;
        
        // Skip anchors, mailto, tel links
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        
        const abs = new URL(href, url).href;
        if (abs.startsWith(ROOT) && !abs.includes('#')) {
          const cleanUrl = abs.split('?')[0]; // Remove query params
          if (!visited.has(cleanUrl) && !queue.includes(cleanUrl)) {
            queue.push(cleanUrl);
          }
        }
      });

      // Download assets
      const assetPromises = [];
      const assetSelectors = [
        'img[src]',
        'img[data-image]', 
        'link[rel="stylesheet"][href]',
        'link[rel="icon"][href]',
        'script[src]',
        'source[srcset]'
      ];
      
      $(assetSelectors.join(', ')).each((_, el) => {
        let src;
        if (el.tagName === 'LINK') {
          src = $(el).attr('href');
        } else if ($(el).attr('srcset')) {
          // Handle srcset (take first URL)
          src = $(el).attr('srcset').split(',')[0].trim().split(' ')[0];
        } else if ($(el).attr('data-image')) {
          src = $(el).attr('data-image');
        } else {
          src = $(el).attr('src');
        }
        
        if (!src || src.startsWith('data:')) return;
        
        try {
          const abs = new URL(src, url).href;
          
          assetPromises.push(dlLimit(async () => {
            try {
              const res = await axios.get(abs, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: 50 * 1024 * 1024 // 50MB max
              });
              
              // Determine output path based on URL
              let outputPath;
              if (abs.includes('squarespace-cdn.com') || abs.includes('squarespace.com')) {
                // Keep Squarespace CDN structure
                const urlObj = new URL(abs);
                outputPath = path.join(OUTDIR, 'assets', urlObj.hostname, urlObj.pathname);
              } else {
                outputPath = path.join(OUTDIR, 'assets', new URL(abs).pathname);
              }
              
              await saveFile(outputPath, res.data);
              
              // Update HTML with local path
              const relPath = path.relative(path.dirname(filePath), outputPath);
              
              if (el.tagName === 'LINK') {
                $(el).attr('href', relPath);
              } else if ($(el).attr('srcset')) {
                $(el).attr('srcset', relPath);
              } else if ($(el).attr('data-image')) {
                $(el).attr('data-image', relPath);
              } else {
                $(el).attr('src', relPath);
              }
              
              console.log(`  ✓ Asset: ${path.basename(abs)}`);
            } catch (e) {
              console.log(`  ✗ Failed to download: ${abs.substring(0, 80)}...`);
            }
          }));
        } catch (e) {
          // Invalid URL, skip
        }
      });

      await Promise.all(assetPromises);
      
      // Clean up Squarespace-specific elements
      $('.sqs-block-button-container--center').removeAttr('data-animation-role');
      $('[data-controller-folder]').removeAttr('data-controller-folder');
      $('script:contains("SquarespaceFonts")').remove();
      $('script:contains("SQUARESPACE_CONTEXT")').remove();
      
      // Save HTML with local asset paths
      await saveFile(filePath, $.html());

      await p.close();
      console.log('✓', url);
    } catch (e) {
      console.error('✗ Error processing:', url, e.message);
    }
  });
}

await saveFile(path.join(OUTDIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
await browser.close();

console.log(`\n✅ Done! ${visited.size} pages saved → ${OUTDIR}`);
console.log(`📄 Manifest saved to ${OUTDIR}/manifest.json`);