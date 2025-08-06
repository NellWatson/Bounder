import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLONE_DIR = path.join(__dirname, 'bounder_enhanced');

async function fixHeaderPaths() {
  console.log('🔧 Fixing header assets paths in all HTML files...\n');
  
  // Get all HTML files
  const htmlFiles = await fs.readdir(CLONE_DIR);
  const htmlPages = htmlFiles.filter(f => f.endsWith('.html'));
  
  for (const file of htmlPages) {
    console.log(`📝 Processing ${file}...`);
    const filePath = path.join(CLONE_DIR, file);
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);
    
    // Fix favicon link
    let faviconLink = $('link[rel="icon"], link[rel="shortcut icon"]');
    if (faviconLink.length === 0) {
      // Add favicon link if missing
      $('head').append('<link rel="icon" type="image/x-icon" href="/favicon.ico">');
      console.log('  Added favicon link');
    } else {
      // Update existing favicon link
      faviconLink.attr('href', '/favicon.ico');
      console.log('  Updated favicon path');
    }
    
    // Fix logo image path
    const logoImg = $('.header-title-logo img, .logo img, img[alt*="BOUNDER"], img[alt*="Bounder"]');
    if (logoImg.length > 0) {
      // Check if logo src contains squarespace URL
      const currentSrc = logoImg.attr('src');
      if (currentSrc && currentSrc.includes('squarespace-cdn.com')) {
        logoImg.attr('src', '/assets/logo.png');
        console.log('  Updated logo path');
      }
    }
    
    // Fix navigation links to use correct paths
    $('header a, nav a, .header-nav a').each((_, el) => {
      const $link = $(el);
      const href = $link.attr('href');
      
      if (href) {
        // Convert absolute bounder.io URLs to relative paths
        if (href.includes('bounder.io')) {
          let newHref = href;
          
          if (href.includes('/contact')) {
            newHref = '/contact.html';
          } else if (href.includes('/privacy')) {
            newHref = '/privacy.html';
          } else if (href.includes('/new-page')) {
            newHref = '/terms.html';
          } else if (href.includes('/gallery-shift')) {
            newHref = '/gallery-shift.html';
          } else if (href.includes('/ride-to-live-shift')) {
            newHref = '/ride-to-live-shift.html';
          } else if (href === 'https://www.bounder.io/' || href === 'http://www.bounder.io/') {
            newHref = '/index.html';
          }
          
          if (newHref !== href) {
            $link.attr('href', newHref);
            console.log(`  Fixed nav link: ${href} -> ${newHref}`);
          }
        }
      }
    });
    
    // Ensure all internal links work correctly
    $('a[href]').each((_, el) => {
      const $link = $(el);
      const href = $link.attr('href');
      
      if (href && href.includes('bounder.io') && !href.includes('#')) {
        // This is an internal link
        let newHref = href;
        
        if (href.endsWith('/')) {
          newHref = '/index.html';
        } else if (!href.includes('.html')) {
          const pageName = href.split('/').pop();
          if (pageName === 'contact') newHref = '/contact.html';
          else if (pageName === 'privacy') newHref = '/privacy.html';
          else if (pageName === 'new-page') newHref = '/terms.html';
          else if (pageName === 'gallery-shift') newHref = '/gallery-shift.html';
          else if (pageName === 'ride-to-live-shift') newHref = '/ride-to-live-shift.html';
        }
        
        if (newHref !== href) {
          $link.attr('href', newHref);
        }
      }
    });
    
    // Save updated HTML
    await fs.writeFile(filePath, $.html());
    console.log(`  ✅ ${file} updated\n`);
  }
  
  console.log('🎯 All header paths fixed!');
  console.log('\nTo test:');
  console.log('  cd bounder_enhanced');
  console.log('  python3 -m http.server 8080');
  console.log('  open http://localhost:8080');
}

// Run the fix
fixHeaderPaths().catch(console.error);