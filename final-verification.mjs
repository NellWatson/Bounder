import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function finalVerification() {
  const outputDir = path.join(__dirname, 'final-comparison');
  await fs.ensureDir(outputDir);
  
  console.log('🎯 FINAL VERIFICATION - Verbatim Match Check\n');
  console.log('=' .repeat(60));
  
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
    console.log(`\n📊 Checking ${pageInfo.name}...`);
    
    // Capture live site
    const livePage = await browser.newPage();
    await livePage.setViewport({ width: 1920, height: 1080 });
    await livePage.goto(pageInfo.live, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // Remove dynamic elements for fair comparison
    await livePage.evaluate(() => {
      const elements = document.querySelectorAll('.cookie-banner-mount-point, .grecaptcha-badge');
      elements.forEach(el => el.remove());
    });
    
    const liveScreenshot = path.join(outputDir, `${pageInfo.name.toLowerCase()}-live.png`);
    await livePage.screenshot({ path: liveScreenshot });
    await livePage.close();
    
    // Capture local clone
    const localPage = await browser.newPage();
    await localPage.setViewport({ width: 1920, height: 1080 });
    await localPage.goto(pageInfo.local, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    
    const localScreenshot = path.join(outputDir, `${pageInfo.name.toLowerCase()}-local.png`);
    await localPage.screenshot({ path: localScreenshot });
    await localPage.close();
    
    // Compare images
    try {
      const img1 = PNG.sync.read(await fs.readFile(liveScreenshot));
      const img2 = PNG.sync.read(await fs.readFile(localScreenshot));
      
      const diff = new PNG({ width: img1.width, height: img1.height });
      const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        img1.width,
        img1.height,
        { threshold: 0.1, includeAA: true }
      );
      
      const diffPath = path.join(outputDir, `${pageInfo.name.toLowerCase()}-diff.png`);
      await fs.writeFile(diffPath, PNG.sync.write(diff));
      
      const percentage = ((numDiffPixels / (img1.width * img1.height)) * 100).toFixed(2);
      const matchScore = (100 - parseFloat(percentage)).toFixed(2);
      
      results.push({
        page: pageInfo.name,
        matchScore: parseFloat(matchScore),
        difference: parseFloat(percentage),
        pixels: numDiffPixels
      });
      
      const emoji = matchScore >= 99 ? '✨' : 
                   matchScore >= 95 ? '✅' : 
                   matchScore >= 90 ? '⚠️' : '❌';
      
      console.log(`  ${emoji} Visual Match: ${matchScore}%`);
      console.log(`     Difference: ${percentage}% (${numDiffPixels} pixels)`);
      
    } catch (error) {
      console.log(`  ❌ Error comparing: ${error.message}`);
      results.push({
        page: pageInfo.name,
        error: error.message
      });
    }
  }
  
  await browser.close();
  
  // Generate report
  const avgMatch = results
    .filter(r => r.matchScore)
    .reduce((sum, r) => sum + r.matchScore, 0) / results.filter(r => r.matchScore).length;
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL VERIFICATION RESULTS');
  console.log('=' .repeat(60));
  
  results.forEach(r => {
    if (r.matchScore) {
      const status = r.matchScore >= 99 ? 'PERFECT' :
                    r.matchScore >= 95 ? 'EXCELLENT' :
                    r.matchScore >= 90 ? 'GOOD' : 'NEEDS WORK';
      console.log(`\n${r.page}: ${status}`);
      console.log(`  Match Score: ${r.matchScore}%`);
      console.log(`  Pixel Diff: ${r.pixels} pixels`);
    } else {
      console.log(`\n${r.page}: ERROR`);
      console.log(`  ${r.error}`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log(`🎯 OVERALL MATCH SCORE: ${avgMatch.toFixed(2)}%`);
  console.log('=' .repeat(60));
  
  if (avgMatch >= 99) {
    console.log('\n✨ PERFECT VERBATIM MATCH ACHIEVED!');
    console.log('The clone is visually identical to the original.');
  } else if (avgMatch >= 95) {
    console.log('\n✅ EXCELLENT MATCH!');
    console.log('The clone is nearly identical with minor differences.');
  } else if (avgMatch >= 90) {
    console.log('\n⚠️ GOOD MATCH');
    console.log('The clone is similar but has some visible differences.');
  } else {
    console.log('\n❌ SIGNIFICANT DIFFERENCES');
    console.log('The clone needs more work to achieve verbatim match.');
  }
  
  console.log(`\n📁 Screenshots saved to: ${outputDir}`);
  
  // Save JSON report
  await fs.writeFile(
    path.join(outputDir, 'report.json'),
    JSON.stringify({ results, avgMatch, timestamp: new Date().toISOString() }, null, 2)
  );
}

// Run verification
finalVerification().catch(console.error);