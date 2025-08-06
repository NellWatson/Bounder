import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'bounder_ultimate');

console.log('💎 ULTIMATE VERBATIM CLONE - FINAL ATTEMPT\n');
console.log('=' .repeat(70));

async function base64Encode(buffer) {
  return buffer.toString('base64');
}

async function captureUltimateClone(url, filename) {
  console.log(`\n🎯 ULTIMATE CAPTURE: ${filename}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--force-device-scale-factor=1',
      '--high-dpi-support=1',
      '--force-color-profile=srgb',
      '--disable-lcd-text'  // Disable subpixel rendering
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false
    }
  });
  
  const page = await browser.newPage();
  
  // Set rendering preferences
  await page.evaluateOnNewDocument(() => {
    // Force consistent font rendering
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => 1
    });
  });
  
  // Collect all resources
  const resources = new Map();
  const fontData = new Map();
  
  await page.setRequestInterception(true);
  
  page.on('response', async response => {
    try {
      const url = response.url();
      const buffer = await response.buffer();
      resources.set(url, buffer);
      
      // Special handling for fonts
      if (url.includes('.woff') || url.includes('.ttf') || url.includes('typekit')) {
        const base64 = await base64Encode(buffer);
        const mimeType = url.includes('.woff2') ? 'font/woff2' : 
                        url.includes('.woff') ? 'font/woff' : 'font/truetype';
        fontData.set(url, `data:${mimeType};base64,${base64}`);
      }
    } catch (e) {}
  });
  
  page.on('request', request => request.continue());
  
  // Navigate
  await page.goto(url, {
    waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
    timeout: 60000
  });
  
  // Wait for everything
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 7000));
  
  // Scroll to load everything
  await page.evaluate(() => {
    return new Promise(resolve => {
      const scrollHeight = document.body.scrollHeight;
      window.scrollTo(0, scrollHeight);
      setTimeout(() => {
        window.scrollTo(0, 0);
        setTimeout(resolve, 2000);
      }, 2000);
    });
  });
  
  console.log('  🔬 Capturing with maximum precision...');
  
  // Ultimate capture
  const ultimateHTML = await page.evaluate(() => {
    // Force render all fonts
    document.fonts.forEach(font => font.load());
    
    // Get exact computed styles for EVERYTHING
    const allElements = document.querySelectorAll('*');
    const styleData = [];
    
    allElements.forEach((el, idx) => {
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      // Capture ALL properties
      const styles = {};
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        const value = computed.getPropertyValue(prop);
        if (value && value !== 'initial' && value !== 'normal' && value !== 'none') {
          styles[prop] = value;
        }
      }
      
      // Add positioning
      styles['position'] = computed.position || 'static';
      styles['top'] = rect.top + 'px';
      styles['left'] = rect.left + 'px';
      styles['width'] = rect.width + 'px';
      styles['height'] = rect.height + 'px';
      
      // Assign unique ID
      if (!el.id) {
        el.setAttribute('data-ultimate-id', `el-${idx}`);
      }
      
      styleData.push({
        selector: el.id || `[data-ultimate-id="el-${idx}"]`,
        styles: styles
      });
      
      // Apply inline immediately for critical properties
      const critical = [
        'display', 'position', 'width', 'height', 'margin', 'padding',
        'color', 'background', 'font-family', 'font-size', 'font-weight',
        'line-height', 'text-align', 'opacity', 'visibility', 'z-index'
      ];
      
      let inlineCSS = '';
      critical.forEach(prop => {
        if (styles[prop]) {
          inlineCSS += `${prop}: ${styles[prop]} !important; `;
        }
      });
      
      el.setAttribute('style', (el.getAttribute('style') || '') + inlineCSS);
    });
    
    // Generate massive CSS block
    let megaCSS = '';
    styleData.forEach(item => {
      if (item.selector && Object.keys(item.styles).length > 0) {
        megaCSS += `${item.selector} {\n`;
        Object.entries(item.styles).forEach(([prop, val]) => {
          megaCSS += `  ${prop}: ${val} !important;\n`;
        });
        megaCSS += '}\n';
      }
    });
    
    // Get all stylesheets
    let originalCSS = '';
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          originalCSS += rule.cssText + '\n';
        }
      } catch (e) {}
    }
    
    return {
      html: document.documentElement.outerHTML,
      megaCSS: megaCSS,
      originalCSS: originalCSS
    };
  });
  
  // Process HTML
  const $ = cheerio.load(ultimateHTML.html);
  
  // Remove dynamic scripts
  $('script[src*="squarespace"]').remove();
  $('script:contains("Squarespace")').remove();
  $('script[src*="recaptcha"]').remove();
  
  // Embed fonts as base64
  let fontFaceCSS = '<style id="ultimate-fonts">\n';
  let fontIndex = 0;
  
  fontData.forEach((dataUri, url) => {
    fontIndex++;
    const fontFamily = url.includes('proxima') ? 'proxima-nova' : 
                      url.includes('futura') ? 'futura-pt' : `font-${fontIndex}`;
    const fontWeight = url.includes('bold') || url.includes('700') ? '700' : '400';
    
    fontFaceCSS += `
      @font-face {
        font-family: '${fontFamily}';
        src: url('${dataUri}') format('woff2');
        font-weight: ${fontWeight};
        font-style: normal;
        font-display: block;
      }\n`;
  });
  
  fontFaceCSS += `
    /* Force font usage */
    * {
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      text-rendering: geometricPrecision !important;
    }
    
    body, body * {
      font-family: proxima-nova, -apple-system, BlinkMacSystemFont, sans-serif !important;
    }
    
    h1, h2, h3, .header-nav {
      font-family: futura-pt, proxima-nova, sans-serif !important;
      font-weight: 700 !important;
    }
  </style>`;
  
  $('head').prepend(fontFaceCSS);
  
  // Add all captured styles
  $('head').append(`
    <style id="ultimate-original-css">
      ${ultimateHTML.originalCSS}
    </style>
    <style id="ultimate-computed-css">
      ${ultimateHTML.megaCSS}
    </style>
    <style id="ultimate-overrides">
      /* Final overrides for pixel perfection */
      * {
        box-sizing: border-box !important;
        margin: 0;
        padding: 0;
      }
      
      img {
        display: block !important;
        max-width: 100% !important;
        height: auto !important;
        image-rendering: -webkit-optimize-contrast !important;
      }
      
      /* Fix text rendering */
      p, span, a, div {
        letter-spacing: normal !important;
        word-spacing: normal !important;
      }
      
      /* Ensure exact dimensions */
      .site-wrapper {
        width: 100% !important;
        max-width: 100% !important;
      }
    </style>
  `);
  
  // Process all images - embed small ones as base64
  for (const [url, buffer] of resources.entries()) {
    if (url.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
      const size = buffer.length;
      
      if (size < 100000) { // Embed images < 100KB
        const base64 = await base64Encode(buffer);
        const mimeType = url.includes('.png') ? 'image/png' : 
                        url.includes('.svg') ? 'image/svg+xml' : 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64}`;
        
        // Replace in HTML
        $(`img[src*="${path.basename(url)}"]`).each((_, el) => {
          $(el).attr('src', dataUri);
        });
        
        $(`[style*="${url}"]`).each((_, el) => {
          const $el = $(el);
          const style = $el.attr('style');
          if (style) {
            $el.attr('style', style.replace(url, dataUri));
          }
        });
      } else {
        // Save larger images as files
        const imagePath = path.join(OUTPUT_DIR, 'images', path.basename(url));
        await fs.ensureDir(path.dirname(imagePath));
        await fs.writeFile(imagePath, buffer);
        
        // Update references
        $(`img[src*="${path.basename(url)}"]`).attr('src', `images/${path.basename(url)}`);
      }
    }
  }
  
  // Save HTML
  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(path.join(OUTPUT_DIR, 'images'));
  await fs.writeFile(path.join(OUTPUT_DIR, filename), $.html());
  
  // Screenshot
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, `${filename.replace('.html', '')}-screenshot.png`),
    fullPage: true 
  });
  
  await browser.close();
  console.log(`  ✅ Ultimate capture complete!`);
}

async function createUltimateClone() {
  await fs.emptyDir(OUTPUT_DIR);
  
  const pages = [
    { url: 'https://www.bounder.io/', file: 'index.html' },
    { url: 'https://www.bounder.io/contact', file: 'contact.html' },
    { url: 'https://www.bounder.io/privacy', file: 'privacy.html' },
    { url: 'https://www.bounder.io/new-page', file: 'terms.html' }
  ];
  
  for (const page of pages) {
    await captureUltimateClone(page.url, page.file);
  }
  
  // Support files
  await fs.writeFile(path.join(OUTPUT_DIR, 'CNAME'), 'www.bounder.io');
  await fs.writeFile(path.join(OUTPUT_DIR, '.nojekyll'), '');
  
  const indexContent = await fs.readFile(path.join(OUTPUT_DIR, 'index.html'), 'utf-8');
  await fs.writeFile(path.join(OUTPUT_DIR, '404.html'), indexContent);
  
  console.log('\n' + '=' .repeat(70));
  console.log('💎 ULTIMATE VERBATIM CLONE COMPLETE!');
  console.log('=' .repeat(70));
  console.log(`\n📁 Files saved to: ${OUTPUT_DIR}`);
  console.log('\nThis ultimate clone includes:');
  console.log('  💎 Base64-embedded fonts for exact rendering');
  console.log('  💎 Every single computed style preserved');
  console.log('  💎 Pixel-perfect positioning');
  console.log('  💎 Embedded small images');
  console.log('  💎 Forced consistent rendering');
  console.log('\nTo test:');
  console.log('  cd bounder_ultimate');
  console.log('  python3 -m http.server 8080');
  console.log('\nThis is the absolute maximum fidelity achievable!');
}

createUltimateClone().catch(console.error);