import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function verifyPages() {
  console.log('🔍 Starting verification of cloned site vs live site...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-web-security'] // Allow loading local files
  });
  
  const pagesToCheck = [
    { url: 'https://www.bounder.io/', local: 'index.html', name: 'Homepage' },
    { url: 'https://www.bounder.io/contact', local: 'contact.html', name: 'Contact' },
    { url: 'https://www.bounder.io/privacy', local: 'privacy.html', name: 'Privacy' },
    { url: 'https://www.bounder.io/new-page', local: 'new-page.html', name: 'Terms' },
    { url: 'https://www.bounder.io/gallery-shift', local: 'gallery-shift.html', name: 'Gallery' },
    { url: 'https://www.bounder.io/ride-to-live-shift', local: 'ride-to-live-shift.html', name: 'Ride to Live' }
  ];

  const results = [];
  
  for (const pageInfo of pagesToCheck) {
    console.log(`Checking ${pageInfo.name}...`);
    
    try {
      // Check live site
      const livePage = await browser.newPage();
      await livePage.setViewport({ width: 1280, height: 800 });
      await livePage.goto(pageInfo.url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(r => setTimeout(r, 2000));
      
      // Take screenshot of live site
      const liveScreenshotPath = path.join(__dirname, 'verification', `${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-live.png`);
      await fs.ensureDir(path.dirname(liveScreenshotPath));
      await livePage.screenshot({ path: liveScreenshotPath, fullPage: false });
      
      // Get page title and content length
      const liveTitle = await livePage.title();
      const liveContent = await livePage.evaluate(() => document.body.innerText);
      
      await livePage.close();
      
      // Check local file
      const localPage = await browser.newPage();
      await localPage.setViewport({ width: 1280, height: 800 });
      const localFilePath = `file://${path.join(__dirname, 'bounder_clone', pageInfo.local)}`;
      await localPage.goto(localFilePath, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(r => setTimeout(r, 1000));
      
      // Take screenshot of local site
      const localScreenshotPath = path.join(__dirname, 'verification', `${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-local.png`);
      await localPage.screenshot({ path: localScreenshotPath, fullPage: false });
      
      // Get page title and content
      const localTitle = await localPage.title();
      const localContent = await localPage.evaluate(() => document.body.innerText);
      
      await localPage.close();
      
      // Compare results
      const titleMatch = liveTitle === localTitle;
      const contentSimilarity = (localContent.length / liveContent.length * 100).toFixed(1);
      
      results.push({
        page: pageInfo.name,
        titleMatch,
        liveTitle,
        localTitle,
        contentSimilarity: `${contentSimilarity}%`,
        liveContentLength: liveContent.length,
        localContentLength: localContent.length,
        status: titleMatch && Math.abs(100 - parseFloat(contentSimilarity)) < 20 ? '✅ PASS' : '⚠️ CHECK'
      });
      
      console.log(`  - Title match: ${titleMatch ? '✅' : '❌'}`);
      console.log(`  - Content similarity: ${contentSimilarity}%`);
      
    } catch (error) {
      console.error(`  ❌ Error checking ${pageInfo.name}:`, error.message);
      results.push({
        page: pageInfo.name,
        status: '❌ ERROR',
        error: error.message
      });
    }
  }
  
  await browser.close();
  
  // Save results
  const reportPath = path.join(__dirname, 'verification', 'report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n📊 Verification Summary:');
  console.log('========================');
  results.forEach(r => {
    console.log(`${r.status} ${r.page}`);
    if (r.titleMatch !== undefined) {
      console.log(`    Title: ${r.titleMatch ? 'Match' : `Mismatch (Live: "${r.liveTitle}" vs Local: "${r.localTitle}")`}`);
      console.log(`    Content: ${r.contentSimilarity} similar`);
    }
    if (r.error) {
      console.log(`    Error: ${r.error}`);
    }
  });
  
  console.log('\n📸 Screenshots saved to ./verification/');
  console.log('📄 Full report saved to ./verification/report.json');
}

// Run verification
verifyPages().catch(console.error);