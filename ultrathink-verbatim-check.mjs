import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'verbatim-analysis');

console.log('🔬 ULTRATHINK VERBATIM ANALYSIS INITIATED\n');
console.log('=' .repeat(70));
console.log('Performing exhaustive pixel-perfect comparison...\n');

async function capturePageState(page, url, name, viewport) {
  await page.setViewport(viewport);
  await page.goto(url, { 
    waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
    timeout: 60000 
  });
  
  // Wait for fonts and animations
  await new Promise(r => setTimeout(r, 5000));
  
  // Scroll to trigger lazy loading
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    return new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    return new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  // Remove dynamic elements for fair comparison
  await page.evaluate(() => {
    // Remove cookie banners
    const cookieBanners = document.querySelectorAll('.cookie-banner-mount-point, .gdpr-cookie-banner');
    cookieBanners.forEach(el => el.remove());
    
    // Remove recaptcha badges
    const recaptcha = document.querySelectorAll('.grecaptcha-badge');
    recaptcha.forEach(el => el.remove());
    
    // Stop video autoplay for consistent comparison
    const videos = document.querySelectorAll('video, iframe');
    videos.forEach(v => {
      if (v.tagName === 'VIDEO') v.pause();
    });
  });
  
  // Capture visual state
  const screenshot = await page.screenshot({ fullPage: true });
  
  // Capture computed styles of critical elements
  const computedStyles = await page.evaluate(() => {
    const elements = {
      header: document.querySelector('header'),
      logo: document.querySelector('.header-title-logo img, .logo img'),
      nav: document.querySelector('nav, .main-nav'),
      hero: document.querySelector('.title-desc-wrapper, .hero-section'),
      content: document.querySelector('.content, .site-inner-wrapper'),
      footer: document.querySelector('footer')
    };
    
    const styles = {};
    for (const [key, el] of Object.entries(elements)) {
      if (el) {
        const computed = window.getComputedStyle(el);
        styles[key] = {
          display: computed.display,
          position: computed.position,
          width: computed.width,
          height: computed.height,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          opacity: computed.opacity,
          visibility: computed.visibility,
          transform: computed.transform
        };
      }
    }
    return styles;
  });
  
  // Capture element positions
  const elementPositions = await page.evaluate(() => {
    const elements = document.querySelectorAll('header, nav, .logo, h1, h2, .content, footer');
    const positions = [];
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      positions.push({
        tag: el.tagName,
        class: el.className,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    });
    return positions;
  });
  
  return {
    screenshot,
    computedStyles,
    elementPositions,
    viewport: `${viewport.width}x${viewport.height}`
  };
}

async function analyzeVerbatimMatch() {
  await fs.ensureDir(OUTPUT_DIR);
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });
  
  const pages = [
    { name: 'homepage', live: 'https://www.bounder.io/', local: 'http://localhost:8080/' },
    { name: 'contact', live: 'https://www.bounder.io/contact', local: 'http://localhost:8080/contact.html' },
    { name: 'privacy', live: 'https://www.bounder.io/privacy', local: 'http://localhost:8080/privacy.html' },
    { name: 'terms', live: 'https://www.bounder.io/new-page', local: 'http://localhost:8080/terms.html' }
  ];
  
  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'laptop', width: 1366, height: 768 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];
  
  const detailedResults = [];
  
  for (const pageInfo of pages) {
    console.log(`\n📄 Analyzing ${pageInfo.name.toUpperCase()}...`);
    console.log('-'.repeat(50));
    
    const pageResults = {
      page: pageInfo.name,
      viewports: []
    };
    
    for (const viewport of viewports) {
      console.log(`  📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      const page = await browser.newPage();
      
      // Capture live site
      const liveData = await capturePageState(
        page, 
        pageInfo.live, 
        `${pageInfo.name}-${viewport.name}-live`,
        viewport
      );
      
      // Capture local clone
      const localData = await capturePageState(
        page,
        pageInfo.local,
        `${pageInfo.name}-${viewport.name}-local`,
        viewport
      );
      
      await page.close();
      
      // Save screenshots
      const liveScreenPath = path.join(OUTPUT_DIR, `${pageInfo.name}-${viewport.name}-live.png`);
      const localScreenPath = path.join(OUTPUT_DIR, `${pageInfo.name}-${viewport.name}-local.png`);
      await fs.writeFile(liveScreenPath, liveData.screenshot);
      await fs.writeFile(localScreenPath, localData.screenshot);
      
      // Pixel comparison
      let pixelMatch = 0;
      try {
        const img1 = PNG.sync.read(liveData.screenshot);
        const img2 = PNG.sync.read(localData.screenshot);
        
        // Resize if needed
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
          
          const totalPixels = img1.width * img1.height;
          pixelMatch = ((totalPixels - numDiffPixels) / totalPixels * 100).toFixed(2);
          
          // Save diff image
          const diffPath = path.join(OUTPUT_DIR, `${pageInfo.name}-${viewport.name}-diff.png`);
          await fs.writeFile(diffPath, PNG.sync.write(diff));
          
          console.log(`    🎯 Visual Match: ${pixelMatch}%`);
        } else {
          console.log(`    ⚠️ Size mismatch: Live(${img1.width}x${img1.height}) vs Local(${img2.width}x${img2.height})`);
          pixelMatch = 0;
        }
      } catch (error) {
        console.log(`    ❌ Comparison error: ${error.message}`);
        pixelMatch = 0;
      }
      
      // Compare computed styles
      let styleMatch = 0;
      let styleDifferences = [];
      for (const [element, liveStyles] of Object.entries(liveData.computedStyles)) {
        const localStyles = localData.computedStyles[element];
        if (localStyles) {
          let matches = 0;
          let total = 0;
          for (const [prop, liveValue] of Object.entries(liveStyles)) {
            total++;
            if (localStyles[prop] === liveValue) {
              matches++;
            } else {
              styleDifferences.push({
                element,
                property: prop,
                live: liveValue,
                local: localStyles[prop]
              });
            }
          }
          styleMatch += (matches / total) * 100;
        }
      }
      styleMatch = styleMatch / Object.keys(liveData.computedStyles).length;
      
      console.log(`    🎨 Style Match: ${styleMatch.toFixed(2)}%`);
      
      // Compare element positions
      let positionMatch = 0;
      let positionDifferences = [];
      const tolerance = 5; // pixels tolerance
      
      for (let i = 0; i < Math.min(liveData.elementPositions.length, localData.elementPositions.length); i++) {
        const live = liveData.elementPositions[i];
        const local = localData.elementPositions[i];
        
        if (Math.abs(live.top - local.top) <= tolerance && 
            Math.abs(live.left - local.left) <= tolerance &&
            Math.abs(live.width - local.width) <= tolerance &&
            Math.abs(live.height - local.height) <= tolerance) {
          positionMatch++;
        } else {
          positionDifferences.push({
            element: live.tag + '.' + live.class,
            live: { top: live.top, left: live.left, width: live.width, height: live.height },
            local: { top: local.top, left: local.left, width: local.width, height: local.height }
          });
        }
      }
      
      if (liveData.elementPositions.length > 0) {
        positionMatch = (positionMatch / liveData.elementPositions.length * 100).toFixed(2);
      }
      
      console.log(`    📐 Position Match: ${positionMatch}%`);
      
      const overallMatch = ((parseFloat(pixelMatch) + parseFloat(styleMatch) + parseFloat(positionMatch)) / 3).toFixed(2);
      console.log(`    ✨ Overall Match: ${overallMatch}%`);
      
      pageResults.viewports.push({
        viewport: viewport.name,
        pixelMatch,
        styleMatch: styleMatch.toFixed(2),
        positionMatch,
        overallMatch,
        styleDifferences: styleDifferences.slice(0, 5), // Top 5 differences
        positionDifferences: positionDifferences.slice(0, 5)
      });
    }
    
    detailedResults.push(pageResults);
  }
  
  await browser.close();
  
  // Generate comprehensive report
  console.log('\n' + '='.repeat(70));
  console.log('📊 ULTRATHINK VERBATIM ANALYSIS COMPLETE');
  console.log('='.repeat(70));
  
  let totalMatch = 0;
  let totalTests = 0;
  
  for (const page of detailedResults) {
    console.log(`\n📄 ${page.page.toUpperCase()}`);
    for (const vp of page.viewports) {
      console.log(`  ${vp.viewport}: ${vp.overallMatch}% match`);
      totalMatch += parseFloat(vp.overallMatch);
      totalTests++;
      
      if (vp.styleDifferences.length > 0) {
        console.log(`    Style differences:`);
        vp.styleDifferences.slice(0, 3).forEach(diff => {
          console.log(`      - ${diff.element}.${diff.property}: ${diff.live} → ${diff.local}`);
        });
      }
      
      if (vp.positionDifferences.length > 0) {
        console.log(`    Position differences:`);
        vp.positionDifferences.slice(0, 3).forEach(diff => {
          console.log(`      - ${diff.element}: Δtop=${Math.abs(diff.live.top - diff.local.top)}px`);
        });
      }
    }
  }
  
  const finalScore = (totalMatch / totalTests).toFixed(2);
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 FINAL VERBATIM SCORE: ' + finalScore + '%');
  console.log('='.repeat(70));
  
  if (finalScore >= 99) {
    console.log('✨ PERFECT VERBATIM MATCH ACHIEVED!');
    console.log('The clone is visually indistinguishable from the original.');
  } else if (finalScore >= 95) {
    console.log('✅ EXCELLENT MATCH!');
    console.log('The clone is nearly identical with minor sub-pixel differences.');
  } else if (finalScore >= 90) {
    console.log('⚠️ GOOD MATCH');
    console.log('The clone is very similar but has some visible differences.');
  } else {
    console.log('❌ SIGNIFICANT DIFFERENCES DETECTED');
    console.log('The clone needs refinement to achieve verbatim match.');
  }
  
  // Save detailed JSON report
  const report = {
    timestamp: new Date().toISOString(),
    finalScore,
    pages: detailedResults
  };
  
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'verbatim-analysis-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n📁 Full analysis saved to: ${OUTPUT_DIR}`);
  console.log('   - Screenshots for all pages and viewports');
  console.log('   - Pixel difference maps');
  console.log('   - Detailed JSON report');
  
  return finalScore;
}

// Ensure server is running
console.log('⚠️ Make sure local server is running:');
console.log('  cd bounder_enhanced');
console.log('  python3 -m http.server 8080\n');

// Run the analysis
analyzeVerbatimMatch().catch(console.error);