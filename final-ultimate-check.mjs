import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('💎 FINAL ULTIMATE VERBATIM CHECK\n');
console.log('=' .repeat(60));

async function finalCheck() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-lcd-text',
      '--force-device-scale-factor=1'
    ]
  });
  
  const pages = [
    { name: 'Homepage', live: 'https://www.bounder.io/', local: 'http://localhost:8080/' },
    { name: 'Contact', live: 'https://www.bounder.io/contact', local: 'http://localhost:8080/contact.html' }
  ];
  
  let totalMatch = 0;
  let count = 0;
  
  for (const pageInfo of pages) {
    console.log(`\nChecking ${pageInfo.name}...`);
    
    const [page1, page2] = await Promise.all([
      browser.newPage(),
      browser.newPage()
    ]);
    
    await Promise.all([
      page1.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 }),
      page2.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
    ]);
    
    await Promise.all([
      page1.goto(pageInfo.live, { waitUntil: 'networkidle0' }),
      page2.goto(pageInfo.local, { waitUntil: 'networkidle0' })
    ]);
    
    await new Promise(r => setTimeout(r, 5000));
    
    // Clean both pages
    const cleanup = async (p) => {
      await p.evaluate(() => {
        document.querySelectorAll('.cookie-banner-mount-point, .grecaptcha-badge, .gdpr-cookie-banner').forEach(el => el.remove());
      });
    };
    
    await Promise.all([cleanup(page1), cleanup(page2)]);
    
    const [screen1, screen2] = await Promise.all([
      page1.screenshot({ fullPage: true }),
      page2.screenshot({ fullPage: true })
    ]);
    
    try {
      const img1 = PNG.sync.read(screen1);
      const img2 = PNG.sync.read(screen2);
      
      if (img1.width === img2.width && img1.height === img2.height) {
        const diff = new PNG({ width: img1.width, height: img1.height });
        const numDiff = pixelmatch(
          img1.data, 
          img2.data, 
          diff.data, 
          img1.width, 
          img1.height, 
          { threshold: 0.1, includeAA: true }
        );
        
        const total = img1.width * img1.height;
        const match = ((total - numDiff) / total * 100).toFixed(3);
        
        console.log(`  Match: ${match}%`);
        console.log(`  Diff: ${numDiff.toLocaleString()} / ${total.toLocaleString()} pixels`);
        
        totalMatch += parseFloat(match);
        count++;
      } else {
        console.log(`  Size mismatch: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`);
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    
    await Promise.all([page1.close(), page2.close()]);
  }
  
  await browser.close();
  
  const avgMatch = totalMatch / count;
  
  console.log('\n' + '=' .repeat(60));
  console.log(`💎 ULTIMATE VERBATIM SCORE: ${avgMatch.toFixed(3)}%`);
  console.log('=' .repeat(60));
  
  if (avgMatch >= 99) {
    console.log('\n✨ NEAR-PERFECT VERBATIM MATCH ACHIEVED!');
  } else if (avgMatch >= 98) {
    console.log('\n✅ EXCELLENT VERBATIM MATCH!');
  } else if (avgMatch >= 97) {
    console.log('\n⚠️ VERY GOOD MATCH - Getting closer!');
  } else {
    console.log('\n❌ Still needs improvement');
  }
}

finalCheck().catch(console.error);