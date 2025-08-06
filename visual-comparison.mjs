import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class VisualComparison {
  constructor() {
    this.outputDir = path.join(__dirname, 'visual-comparison');
    this.liveUrl = 'https://www.bounder.io';
    this.localUrl = 'http://localhost:8080';
    this.results = [];
    this.viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'wide', width: 2560, height: 1440 }
    ];
    this.pages = [
      { path: '/', name: 'homepage' },
      { path: '/contact', name: 'contact' },
      { path: '/privacy', name: 'privacy' },
      { path: '/new-page', name: 'terms' },
      { path: '/gallery-shift', name: 'gallery' },
      { path: '/ride-to-live-shift', name: 'ride-to-live' }
    ];
  }

  async init() {
    await fs.ensureDir(this.outputDir);
    await fs.ensureDir(path.join(this.outputDir, 'screenshots'));
    await fs.ensureDir(path.join(this.outputDir, 'diffs'));
    console.log('🎯 Starting comprehensive visual comparison...\n');
  }

  async launchBrowsers() {
    console.log('🚀 Launching browsers...');
    this.liveBrowser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-web-security']
    });
    this.localBrowser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-web-security', '--allow-file-access-from-files']
    });
  }

  async captureScreenshot(browser, url, viewport, pageName, prefix) {
    const page = await browser.newPage();
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 2 // High DPI for better comparison
    });

    try {
      // Navigate and wait for full load
      await page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 60000
      });

      // Wait for animations to settle
      await page.waitForTimeout(3000);

      // Remove any dynamic elements that might differ
      await page.evaluate(() => {
        // Remove cookie banners
        const cookieBanners = document.querySelectorAll('.cookie-banner-mount-point, .gdpr-cookie-banner, .cookie-banner-manager');
        cookieBanners.forEach(el => el.remove());
        
        // Remove any recaptcha badges
        const recaptcha = document.querySelectorAll('.grecaptcha-badge');
        recaptcha.forEach(el => el.remove());
        
        // Stabilize any animations
        const style = document.createElement('style');
        style.innerHTML = '* { animation: none !important; transition: none !important; }';
        document.head.appendChild(style);
      });

      // Capture both viewport and full page
      const viewportPath = path.join(
        this.outputDir,
        'screenshots',
        `${prefix}-${pageName}-${viewport.name}-viewport.png`
      );
      
      const fullPagePath = path.join(
        this.outputDir,
        'screenshots',
        `${prefix}-${pageName}-${viewport.name}-fullpage.png`
      );

      await page.screenshot({
        path: viewportPath,
        fullPage: false
      });

      await page.screenshot({
        path: fullPagePath,
        fullPage: true
      });

      // Capture specific elements if they exist
      const elements = {
        header: 'header',
        hero: '.parallax-item',
        content: '.content-wrapper',
        footer: 'footer'
      };

      for (const [name, selector] of Object.entries(elements)) {
        try {
          const element = await page.$(selector);
          if (element) {
            const elementPath = path.join(
              this.outputDir,
              'screenshots',
              `${prefix}-${pageName}-${viewport.name}-${name}.png`
            );
            await element.screenshot({ path: elementPath });
          }
        } catch (e) {
          // Element might not exist on this page
        }
      }

      // Test parallax scrolling on homepage
      if (pageName === 'homepage' && viewport.name === 'desktop') {
        const scrollPositions = [0, 300, 600, 900];
        for (const pos of scrollPositions) {
          await page.evaluate((scrollY) => window.scrollTo(0, scrollY), pos);
          await page.waitForTimeout(500);
          const scrollPath = path.join(
            this.outputDir,
            'screenshots',
            `${prefix}-${pageName}-scroll-${pos}.png`
          );
          await page.screenshot({ path: scrollPath, fullPage: false });
        }
      }

      // Capture hover states for buttons
      const buttons = await page.$$('.sqs-block-button-element');
      for (let i = 0; i < Math.min(buttons.length, 3); i++) {
        try {
          await buttons[i].hover();
          await page.waitForTimeout(200);
          const hoverPath = path.join(
            this.outputDir,
            'screenshots',
            `${prefix}-${pageName}-${viewport.name}-button-hover-${i}.png`
          );
          await buttons[i].screenshot({ path: hoverPath });
        } catch (e) {
          // Button might not be hoverable
        }
      }

      await page.close();
      return { success: true, viewport: viewport.name, page: pageName };
    } catch (error) {
      await page.close();
      return { success: false, error: error.message, viewport: viewport.name, page: pageName };
    }
  }

  async compareImages(img1Path, img2Path, diffPath) {
    try {
      // Read images
      const img1 = PNG.sync.read(await fs.readFile(img1Path));
      const img2 = PNG.sync.read(await fs.readFile(img2Path));

      // Resize if dimensions don't match
      if (img1.width !== img2.width || img1.height !== img2.height) {
        const targetWidth = Math.min(img1.width, img2.width);
        const targetHeight = Math.min(img1.height, img2.height);
        
        // Resize both images to the smaller dimensions
        const resized1 = await sharp(img1Path)
          .resize(targetWidth, targetHeight)
          .toBuffer();
        const resized2 = await sharp(img2Path)
          .resize(targetWidth, targetHeight)
          .toBuffer();
        
        const img1Resized = PNG.sync.read(resized1);
        const img2Resized = PNG.sync.read(resized2);
        
        const diff = new PNG({ width: targetWidth, height: targetHeight });
        const numDiffPixels = pixelmatch(
          img1Resized.data,
          img2Resized.data,
          diff.data,
          targetWidth,
          targetHeight,
          { threshold: 0.1, includeAA: true }
        );
        
        await fs.writeFile(diffPath, PNG.sync.write(diff));
        
        const percentage = (numDiffPixels / (targetWidth * targetHeight)) * 100;
        return { 
          difference: percentage.toFixed(2),
          pixels: numDiffPixels,
          resized: true
        };
      }

      // Compare images
      const diff = new PNG({ width: img1.width, height: img1.height });
      const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        img1.width,
        img1.height,
        { threshold: 0.1, includeAA: true }
      );

      await fs.writeFile(diffPath, PNG.sync.write(diff));

      const percentage = (numDiffPixels / (img1.width * img1.height)) * 100;
      return { 
        difference: percentage.toFixed(2),
        pixels: numDiffPixels,
        resized: false
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async runComparison() {
    await this.launchBrowsers();

    // Capture screenshots for all pages and viewports
    for (const page of this.pages) {
      console.log(`\n📸 Capturing ${page.name}...`);
      
      for (const viewport of this.viewports) {
        console.log(`  ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        const liveResult = await this.captureScreenshot(
          this.liveBrowser,
          this.liveUrl + page.path,
          viewport,
          page.name,
          'live'
        );
        
        const localResult = await this.captureScreenshot(
          this.localBrowser,
          this.localUrl + page.path,
          viewport,
          page.name,
          'local'
        );
        
        // Compare viewport screenshots
        if (liveResult.success && localResult.success) {
          const livePath = path.join(
            this.outputDir,
            'screenshots',
            `live-${page.name}-${viewport.name}-viewport.png`
          );
          const localPath = path.join(
            this.outputDir,
            'screenshots',
            `local-${page.name}-${viewport.name}-viewport.png`
          );
          const diffPath = path.join(
            this.outputDir,
            'diffs',
            `diff-${page.name}-${viewport.name}-viewport.png`
          );
          
          const comparison = await this.compareImages(livePath, localPath, diffPath);
          
          this.results.push({
            page: page.name,
            viewport: viewport.name,
            type: 'viewport',
            ...comparison
          });
          
          if (comparison.difference) {
            const status = parseFloat(comparison.difference) < 1 ? '✅' : 
                          parseFloat(comparison.difference) < 5 ? '⚠️' : '❌';
            console.log(`    ${status} Difference: ${comparison.difference}%`);
          }
        }
      }
    }

    await this.liveBrowser.close();
    await this.localBrowser.close();
  }

  async checkComputedStyles() {
    console.log('\n🎨 Checking computed styles...');
    
    const browser = await puppeteer.launch({ headless: 'new' });
    const livePage = await browser.newPage();
    const localPage = await browser.newPage();
    
    await livePage.goto(this.liveUrl, { waitUntil: 'networkidle0' });
    await localPage.goto(this.localUrl, { waitUntil: 'networkidle0' });
    
    const selectors = [
      'body',
      'h1',
      'h2',
      '.site-title',
      '.page-title',
      '.sqs-block-button-element',
      '.main-nav',
      'footer'
    ];
    
    const styleResults = [];
    
    for (const selector of selectors) {
      try {
        const liveStyles = await livePage.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const styles = window.getComputedStyle(el);
          return {
            fontFamily: styles.fontFamily,
            fontSize: styles.fontSize,
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            padding: styles.padding,
            margin: styles.margin
          };
        }, selector);
        
        const localStyles = await localPage.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const styles = window.getComputedStyle(el);
          return {
            fontFamily: styles.fontFamily,
            fontSize: styles.fontSize,
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            padding: styles.padding,
            margin: styles.margin
          };
        }, selector);
        
        if (liveStyles && localStyles) {
          const match = JSON.stringify(liveStyles) === JSON.stringify(localStyles);
          styleResults.push({
            selector,
            match,
            live: liveStyles,
            local: localStyles
          });
          console.log(`  ${match ? '✅' : '❌'} ${selector}`);
        }
      } catch (e) {
        // Element might not exist
      }
    }
    
    await browser.close();
    return styleResults;
  }

  async generateReport() {
    console.log('\n📊 Generating comparison report...');
    
    const styleResults = await this.checkComputedStyles();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Visual Comparison Report - Bounder.io</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #007AFF;
      padding-bottom: 10px;
    }
    .summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .comparison-card {
      background: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .comparison-card h3 {
      margin-top: 0;
      color: #555;
    }
    .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
    }
    .status.perfect { background: #4CAF50; color: white; }
    .status.good { background: #8BC34A; color: white; }
    .status.warning { background: #FFC107; color: #333; }
    .status.error { background: #F44336; color: white; }
    .images {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 20px;
    }
    .images img {
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .images .label {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      margin-top: 20px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f8f8f8;
      font-weight: 600;
    }
    .style-match { color: #4CAF50; }
    .style-mismatch { color: #F44336; }
    .metric {
      display: inline-block;
      margin-right: 20px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #007AFF;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <h1>🎯 Visual Comparison Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${this.results.length}</div>
        <div class="metric-label">Comparisons</div>
      </div>
      <div class="metric">
        <div class="metric-value">${this.results.filter(r => parseFloat(r.difference || 100) < 1).length}</div>
        <div class="metric-label">Perfect Matches</div>
      </div>
      <div class="metric">
        <div class="metric-value">${this.results.filter(r => parseFloat(r.difference || 100) < 5).length}</div>
        <div class="metric-label">Good Matches</div>
      </div>
      <div class="metric">
        <div class="metric-value">${Math.min(...this.results.map(r => parseFloat(r.difference || 100))).toFixed(2)}%</div>
        <div class="metric-label">Best Match</div>
      </div>
      <div class="metric">
        <div class="metric-value">${Math.max(...this.results.map(r => parseFloat(r.difference || 0))).toFixed(2)}%</div>
        <div class="metric-label">Worst Match</div>
      </div>
    </div>
  </div>

  <h2>Visual Comparisons</h2>
  <div class="grid">
    ${this.results.map(r => {
      const diff = parseFloat(r.difference || 100);
      const status = diff < 0.1 ? 'perfect' :
                    diff < 1 ? 'good' :
                    diff < 5 ? 'warning' : 'error';
      const statusText = diff < 0.1 ? 'PERFECT' :
                        diff < 1 ? 'EXCELLENT' :
                        diff < 5 ? 'GOOD' : 'CHECK';
      
      return `
        <div class="comparison-card">
          <h3>${r.page} - ${r.viewport}</h3>
          <span class="status ${status}">${statusText}</span>
          <p><strong>Difference:</strong> ${r.difference}% (${r.pixels} pixels)</p>
          ${r.resized ? '<p>⚠️ Images were resized for comparison</p>' : ''}
          <div class="images">
            <div>
              <img src="screenshots/live-${r.page}-${r.viewport}-${r.type}.png" alt="Live">
              <div class="label">Live Site</div>
            </div>
            <div>
              <img src="screenshots/local-${r.page}-${r.viewport}-${r.type}.png" alt="Local">
              <div class="label">Local Clone</div>
            </div>
            <div>
              <img src="diffs/diff-${r.page}-${r.viewport}-${r.type}.png" alt="Diff">
              <div class="label">Difference</div>
            </div>
          </div>
        </div>
      `;
    }).join('')}
  </div>

  <h2>Computed Styles Comparison</h2>
  <table>
    <thead>
      <tr>
        <th>Selector</th>
        <th>Match</th>
        <th>Font Family</th>
        <th>Font Size</th>
        <th>Color</th>
        <th>Background</th>
      </tr>
    </thead>
    <tbody>
      ${styleResults.map(s => `
        <tr>
          <td><code>${s.selector}</code></td>
          <td class="${s.match ? 'style-match' : 'style-mismatch'}">${s.match ? '✅ Match' : '❌ Mismatch'}</td>
          <td>${s.local?.fontFamily || '-'}</td>
          <td>${s.local?.fontSize || '-'}</td>
          <td>${s.local?.color || '-'}</td>
          <td>${s.local?.backgroundColor || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary" style="margin-top: 30px;">
    <h2>Recommendations</h2>
    <ul>
      ${this.results.some(r => parseFloat(r.difference || 0) > 5) ? 
        '<li>⚠️ Some pages show significant visual differences. Review the diff images above.</li>' : ''}
      ${this.results.every(r => parseFloat(r.difference || 100) < 1) ? 
        '<li>✅ All pages show excellent visual fidelity (< 1% difference)</li>' : ''}
      ${styleResults.some(s => !s.match) ? 
        '<li>⚠️ Some computed styles differ. Check font loading and CSS files.</li>' : ''}
      <li>📱 Test on actual devices to verify responsive behavior</li>
      <li>🎯 Check interactive elements like hover states and animations manually</li>
      <li>🔍 Verify parallax scrolling effects on the homepage</li>
    </ul>
  </div>

  <script>
    // Add image lightbox functionality
    document.querySelectorAll('.images img').forEach(img => {
      img.style.cursor = 'pointer';
      img.onclick = () => {
        const modal = document.createElement('div');
        modal.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999';
        modal.onclick = () => modal.remove();
        const modalImg = document.createElement('img');
        modalImg.src = img.src;
        modalImg.style = 'max-width:90%;max-height:90%;';
        modal.appendChild(modalImg);
        document.body.appendChild(modal);
      };
    });
  </script>
</body>
</html>`;

    const reportPath = path.join(this.outputDir, 'report.html');
    await fs.writeFile(reportPath, html);
    
    // Save JSON data
    const jsonPath = path.join(this.outputDir, 'comparison-data.json');
    await fs.writeFile(jsonPath, JSON.stringify({
      results: this.results,
      styles: styleResults,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(`\n✅ Report generated: ${reportPath}`);
    console.log(`📊 Open in browser: file://${reportPath}`);
  }

  async run() {
    await this.init();
    await this.runComparison();
    await this.generateReport();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 VISUAL COMPARISON COMPLETE');
    console.log('='.repeat(60));
    
    const perfect = this.results.filter(r => parseFloat(r.difference || 100) < 0.1).length;
    const excellent = this.results.filter(r => parseFloat(r.difference || 100) < 1).length;
    const good = this.results.filter(r => parseFloat(r.difference || 100) < 5).length;
    
    console.log(`\n📊 Results Summary:`);
    console.log(`   Perfect matches (<0.1%): ${perfect}/${this.results.length}`);
    console.log(`   Excellent matches (<1%): ${excellent}/${this.results.length}`);
    console.log(`   Good matches (<5%): ${good}/${this.results.length}`);
    
    const avgDiff = this.results.reduce((sum, r) => sum + parseFloat(r.difference || 0), 0) / this.results.length;
    console.log(`   Average difference: ${avgDiff.toFixed(2)}%`);
    
    if (avgDiff < 1) {
      console.log('\n✅ EXCELLENT: The cloned site is visually identical to the original!');
    } else if (avgDiff < 5) {
      console.log('\n✅ GOOD: The cloned site closely matches the original with minor differences.');
    } else {
      console.log('\n⚠️ CHECK: Some visual differences detected. Review the report for details.');
    }
  }
}

// Run the comparison
const comparison = new VisualComparison();
comparison.run().catch(console.error);