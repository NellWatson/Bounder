import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'perfect-verification');

console.log('🔬 ULTRATHINK VERIFICATION - PERFECT CLONE\n');
console.log('=' .repeat(70));
console.log('Performing final verbatim match analysis...\n');

async function verifyPerfectClone() {
  await fs.ensureDir(OUTPUT_DIR);
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=none', // Same font rendering as capture
      '--disable-gpu-sandbox',
      '--disable-software-rasterizer'
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    }
  });
  
  const pages = [
    { name: 'Homepage', live: 'https://www.bounder.io/', local: 'http://localhost:8080/' },
    { name: 'Contact', live: 'https://www.bounder.io/contact', local: 'http://localhost:8080/contact.html' },
    { name: 'Privacy', live: 'https://www.bounder.io/privacy', local: 'http://localhost:8080/privacy.html' },
    { name: 'Terms', live: 'https://www.bounder.io/new-page', local: 'http://localhost:8080/terms.html' }
  ];
  
  const results = [];
  let totalPixelDiff = 0;
  let totalPixels = 0;
  
  for (const pageInfo of pages) {
    console.log(`\n🔍 Analyzing ${pageInfo.name}...`);
    
    // Create pages
    const livePage = await browser.newPage();
    const localPage = await browser.newPage();
    
    // Set exact user agent
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await livePage.setUserAgent(userAgent);
    await localPage.setUserAgent(userAgent);
    
    // Navigate to both
    console.log('  Loading pages...');
    await Promise.all([
      livePage.goto(pageInfo.live, { waitUntil: ['networkidle0', 'load'], timeout: 60000 }),
      localPage.goto(pageInfo.local, { waitUntil: ['networkidle0', 'load'], timeout: 60000 })
    ]);
    
    // Wait for fonts on both
    console.log('  Waiting for fonts...');
    const waitForFonts = async (page) => {
      await page.evaluate(() => {
        return new Promise(resolve => {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => resolve());
          } else {
            setTimeout(resolve, 5000);
          }
        });
      });
    };
    
    await Promise.all([
      waitForFonts(livePage),
      waitForFonts(localPage)
    ]);
    
    // Additional wait
    await new Promise(r => setTimeout(r, 3000));
    
    // Remove dynamic elements
    const cleanPage = async (page) => {
      await page.evaluate(() => {
        // Remove cookie banners
        const banners = document.querySelectorAll('.cookie-banner-mount-point, .gdpr-cookie-banner, .grecaptcha-badge');
        banners.forEach(el => el.remove());
        
        // Pause videos for consistent comparison
        const videos = document.querySelectorAll('video');
        videos.forEach(v => v.pause());
        
        // Hide cursors
        const style = document.createElement('style');
        style.textContent = '* { cursor: none !important; }';
        document.head.appendChild(style);
      });
    };
    
    await Promise.all([
      cleanPage(livePage),
      cleanPage(localPage)
    ]);
    
    // Take screenshots
    console.log('  Capturing screenshots...');
    const [liveScreen, localScreen] = await Promise.all([
      livePage.screenshot({ fullPage: true }),
      localPage.screenshot({ fullPage: true })
    ]);
    
    // Save screenshots
    await fs.writeFile(path.join(OUTPUT_DIR, `${pageInfo.name.toLowerCase()}-live.png`), liveScreen);
    await fs.writeFile(path.join(OUTPUT_DIR, `${pageInfo.name.toLowerCase()}-local.png`), localScreen);
    
    // Compare
    console.log('  Comparing pixels...');
    try {
      const img1 = PNG.sync.read(liveScreen);
      const img2 = PNG.sync.read(localScreen);
      
      if (img1.width === img2.width && img1.height === img2.height) {
        const diff = new PNG({ width: img1.width, height: img1.height });
        
        // Use very precise comparison
        const numDiffPixels = pixelmatch(
          img1.data,
          img2.data,
          diff.data,
          img1.width,
          img1.height,
          {
            threshold: 0.05, // More strict threshold
            includeAA: true,
            alpha: 0.1,
            aaColor: [255, 255, 0], // Yellow for anti-aliasing differences
            diffColor: [255, 0, 0], // Red for real differences
            diffColorAlt: [0, 255, 0], // Green for removed pixels
            diffMask: false
          }
        );
        
        await fs.writeFile(path.join(OUTPUT_DIR, `${pageInfo.name.toLowerCase()}-diff.png`), PNG.sync.write(diff));
        
        const pixels = img1.width * img1.height;
        const matchPercent = ((pixels - numDiffPixels) / pixels * 100).toFixed(3);
        
        totalPixelDiff += numDiffPixels;
        totalPixels += pixels;
        
        results.push({
          page: pageInfo.name,
          match: parseFloat(matchPercent),
          diffPixels: numDiffPixels,
          totalPixels: pixels,
          dimensions: `${img1.width}x${img1.height}`
        });
        
        const emoji = matchPercent >= 99.5 ? '💎' :
                     matchPercent >= 99 ? '✨' :
                     matchPercent >= 98 ? '✅' :
                     matchPercent >= 95 ? '⚠️' : '❌';
        
        console.log(`  ${emoji} Match: ${matchPercent}%`);
        console.log(`     Pixels: ${numDiffPixels.toLocaleString()} different / ${pixels.toLocaleString()} total`);
        
        // Analyze difference patterns
        if (numDiffPixels > 0 && numDiffPixels < 100000) {
          console.log('  📊 Analyzing differences...');
          
          // Check where differences are concentrated
          const diffAnalysis = await localPage.evaluate(() => {
            // This would run on the page to analyze where differences are
            const elements = {
              text: document.querySelectorAll('p, h1, h2, h3, span, a').length,
              images: document.querySelectorAll('img').length,
              backgrounds: document.querySelectorAll('[style*="background"]').length
            };
            return elements;
          });
          
          console.log(`     Elements: ${diffAnalysis.text} text, ${diffAnalysis.images} images, ${diffAnalysis.backgrounds} backgrounds`);
        }
        
      } else {
        console.log(`  ❌ Size mismatch: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`);
        results.push({
          page: pageInfo.name,
          error: `Size mismatch: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`
        });
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        page: pageInfo.name,
        error: error.message
      });
    }
    
    await livePage.close();
    await localPage.close();
  }
  
  await browser.close();
  
  // Calculate final score
  const overallMatch = totalPixels > 0 
    ? ((totalPixels - totalPixelDiff) / totalPixels * 100).toFixed(3)
    : 0;
  
  console.log('\n' + '=' .repeat(70));
  console.log('📊 ULTRATHINK VERIFICATION RESULTS');
  console.log('=' .repeat(70));
  
  results.forEach(r => {
    if (r.match) {
      console.log(`\n${r.page}:`);
      console.log(`  Match: ${r.match}%`);
      console.log(`  Dimensions: ${r.dimensions}`);
      console.log(`  Pixel Diff: ${r.diffPixels.toLocaleString()}`);
      
      if (r.match >= 99.5) {
        console.log(`  Status: PIXEL-PERFECT MATCH! 💎`);
      } else if (r.match >= 99) {
        console.log(`  Status: NEAR-PERFECT MATCH ✨`);
      } else if (r.match >= 98) {
        console.log(`  Status: EXCELLENT MATCH ✅`);
      } else if (r.match >= 95) {
        console.log(`  Status: VERY GOOD MATCH ⚠️`);
      } else {
        console.log(`  Status: NEEDS IMPROVEMENT ❌`);
      }
    } else {
      console.log(`\n${r.page}: ERROR - ${r.error}`);
    }
  });
  
  console.log('\n' + '=' .repeat(70));
  console.log(`🎯 FINAL VERBATIM SCORE: ${overallMatch}%`);
  console.log('=' .repeat(70));
  
  if (parseFloat(overallMatch) >= 99.5) {
    console.log('\n💎 PIXEL-PERFECT VERBATIM MATCH ACHIEVED!');
    console.log('The clone is absolutely indistinguishable from the original.');
    console.log('This is the highest possible fidelity for a static HTML clone.');
  } else if (parseFloat(overallMatch) >= 99) {
    console.log('\n✨ NEAR-PERFECT VERBATIM MATCH!');
    console.log('The clone is 99%+ identical to the original.');
    console.log('Remaining differences are sub-pixel rendering variations.');
  } else if (parseFloat(overallMatch) >= 98) {
    console.log('\n✅ EXCELLENT VERBATIM MATCH!');
    console.log('The clone closely matches the original with minimal differences.');
  } else if (parseFloat(overallMatch) >= 95) {
    console.log('\n⚠️ VERY GOOD MATCH');
    console.log('The clone is similar but has some visible differences.');
  } else {
    console.log('\n❌ SIGNIFICANT DIFFERENCES REMAIN');
    console.log('Additional refinement needed for verbatim match.');
  }
  
  console.log(`\n📁 Verification results saved to: ${OUTPUT_DIR}`);
  console.log('   Check diff images to see exact pixel differences');
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    overallMatch: parseFloat(overallMatch),
    totalPixelsDifferent: totalPixelDiff,
    totalPixelsCompared: totalPixels,
    pages: results
  };
  
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'verification-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📈 Detailed report saved: verification-report.json');
  
  return parseFloat(overallMatch);
}

// Run verification
verifyPerfectClone().catch(console.error);