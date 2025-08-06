import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureContactLink() {
  console.log('🔗 ENSURING CONTACT LINK IN HEADER NAVIGATION\n');
  console.log('='.repeat(80));
  
  const directories = [
    'docs',
    '.',
    'bounder_final_perfect',
    'bounder_ultimate',
    'bounder_perfect',
    'bounder_enhanced',
    'bounder_final',
    'bounder_clone'
  ];
  
  const filesToUpdate = [
    'index.html',
    'privacy.html',
    'terms.html',
    'gallery-shift.html',
    'ride-to-live-shift.html',
    '404.html'
  ];
  
  for (const dir of directories) {
    const dirPath = path.join(__dirname, dir);
    
    if (!await fs.pathExists(dirPath)) {
      console.log(`⚠️  Directory ${dir} not found, skipping...`);
      continue;
    }
    
    console.log(`\n📁 Processing ${dir}/`);
    
    for (const file of filesToUpdate) {
      const filePath = path.join(dirPath, file);
      
      if (!await fs.pathExists(filePath)) {
        continue;
      }
      
      console.log(`  📄 Checking ${file}...`);
      
      let html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html, { decodeEntities: false });
      
      let modified = false;
      
      // Find header navigation
      const navSelectors = [
        'header nav ul',
        '.header-nav ul',
        '.main-nav ul',
        'nav.main-nav ul',
        '#mainNav ul',
        '.header-nav-list',
        '.header-display-desktop .header-nav'
      ];
      
      for (const selector of navSelectors) {
        const $nav = $(selector).first();
        
        if ($nav.length > 0) {
          // Check if Contact link already exists
          let hasContact = false;
          $nav.find('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (text.toLowerCase() === 'contact' || (href && href.includes('contact'))) {
              hasContact = true;
            }
          });
          
          if (!hasContact) {
            // Find the best position to add Contact link (usually first)
            const contactHTML = `
              <li class="header-nav-item">
                <a href="/contact.html" style="color: white; text-decoration: none;">
                  <span>Contact</span>
                </a>
              </li>
            `;
            
            // Add as first item in navigation
            $nav.prepend(contactHTML);
            modified = true;
            console.log(`    ✅ Added Contact link to navigation`);
          } else {
            // Ensure Contact link is first and properly styled
            const $contactLink = $nav.find('a:contains("Contact")').first();
            if ($contactLink.length > 0) {
              const $contactItem = $contactLink.closest('li');
              
              // Move to first position if not already
              const $firstItem = $nav.children().first();
              if (!$firstItem.find('a:contains("Contact")').length) {
                $contactItem.prependTo($nav);
                modified = true;
                console.log(`    ✅ Moved Contact link to first position`);
              }
              
              // Ensure proper href
              if (!$contactLink.attr('href').includes('contact')) {
                $contactLink.attr('href', '/contact.html');
                modified = true;
                console.log(`    ✅ Fixed Contact link href`);
              }
            }
          }
          
          break; // Only process first matching nav
        }
      }
      
      // Also ensure mobile navigation has Contact link
      const mobileNavSelectors = [
        '#mobileNav ul',
        '.mobile-nav ul',
        '.header-menu-nav ul'
      ];
      
      for (const selector of mobileNavSelectors) {
        const $mobileNav = $(selector).first();
        
        if ($mobileNav.length > 0) {
          let hasContact = false;
          $mobileNav.find('a').each((i, el) => {
            const text = $(el).text().trim();
            if (text.toLowerCase() === 'contact') {
              hasContact = true;
            }
          });
          
          if (!hasContact) {
            const mobileContactHTML = `
              <li>
                <a href="/contact.html" style="color: white; text-decoration: none; display: block; padding: 15px 20px;">
                  Contact
                </a>
              </li>
            `;
            
            $mobileNav.prepend(mobileContactHTML);
            modified = true;
            console.log(`    ✅ Added Contact link to mobile navigation`);
          }
        }
      }
      
      // Ensure proper navigation styling exists
      if (modified || !$('style#nav-contact-styles').length) {
        // Remove old style blocks that might conflict
        $('style#nav-contact-styles').remove();
        
        $('head').append(`
          <style id="nav-contact-styles">
            /* Ensure Contact link is visible and properly styled */
            header a[href*="contact"],
            nav a[href*="contact"],
            .header-nav a[href*="contact"],
            .main-nav a[href*="contact"] {
              color: white !important;
              text-decoration: none;
              padding: 10px 15px;
              display: inline-block;
              transition: opacity 0.3s ease;
              text-transform: uppercase;
              font-size: 14px;
              font-weight: 500;
              letter-spacing: 1px;
            }
            
            header a[href*="contact"]:hover,
            nav a[href*="contact"]:hover {
              opacity: 0.7;
            }
            
            /* Ensure navigation items are properly spaced */
            .header-nav ul,
            .main-nav ul {
              display: flex;
              align-items: center;
              gap: 20px;
              list-style: none;
              margin: 0;
              padding: 0;
            }
            
            .header-nav-item {
              display: inline-block;
            }
            
            /* Mobile navigation Contact link */
            #mobileNav a[href*="contact"],
            .mobile-nav a[href*="contact"] {
              color: white !important;
              padding: 15px 20px;
              display: block;
              border-bottom: 1px solid rgba(255,255,255,0.1);
            }
          </style>
        `);
      }
      
      if (modified) {
        await fs.writeFile(filePath, $.html());
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ CONTACT LINK ENSURED IN ALL HEADERS!\n');
  console.log('Completed:');
  console.log('  • Contact link added/verified in main navigation');
  console.log('  • Contact link positioned first in nav menu');
  console.log('  • Mobile navigation updated');
  console.log('  • Proper styling applied');
}

// Run the function
ensureContactLink().catch(console.error);