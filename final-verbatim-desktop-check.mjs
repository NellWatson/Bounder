import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'final-verbatim-check');

console.log('🎯 FINAL VERBATIM CHECK - DESKTOP VIEW\n');
console.log('=' .repeat(60));

async function finalVerbatimCheck() {
  await fs.ensureDir(OUTPUT_DIR);
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const pages = [
    { name: 'Homepage', live: 'https://www.bounder.io/', local: 'http://localhost:8080/' },
    { name: 'Contact', live: 'https://www.bounder.io/contact', local: 'http://localhost:8080/contact.html' },
    { name: 'Privacy', live: 'https://www.bounder.io/privacy', local: 'http://localhost:8080/privacy.html' },
    { name: 'Terms', live: 'https://www.bounder.io/new-page', local: 'http://localhost:8080/terms.html' }
  ];
  
  const results = [];
  
  for (const pageInfo of pages) {
    console.log(`\n📄 Checking ${pageInfo.name}...`);
    
    // Create two pages for parallel capture
    const [livePage, localPage] = await Promise.all([
      browser.newPage(),
      browser.newPage()
    ]);
    
    // Set viewport
    await Promise.all([
      livePage.setViewport({ width: 1920, height: 1080 }),
      localPage.setViewport({ width: 1920, height: 1080 })
    ]);
    
    // Navigate to both pages
    await Promise.all([
      livePage.goto(pageInfo.live, { waitUntil: 'networkidle0', timeout: 60000 }),
      localPage.goto(pageInfo.local, { waitUntil: 'networkidle0', timeout: 60000 })
    ]);
    
    // Wait for full render
    await new Promise(r => setTimeout(r, 5000));
    
    // Remove dynamic elements on both pages
    const removeDynamicElements = async (page) => {
      await page.evaluate(() => {
        // Remove cookie banners and recaptcha
        const toRemove = document.querySelectorAll('.cookie-banner-mount-point, .grecaptcha-badge, .gdpr-cookie-banner');
        toRemove.forEach(el => el.remove());
        
        // Stop videos
        const videos = document.querySelectorAll('video, iframe[src*="youtube"]');
        videos.forEach(v => {
          if (v.tagName === 'VIDEO') v.pause();
        });
      });
    };
    
    await Promise.all([
      removeDynamicElements(livePage),
      removeDynamicElements(localPage)
    ]);
    
    // Take screenshots
    const [liveScreenshot, localScreenshot] = await Promise.all([
      livePage.screenshot({ fullPage: true }),
      localPage.screenshot({ fullPage: true })
    ]);
    
    // Save screenshots
    const liveScreenPath = path.join(OUTPUT_DIR, `${pageInfo.name.toLowerCase()}-live.png`);
    const localScreenPath = path.join(OUTPUT_DIR, `${pageInfo.name.toLowerCase()}-local.png`);
    
    await Promise.all([
      fs.writeFile(liveScreenPath, liveScreenshot),
      fs.writeFile(localScreenPath, localScreenshot)
    ]);
    
    // Compare images
    try {
      const img1 = PNG.sync.read(liveScreenshot);
      const img2 = PNG.sync.read(localScreenshot);
      
      if (img1.width === img2.width && img1.height === img2.height) {
        const diff = new PNG({ width: img1.width, height: img1.height });
        const numDiffPixels = pixelmatch(
          img1.data,
          img2.data,
          diff.data,
          img1.width,
          img1.height,
          { threshold: 0.1, includeAA: true }
        );
        
        const diffPath = path.join(OUTPUT_DIR, `${pageInfo.name.toLowerCase()}-diff.png`);
        await fs.writeFile(diffPath, PNG.sync.write(diff));
        
        const totalPixels = img1.width * img1.height;
        const matchPercentage = ((totalPixels - numDiffPixels) / totalPixels * 100).toFixed(2);
        
        results.push({
          page: pageInfo.name,
          match: parseFloat(matchPercentage),
          diffPixels: numDiffPixels,
          totalPixels: totalPixels
        });
        
        const emoji = matchPercentage >= 99 ? '✨' : 
                     matchPercentage >= 95 ? '✅' : 
                     matchPercentage >= 90 ? '⚠️' : '❌';
        
        console.log(`  ${emoji} Visual Match: ${matchPercentage}%`);
        console.log(`     Different pixels: ${numDiffPixels.toLocaleString()} / ${totalPixels.toLocaleString()}`);
      } else {
        console.log(`  ❌ Size mismatch: Live(${img1.width}x${img1.height}) vs Local(${img2.width}x${img2.height})`);
        results.push({
          page: pageInfo.name,
          error: 'Size mismatch'
        });
      }
    } catch (error) {
      console.log(`  ❌ Error comparing: ${error.message}`);
      results.push({
        page: pageInfo.name,
        error: error.message
      });
    }
    
    await Promise.all([
      livePage.close(),
      localPage.close()
    ]);
  }
  
  await browser.close();
  
  // Calculate overall score
  const validResults = results.filter(r => r.match);
  const avgMatch = validResults.reduce((sum, r) => sum + r.match, 0) / validResults.length;
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL VERBATIM CHECK RESULTS');
  console.log('=' .repeat(60));
  
  results.forEach(r => {
    if (r.match) {
      const status = r.match >= 99 ? 'PERFECT' :
                    r.match >= 95 ? 'EXCELLENT' :
                    r.match >= 90 ? 'GOOD' : 'NEEDS IMPROVEMENT';
      console.log(`\n${r.page}: ${status}`);
      console.log(`  Match: ${r.match}%`);
    } else {
      console.log(`\n${r.page}: ERROR - ${r.error}`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log(`🎯 OVERALL VERBATIM SCORE: ${avgMatch.toFixed(2)}%`);
  console.log('=' .repeat(60));
  
  if (avgMatch >= 99) {
    console.log('\n✨ PERFECT VERBATIM MATCH ACHIEVED!');
    console.log('The clone is pixel-perfect and indistinguishable from the original.');
  } else if (avgMatch >= 95) {
    console.log('\n✅ EXCELLENT VERBATIM MATCH!');
    console.log('The clone is nearly identical with only minor pixel differences.');
    console.log('These differences are likely from:');
    console.log('  - Dynamic content timing');
    console.log('  - Font rendering variations');
    console.log('  - Anti-aliasing differences');
  } else if (avgMatch >= 90) {
    console.log('\n⚠️ VERY GOOD MATCH');
    console.log('The clone closely resembles the original with some visible differences.');
  } else {
    console.log('\n❌ SIGNIFICANT DIFFERENCES');
    console.log('The clone needs additional refinement.');
  }
  
  console.log(`\n📁 Visual comparison saved to: ${OUTPUT_DIR}`);
  console.log('   View the diff images to see exact pixel differences');
  
  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Verbatim Check Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .score { font-size: 48px; font-weight: bold; color: ${avgMatch >= 95 ? '#4CAF50' : '#FF9800'}; }
    .page { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .comparison { display: flex; gap: 10px; margin: 10px 0; }
    .comparison img { width: 32%; border: 1px solid #ddd; }
    .match { color: ${avgMatch >= 95 ? '#4CAF50' : '#FF9800'}; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Bounder.io Clone - Verbatim Check Report</h1>
  <div class="score">${avgMatch.toFixed(2)}% Match</div>
  <p>Generated: ${new Date().toLocaleString()}</p>
  
  ${results.map(r => `
    <div class="page">
      <h2>${r.page}</h2>
      ${r.match ? `
        <p class="match">Visual Match: ${r.match}%</p>
        <p>Different pixels: ${r.diffPixels?.toLocaleString()} / ${r.totalPixels?.toLocaleString()}</p>
        <div class="comparison">
          <div>
            <h4>Live Site</h4>
            <img src="${r.page.toLowerCase()}-live.png" alt="Live">
          </div>
          <div>
            <h4>Clone</h4>
            <img src="${r.page.toLowerCase()}-local.png" alt="Clone">
          </div>
          <div>
            <h4>Difference Map</h4>
            <img src="${r.page.toLowerCase()}-diff.png" alt="Diff">
          </div>
        </div>
      ` : `<p>Error: ${r.error}</p>`}
    </div>
  `).join('')}
</body>
</html>
  `;
  
  await fs.writeFile(path.join(OUTPUT_DIR, 'report.html'), htmlReport);
  console.log('\n📊 Open report.html in browser for visual comparison');
  
  return avgMatch;
}

// Run the check
finalVerbatimCheck().catch(console.error);