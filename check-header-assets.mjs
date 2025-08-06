import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import axios from 'axios';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function checkAndFixHeaderAssets() {
  console.log('🔍 Checking logo, favicon, and header links...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // Check live site first
  console.log('📊 Analyzing live site header assets...');
  const livePage = await browser.newPage();
  await livePage.goto('https://www.bounder.io/', { waitUntil: 'networkidle0' });
  
  const liveAssets = await livePage.evaluate(() => {
    const assets = {
      logo: null,
      favicon: null,
      headerLinks: []
    };
    
    // Find logo
    const logoImg = document.querySelector('.header-title-logo img, .logo img, img[alt*="BOUNDER"], img[alt*="Bounder"]');
    if (logoImg) {
      assets.logo = {
        src: logoImg.src,
        alt: logoImg.alt,
        width: logoImg.width,
        height: logoImg.height
      };
    }
    
    // Find favicon
    const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (favicon) {
      assets.favicon = favicon.href;
    }
    
    // Find header navigation links
    const navLinks = document.querySelectorAll('header a, nav a, .header-nav a');
    navLinks.forEach(link => {
      assets.headerLinks.push({
        text: link.textContent.trim(),
        href: link.href,
        target: link.target
      });
    });
    
    return assets;
  });
  
  console.log('\n📌 Found on live site:');
  console.log('  Logo:', liveAssets.logo ? `${liveAssets.logo.src}` : 'Not found');
  console.log('  Favicon:', liveAssets.favicon || 'Not found');
  console.log('  Header links:', liveAssets.headerLinks.length);
  
  // Download favicon if found
  if (liveAssets.favicon) {
    console.log('\n📥 Downloading favicon...');
    try {
      const response = await axios.get(liveAssets.favicon, {
        responseType: 'arraybuffer'
      });
      
      const faviconPath = path.join(__dirname, 'bounder_enhanced', 'favicon.ico');
      await fs.writeFile(faviconPath, response.data);
      console.log('  ✅ Favicon downloaded');
    } catch (error) {
      console.log('  ❌ Could not download favicon');
    }
  }
  
  // Download logo if found
  if (liveAssets.logo) {
    console.log('\n📥 Downloading logo...');
    try {
      const response = await axios.get(liveAssets.logo.src, {
        responseType: 'arraybuffer'
      });
      
      const logoPath = path.join(__dirname, 'bounder_enhanced', 'assets', 'logo.png');
      await fs.ensureDir(path.dirname(logoPath));
      await fs.writeFile(logoPath, response.data);
      console.log('  ✅ Logo downloaded');
    } catch (error) {
      console.log('  ❌ Could not download logo');
    }
  }
  
  // Check local clone
  console.log('\n📊 Checking local clone...');
  const localPage = await browser.newPage();
  await localPage.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  
  const localAssets = await localPage.evaluate(() => {
    const assets = {
      logo: null,
      favicon: null,
      headerLinks: [],
      issues: []
    };
    
    // Find logo
    const logoImg = document.querySelector('.header-title-logo img, .logo img, img[alt*="BOUNDER"], img[alt*="Bounder"]');
    if (logoImg) {
      assets.logo = {
        src: logoImg.src,
        alt: logoImg.alt,
        displayed: logoImg.offsetWidth > 0 && logoImg.offsetHeight > 0
      };
      
      if (!assets.logo.displayed) {
        assets.issues.push('Logo image not displayed');
      }
    } else {
      assets.issues.push('Logo not found in HTML');
    }
    
    // Find favicon
    const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (favicon) {
      assets.favicon = favicon.href;
    } else {
      assets.issues.push('Favicon link not found');
    }
    
    // Find header navigation links
    const navLinks = document.querySelectorAll('header a, nav a, .header-nav a');
    navLinks.forEach(link => {
      const isWorking = !link.href.includes('undefined') && !link.href.includes('null');
      assets.headerLinks.push({
        text: link.textContent.trim(),
        href: link.href,
        working: isWorking
      });
      
      if (!isWorking) {
        assets.issues.push(`Broken link: ${link.textContent.trim()}`);
      }
    });
    
    return assets;
  });
  
  console.log('\n📋 Local clone status:');
  console.log('  Logo:', localAssets.logo ? (localAssets.logo.displayed ? '✅ Displayed' : '❌ Not displayed') : '❌ Not found');
  console.log('  Favicon:', localAssets.favicon ? '✅ Present' : '❌ Missing');
  console.log('  Working header links:', localAssets.headerLinks.filter(l => l.working).length, '/', localAssets.headerLinks.length);
  
  if (localAssets.issues.length > 0) {
    console.log('\n⚠️ Issues found:');
    localAssets.issues.forEach(issue => console.log('  -', issue));
  }
  
  await browser.close();
  
  console.log('\n✅ Assessment complete!');
  return { liveAssets, localAssets };
}

// Run check
checkAndFixHeaderAssets().catch(console.error);