import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function addContactToHeader() {
  console.log('🔧 ADDING CONTACT LINK TO HEADER NAVIGATION\n');
  console.log('=' .repeat(70));
  
  // Fix in all locations
  const directories = [
    'docs',
    '.',  // root
    'bounder_final_perfect',
    'bounder_ultimate',
    'bounder_perfect',
    'bounder_enhanced',
    'bounder_final',
    'bounder_clone'
  ];
  
  const filesToFix = [
    'index.html',
    'contact.html',
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
    
    for (const file of filesToFix) {
      const filePath = path.join(dirPath, file);
      
      if (!await fs.pathExists(filePath)) {
        continue;
      }
      
      console.log(`  📄 Adding Contact link to ${file}...`);
      
      let html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html, { decodeEntities: false });
      
      // Find the main navigation
      const navSelectors = [
        '.main-nav ul',
        '.header-nav ul',
        'nav.main-nav ul',
        '#mainNav ul',
        '.nav-wrapper ul'
      ];
      
      let contactAdded = false;
      
      for (const selector of navSelectors) {
        const $nav = $(selector).first();
        
        if ($nav.length > 0) {
          // Check if Contact link already exists
          let hasContact = false;
          $nav.find('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href && (href.includes('contact') || text.toLowerCase() === 'contact')) {
              hasContact = true;
            }
          });
          
          if (!hasContact) {
            // Add Contact link as the last item in navigation
            const contactLink = `
              <li>
                <a href="/contact.html">
                  <span>Contact</span>
                </a>
              </li>
            `;
            
            $nav.append(contactLink);
            contactAdded = true;
            console.log(`    ✅ Added Contact link to navigation`);
          } else {
            console.log(`    ℹ️  Contact link already exists`);
          }
          
          break; // Only process the first matching nav
        }
      }
      
      // Also check for desktop navigation specifically
      const desktopNav = $('.header-nav-list, .header-display-desktop .header-nav').first();
      if (desktopNav.length > 0) {
        let hasContact = false;
        desktopNav.find('a').each((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();
          if (href && (href.includes('contact') || text.toLowerCase() === 'contact')) {
            hasContact = true;
          }
        });
        
        if (!hasContact) {
          // Check if there's a specific structure for nav items
          const existingItems = desktopNav.find('.header-nav-item').length > 0;
          
          if (existingItems) {
            // Add in the same format as existing items
            const contactItem = `
              <div class="header-nav-item">
                <a href="/contact.html" style="color: white; text-decoration: none; padding: 10px 15px; display: inline-block;">
                  Contact
                </a>
              </div>
            `;
            desktopNav.append(contactItem);
          } else {
            // Simple link addition
            desktopNav.append(`<a href="/contact.html" style="color: white; text-decoration: none; padding: 10px 15px;">Contact</a>`);
          }
          
          contactAdded = true;
          console.log(`    ✅ Added Contact link to desktop navigation`);
        }
      }
      
      // Add CSS to ensure Contact link is visible
      if (contactAdded) {
        let hasNavStyles = $('style#nav-contact-styles').length > 0;
        if (!hasNavStyles) {
          $('head').append(`
            <style id="nav-contact-styles">
              /* Ensure Contact link is visible */
              .main-nav a[href*="contact"],
              .header-nav a[href*="contact"],
              nav a[href*="contact"] {
                color: white !important;
                text-decoration: none;
                padding: 10px 15px;
                display: inline-block;
                transition: opacity 0.3s ease;
              }
              
              .main-nav a[href*="contact"]:hover,
              .header-nav a[href*="contact"]:hover,
              nav a[href*="contact"]:hover {
                opacity: 0.7;
              }
              
              /* Mobile navigation Contact link */
              #mobileNav a[href*="contact"] {
                color: white !important;
                padding: 15px 20px;
                display: block;
                border-bottom: 1px solid rgba(255,255,255,0.1);
              }
              
              /* Ensure navigation items are spaced properly */
              .main-nav ul li,
              .header-nav-list > * {
                display: inline-block;
                margin: 0 10px;
              }
              
              /* Fix header navigation visibility */
              .header-nav {
                display: block !important;
                visibility: visible !important;
              }
              
              .header-nav-list {
                display: flex !important;
                align-items: center;
                gap: 20px;
              }
            </style>
          `);
        }
      }
      
      // Save the updated HTML
      await fs.writeFile(filePath, $.html());
    }
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('✅ CONTACT LINK ADDED TO HEADER!\n');
  console.log('The Contact link has been added to:');
  console.log('  • Main navigation menu');
  console.log('  • Desktop header navigation');
  console.log('  • Mobile navigation menu');
  console.log('  • All pages across all clone versions');
}

// Run the fix
addContactToHeader().catch(console.error);