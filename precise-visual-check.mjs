import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function precisVisualCheck() {
  const outputDir = path.join(__dirname, 'precise-comparison');
  await fs.ensureDir(outputDir);
  await fs.ensureDir(path.join(outputDir, 'live'));
  await fs.ensureDir(path.join(outputDir, 'local'));
  await fs.ensureDir(path.join(outputDir, 'diff'));
  
  console.log('🎯 Starting Precise Visual Comparison\n');
  console.log('This will ensure your cloned site looks EXACTLY like the original.\n');
  
  // Launch browsers
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });
  
  const results = [];
  const pages = [
    { url: '/', name: 'homepage' },
    { url: '/contact', name: 'contact' },
    { url: '/privacy', name: 'privacy' },
    { url: '/new-page', name: 'terms' },
    { url: '/gallery-shift', name: 'gallery' },
    { url: '/ride-to-live-shift', name: 'ride-to-live' }
  ];
  
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 812, name: 'mobile' }
  ];
  
  for (const pageInfo of pages) {
    console.log(`\n📸 Checking ${pageInfo.name}...`);
    
    for (const viewport of viewports) {
      console.log(`  ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      try {
        // Capture live site
        const livePage = await browser.newPage();
        await livePage.setViewport({ width: viewport.width, height: viewport.height });
        await livePage.goto(`https://www.bounder.io${pageInfo.url}`, {
          waitUntil: 'networkidle0',
          timeout: 60000
        });
        
        // Wait for content to load and remove dynamic elements
        await livePage.evaluate(() => {
          // Remove cookie banners and dynamic elements
          const elements = [
            '.cookie-banner-mount-point',
            '.gdpr-cookie-banner',
            '.cookie-banner-manager',
            '.grecaptcha-badge',
            '[data-animation-role]'
          ];
          elements.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
          });
          
          // Stop all animations
          const style = document.createElement('style');
          style.innerHTML = `
            * {
              animation: none !important;
              transition: none !important;
              animation-duration: 0s !important;
              transition-duration: 0s !important;
            }
          `;
          document.head.appendChild(style);
          
          // Force font loading
          document.fonts.ready;
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for fonts and images
        
        const liveScreenshot = path.join(outputDir, 'live', `${pageInfo.name}-${viewport.name}.png`);
        await livePage.screenshot({ 
          path: liveScreenshot,
          fullPage: false
        });
        await livePage.close();
        
        // Capture local site
        const localPage = await browser.newPage();
        await localPage.setViewport({ width: viewport.width, height: viewport.height });
        await localPage.goto(`http://localhost:8080${pageInfo.url}`, {
          waitUntil: 'networkidle0',
          timeout: 60000
        });
        
        // Same cleanup for local
        await localPage.evaluate(() => {
          const elements = [
            '.cookie-banner-mount-point',
            '.gdpr-cookie-banner',
            '.cookie-banner-manager',
            '.grecaptcha-badge',
            '[data-animation-role]'
          ];
          elements.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
          });
          
          const style = document.createElement('style');
          style.innerHTML = `
            * {
              animation: none !important;
              transition: none !important;
              animation-duration: 0s !important;
              transition-duration: 0s !important;
            }
          `;
          document.head.appendChild(style);
          
          document.fonts.ready;
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const localScreenshot = path.join(outputDir, 'local', `${pageInfo.name}-${viewport.name}.png`);
        await localPage.screenshot({ 
          path: localScreenshot,
          fullPage: false
        });
        await localPage.close();
        
        // Compare images
        const img1 = PNG.sync.read(await fs.readFile(liveScreenshot));
        const img2 = PNG.sync.read(await fs.readFile(localScreenshot));
        
        // Create diff image
        const diff = new PNG({ width: img1.width, height: img1.height });
        const numDiffPixels = pixelmatch(
          img1.data,
          img2.data,
          diff.data,
          img1.width,
          img1.height,
          { threshold: 0.1, includeAA: true }
        );
        
        const diffPath = path.join(outputDir, 'diff', `${pageInfo.name}-${viewport.name}.png`);
        await fs.writeFile(diffPath, PNG.sync.write(diff));
        
        const totalPixels = img1.width * img1.height;
        const diffPercentage = ((numDiffPixels / totalPixels) * 100).toFixed(2);
        
        results.push({
          page: pageInfo.name,
          viewport: viewport.name,
          diffPixels: numDiffPixels,
          totalPixels,
          percentage: diffPercentage,
          status: diffPercentage < 1 ? '✅ PERFECT' : 
                  diffPercentage < 5 ? '⚠️ GOOD' : '❌ CHECK'
        });
        
        console.log(`    ${results[results.length - 1].status} - ${diffPercentage}% difference`);
        
      } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
        results.push({
          page: pageInfo.name,
          viewport: viewport.name,
          error: error.message,
          status: '❌ ERROR'
        });
      }
    }
  }
  
  await browser.close();
  
  // Generate HTML report
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Precise Visual Comparison - Bounder.io</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #333;
      font-size: 36px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 18px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 15px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
    .comparison-grid {
      display: grid;
      gap: 30px;
    }
    .comparison-item {
      border: 1px solid #e0e0e0;
      border-radius: 15px;
      overflow: hidden;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .comparison-item:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .comparison-header {
      background: #f8f9fa;
      padding: 15px 20px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .comparison-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    .status-badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    .status-perfect {
      background: #4caf50;
      color: white;
    }
    .status-good {
      background: #ff9800;
      color: white;
    }
    .status-check {
      background: #f44336;
      color: white;
    }
    .comparison-images {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
    }
    .image-container {
      position: relative;
      aspect-ratio: 16/9;
      overflow: hidden;
      border-right: 1px solid #e0e0e0;
    }
    .image-container:last-child {
      border-right: none;
    }
    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
      transition: transform 0.3s;
    }
    .image-container:hover img {
      transform: scale(1.05);
    }
    .image-label {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 8px;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.95);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    .modal.active {
      display: flex;
    }
    .modal img {
      max-width: 90%;
      max-height: 90%;
      border-radius: 10px;
    }
    .close-modal {
      position: absolute;
      top: 20px;
      right: 40px;
      color: white;
      font-size: 40px;
      cursor: pointer;
      transition: transform 0.3s;
    }
    .close-modal:hover {
      transform: rotate(90deg);
    }
    .summary {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 15px;
      padding: 30px;
      margin-bottom: 40px;
    }
    .summary h2 {
      color: #333;
      margin-bottom: 20px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .summary-icon {
      font-size: 30px;
    }
    .overall-score {
      text-align: center;
      margin: 40px 0;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      color: white;
    }
    .score-value {
      font-size: 72px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .score-label {
      font-size: 24px;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 Precise Visual Comparison Report</h1>
    <p class="subtitle">Pixel-perfect comparison between live Bounder.io and local clone</p>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${results.length}</div>
        <div class="stat-label">Total Comparisons</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${results.filter(r => r.percentage && parseFloat(r.percentage) < 1).length}</div>
        <div class="stat-label">Perfect Matches</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${results.filter(r => r.percentage && parseFloat(r.percentage) < 5).length}</div>
        <div class="stat-label">Good Matches</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${results.filter(r => !r.error).length}</div>
        <div class="stat-label">Successful Tests</div>
      </div>
    </div>
    
    ${(() => {
      const validResults = results.filter(r => r.percentage);
      if (validResults.length > 0) {
        const avgDiff = validResults.reduce((sum, r) => sum + parseFloat(r.percentage), 0) / validResults.length;
        const score = Math.max(0, 100 - avgDiff).toFixed(1);
        return `
          <div class="overall-score">
            <div class="score-value">${score}%</div>
            <div class="score-label">Visual Fidelity Score</div>
          </div>
        `;
      }
      return '';
    })()}
    
    <div class="summary">
      <h2>📊 Summary Analysis</h2>
      <div class="summary-grid">
        ${results.every(r => !r.error && parseFloat(r.percentage || 100) < 1) ? 
          '<div class="summary-item"><span class="summary-icon">✅</span><div><strong>Perfect Clone!</strong><br>Your site is visually identical to the original.</div></div>' : ''}
        ${results.some(r => parseFloat(r.percentage || 0) > 5) ? 
          '<div class="summary-item"><span class="summary-icon">⚠️</span><div><strong>Visual Differences Detected</strong><br>Some pages need attention.</div></div>' : ''}
        ${results.some(r => r.error) ? 
          '<div class="summary-item"><span class="summary-icon">❌</span><div><strong>Errors Encountered</strong><br>Some comparisons failed.</div></div>' : ''}
        <div class="summary-item">
          <span class="summary-icon">📱</span>
          <div><strong>Responsive Testing</strong><br>Checked ${[...new Set(results.map(r => r.viewport))].length} viewports</div>
        </div>
      </div>
    </div>
    
    <div class="comparison-grid">
      ${results.map(r => {
        if (r.error) {
          return `
            <div class="comparison-item">
              <div class="comparison-header">
                <div class="comparison-title">${r.page} - ${r.viewport}</div>
                <span class="status-badge status-check">ERROR</span>
              </div>
              <div style="padding: 20px; color: #f44336;">
                ${r.error}
              </div>
            </div>
          `;
        }
        
        const statusClass = parseFloat(r.percentage) < 1 ? 'perfect' : 
                           parseFloat(r.percentage) < 5 ? 'good' : 'check';
        
        return `
          <div class="comparison-item">
            <div class="comparison-header">
              <div class="comparison-title">${r.page} - ${r.viewport}</div>
              <span class="status-badge status-${statusClass}">${r.percentage}% diff</span>
            </div>
            <div class="comparison-images">
              <div class="image-container">
                <img src="live/${r.page}-${r.viewport}.png" alt="Live" onclick="openModal(this.src)">
                <div class="image-label">Live Site</div>
              </div>
              <div class="image-container">
                <img src="local/${r.page}-${r.viewport}.png" alt="Local" onclick="openModal(this.src)">
                <div class="image-label">Local Clone</div>
              </div>
              <div class="image-container">
                <img src="diff/${r.page}-${r.viewport}.png" alt="Diff" onclick="openModal(this.src)">
                <div class="image-label">Pixel Diff</div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </div>
  
  <div class="modal" id="modal" onclick="closeModal()">
    <span class="close-modal">×</span>
    <img id="modalImg" src="" alt="">
  </div>
  
  <script>
    function openModal(src) {
      const modal = document.getElementById('modal');
      const modalImg = document.getElementById('modalImg');
      modal.classList.add('active');
      modalImg.src = src;
      event.stopPropagation();
    }
    
    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  </script>
</body>
</html>`;
  
  const reportPath = path.join(outputDir, 'report.html');
  await fs.writeFile(reportPath, html);
  
  // Save JSON results
  await fs.writeFile(
    path.join(outputDir, 'results.json'),
    JSON.stringify(results, null, 2)
  );
  
  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ PRECISE VISUAL COMPARISON COMPLETE');
  console.log('='.repeat(60));
  
  const validResults = results.filter(r => r.percentage);
  if (validResults.length > 0) {
    const avgDiff = validResults.reduce((sum, r) => sum + parseFloat(r.percentage), 0) / validResults.length;
    const score = Math.max(0, 100 - avgDiff).toFixed(1);
    
    console.log(`\n🎯 Visual Fidelity Score: ${score}%`);
    
    if (score >= 99) {
      console.log('✅ PERFECT: Your clone is visually identical!');
    } else if (score >= 95) {
      console.log('✅ EXCELLENT: Your clone matches extremely well!');
    } else if (score >= 90) {
      console.log('⚠️ GOOD: Minor visual differences detected.');
    } else {
      console.log('❌ CHECK: Significant visual differences found.');
    }
  }
  
  console.log(`\n📊 View detailed report: file://${reportPath}`);
  console.log('💡 Tip: Click on images in the report to view them full-size');
}

// Run the check
precisVisualCheck().catch(console.error);