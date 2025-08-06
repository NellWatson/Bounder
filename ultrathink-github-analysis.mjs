import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ultrathinkGitHubAnalysis() {
  console.log('🔬 ULTRATHINK: DEEP GITHUB ICON ANALYSIS\n');
  console.log('='.repeat(80));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    // 1. Analyze ORIGINAL site
    console.log('\n📊 ANALYZING ORIGINAL BOUNDER.IO...\n');
    const originalPage = await browser.newPage();
    await originalPage.goto('https://www.bounder.io', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    // Wait for footer to load
    await originalPage.waitForSelector('footer', { timeout: 30000 });
    
    // Capture GitHub link details from original
    const originalGitHub = await originalPage.evaluate(() => {
      const results = {
        links: [],
        styles: [],
        html: [],
        computed: []
      };
      
      // Find all GitHub links
      const githubLinks = document.querySelectorAll('a[href*="github.com"]');
      
      githubLinks.forEach((link, index) => {
        const rect = link.getBoundingClientRect();
        const computed = window.getComputedStyle(link);
        const parent = link.parentElement;
        const parentComputed = parent ? window.getComputedStyle(parent) : null;
        
        // Get all child elements
        const children = [];
        link.childNodes.forEach(child => {
          if (child.nodeType === 1) { // Element node
            const childComputed = window.getComputedStyle(child);
            children.push({
              tagName: child.tagName,
              className: child.className,
              innerHTML: child.innerHTML,
              outerHTML: child.outerHTML,
              styles: {
                display: childComputed.display,
                width: childComputed.width,
                height: childComputed.height,
                backgroundColor: childComputed.backgroundColor,
                fill: childComputed.fill,
                color: childComputed.color
              }
            });
          }
        });
        
        results.links.push({
          href: link.href,
          innerHTML: link.innerHTML,
          outerHTML: link.outerHTML,
          className: link.className,
          id: link.id,
          rect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          },
          computed: {
            display: computed.display,
            width: computed.width,
            height: computed.height,
            padding: computed.padding,
            margin: computed.margin,
            backgroundColor: computed.backgroundColor,
            borderRadius: computed.borderRadius,
            position: computed.position,
            color: computed.color,
            fill: computed.fill
          },
          parent: {
            tagName: parent?.tagName,
            className: parent?.className,
            computed: parentComputed ? {
              display: parentComputed.display,
              backgroundColor: parentComputed.backgroundColor
            } : null
          },
          children: children
        });
      });
      
      // Also check for any SVG icons specifically
      const svgIcons = document.querySelectorAll('footer svg, .social-icons svg');
      svgIcons.forEach(svg => {
        const parent = svg.closest('a');
        if (parent && parent.href && parent.href.includes('github')) {
          results.styles.push({
            svg: svg.outerHTML,
            viewBox: svg.getAttribute('viewBox'),
            width: svg.getAttribute('width'),
            height: svg.getAttribute('height'),
            fill: window.getComputedStyle(svg).fill,
            color: window.getComputedStyle(svg).color
          });
        }
      });
      
      // Check for icon fonts or specific classes
      const iconElements = document.querySelectorAll('.sqs-svg-icon--wrapper, .social-icon, [class*="github"], [class*="icon"]');
      iconElements.forEach(el => {
        const link = el.closest('a');
        if (link && link.href && link.href.includes('github')) {
          const computed = window.getComputedStyle(el);
          results.computed.push({
            element: el.tagName,
            className: el.className,
            innerHTML: el.innerHTML,
            beforeContent: window.getComputedStyle(el, ':before').content,
            afterContent: window.getComputedStyle(el, ':after').content,
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            backgroundImage: computed.backgroundImage
          });
        }
      });
      
      return results;
    });
    
    console.log('Original GitHub Implementation:');
    console.log(JSON.stringify(originalGitHub, null, 2));
    
    // 2. Analyze CLONED site
    console.log('\n📊 ANALYZING CLONED SITE...\n');
    const clonedPage = await browser.newPage();
    await clonedPage.goto('https://nellinc.github.io/Bounder/', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    // Wait for footer
    await clonedPage.waitForSelector('footer', { timeout: 30000 });
    
    // Capture GitHub link details from cloned
    const clonedGitHub = await clonedPage.evaluate(() => {
      const results = {
        links: [],
        styles: [],
        computed: []
      };
      
      // Find all GitHub links
      const githubLinks = document.querySelectorAll('a[href*="github.com"]');
      
      githubLinks.forEach((link, index) => {
        const rect = link.getBoundingClientRect();
        const computed = window.getComputedStyle(link);
        const parent = link.parentElement;
        
        // Check what's actually visible
        const isVisible = rect.width > 0 && rect.height > 0 && computed.display !== 'none';
        
        results.links.push({
          href: link.href,
          innerHTML: link.innerHTML.substring(0, 200), // Truncate for readability
          className: link.className,
          isVisible: isVisible,
          rect: {
            width: rect.width,
            height: rect.height
          },
          computed: {
            display: computed.display,
            backgroundColor: computed.backgroundColor,
            borderRadius: computed.borderRadius,
            width: computed.width,
            height: computed.height,
            color: computed.color,
            fill: computed.fill
          },
          svgPresent: link.querySelector('svg') !== null,
          imgPresent: link.querySelector('img') !== null
        });
      });
      
      // Check actual SVG rendering
      const svgs = document.querySelectorAll('footer svg');
      svgs.forEach(svg => {
        const computed = window.getComputedStyle(svg);
        results.styles.push({
          width: svg.getAttribute('width'),
          height: svg.getAttribute('height'),
          viewBox: svg.getAttribute('viewBox'),
          fill: svg.getAttribute('fill'),
          computedFill: computed.fill,
          computedColor: computed.color,
          display: computed.display
        });
      });
      
      return results;
    });
    
    console.log('\nCloned GitHub Implementation:');
    console.log(JSON.stringify(clonedGitHub, null, 2));
    
    // 3. Take screenshots for visual comparison
    console.log('\n📸 CAPTURING SCREENSHOTS...\n');
    
    // Screenshot original footer
    const originalFooter = await originalPage.$('footer');
    if (originalFooter) {
      await originalFooter.screenshot({ 
        path: path.join(__dirname, 'original-footer-github.png')
      });
      console.log('  ✅ Captured original footer');
    }
    
    // Screenshot cloned footer
    const clonedFooter = await clonedPage.$('footer');
    if (clonedFooter) {
      await clonedFooter.screenshot({ 
        path: path.join(__dirname, 'cloned-footer-github.png')
      });
      console.log('  ✅ Captured cloned footer');
    }
    
    // Save analysis results
    await fs.writeFile(
      path.join(__dirname, 'github-icon-analysis.json'),
      JSON.stringify({ original: originalGitHub, cloned: clonedGitHub }, null, 2)
    );
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS COMPLETE!');
    console.log('\nKey findings saved to:');
    console.log('  • github-icon-analysis.json');
    console.log('  • original-footer-github.png');
    console.log('  • cloned-footer-github.png');
    
  } finally {
    await browser.close();
  }
}

ultrathinkGitHubAnalysis().catch(console.error);