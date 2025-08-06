import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLONE_DIR = path.join(__dirname, 'bounder_enhanced');

async function fixResponsiveRendering() {
  console.log('🔧 Fixing responsive rendering issues...\n');
  
  // Get all HTML files
  const htmlFiles = await fs.readdir(CLONE_DIR);
  const htmlPages = htmlFiles.filter(f => f.endsWith('.html'));
  
  for (const file of htmlPages) {
    console.log(`📝 Processing ${file}...`);
    const filePath = path.join(CLONE_DIR, file);
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);
    
    // 1. Ensure viewport meta tag is correct
    let viewportMeta = $('meta[name="viewport"]');
    if (viewportMeta.length === 0) {
      $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">');
      console.log('  ✅ Added viewport meta tag');
    } else {
      viewportMeta.attr('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0');
      console.log('  ✅ Updated viewport meta tag');
    }
    
    // 2. Remove fixed widths from inline styles that break responsiveness
    $('*[style*="width: 1920px"]').each((_, el) => {
      const $el = $(el);
      let style = $el.attr('style');
      if (style) {
        // Replace fixed 1920px width with max-width
        style = style.replace(/width:\s*1920px/g, 'max-width: 1920px; width: 100%');
        $el.attr('style', style);
      }
    });
    
    $('*[style*="width: 960px"]').each((_, el) => {
      const $el = $(el);
      let style = $el.attr('style');
      if (style) {
        // Common content width - make it responsive
        style = style.replace(/width:\s*960px/g, 'max-width: 960px; width: 100%');
        $el.attr('style', style);
      }
    });
    
    // 3. Add critical responsive CSS
    const responsiveCSS = `
      <style id="responsive-fixes">
        /* Responsive base styles */
        * {
          box-sizing: border-box;
        }
        
        html, body {
          width: 100%;
          overflow-x: hidden;
        }
        
        img {
          max-width: 100%;
          height: auto;
        }
        
        /* Container responsiveness */
        .site-wrapper, .site-inner-wrapper, .content-wrapper {
          max-width: 100%;
          width: 100%;
        }
        
        /* Content width control */
        .content, .sqs-layout {
          max-width: 1920px;
          width: 100%;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        /* Mobile styles */
        @media screen and (max-width: 768px) {
          .content, .sqs-layout {
            padding: 0 15px;
          }
          
          /* Mobile navigation */
          .header-nav {
            display: none;
          }
          
          .mobile-nav-toggle {
            display: block;
          }
          
          /* Stack elements on mobile */
          .sqs-col-12 {
            width: 100% !important;
          }
          
          /* Adjust font sizes */
          h1 { font-size: 2em !important; }
          h2 { font-size: 1.5em !important; }
          h3 { font-size: 1.2em !important; }
          p { font-size: 1em !important; }
        }
        
        /* Tablet styles */
        @media screen and (min-width: 769px) and (max-width: 1024px) {
          .content, .sqs-layout {
            padding: 0 30px;
          }
        }
        
        /* Fix hero/banner responsiveness */
        .title-desc-wrapper {
          width: 100% !important;
          max-width: 100% !important;
        }
        
        /* Video responsiveness */
        .sqs-video-wrapper {
          position: relative;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          height: 0;
          overflow: hidden;
        }
        
        .sqs-video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        /* Parallax fix for mobile */
        @media screen and (max-width: 768px) {
          .parallax-scrolling {
            background-attachment: scroll !important;
          }
        }
        
        /* Remove horizontal scrollbar */
        .site-container {
          overflow-x: hidden;
        }
        
        /* Flexible grid system */
        .sqs-row {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -10px;
        }
        
        .sqs-col-12 {
          flex: 0 0 100%;
          max-width: 100%;
          padding: 0 10px;
        }
        
        .sqs-col-6 {
          flex: 0 0 50%;
          max-width: 50%;
          padding: 0 10px;
        }
        
        @media screen and (max-width: 768px) {
          .sqs-col-6 {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }
      </style>
    `;
    
    // Add responsive CSS before closing head tag
    $('head').append(responsiveCSS);
    console.log('  ✅ Added responsive CSS rules');
    
    // 4. Fix elements with fixed positioning that break on mobile
    $('*[style*="position: fixed"]').each((_, el) => {
      const $el = $(el);
      const style = $el.attr('style');
      if (style && !style.includes('header') && !style.includes('nav')) {
        // Convert fixed to absolute for non-header elements
        $el.attr('style', style.replace(/position:\s*fixed/g, 'position: absolute'));
      }
    });
    
    // Save updated HTML
    await fs.writeFile(filePath, $.html());
    console.log(`  ✅ ${file} updated with responsive fixes\n`);
  }
  
  console.log('✨ Responsive rendering fixes complete!');
  console.log('\nThe clone should now properly respond to different viewport sizes.');
  console.log('\nTo test:');
  console.log('  1. Open http://localhost:8080 in Chrome');
  console.log('  2. Open DevTools (F12)');
  console.log('  3. Toggle device toolbar (Ctrl+Shift+M)');
  console.log('  4. Test different device sizes');
}

// Run the fix
fixResponsiveRendering().catch(console.error);