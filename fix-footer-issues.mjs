import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixFooterIssues() {
  console.log('🔧 FIXING FOOTER ISSUES\n');
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
      
      console.log(`  📄 Fixing ${file}...`);
      
      let html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html, { decodeEntities: false });
      
      // 1. Remove "Stay Informed" email signup section
      // Look for various possible containers
      const emailSignupSelectors = [
        '.newsletter-block',
        '.newsletter-form',
        '.email-signup',
        '.stay-informed',
        'form[action*="newsletter"]',
        'form[action*="subscribe"]',
        '.sqs-block-newsletter',
        '[data-block-type="51"]', // Squarespace newsletter block type
        '.newsletter-form-wrapper'
      ];
      
      let removed = false;
      emailSignupSelectors.forEach(selector => {
        const element = $(selector);
        if (element.length > 0) {
          element.remove();
          removed = true;
        }
      });
      
      // Also search for "Stay Informed" text and remove parent container
      $('*:contains("Stay Informed")').each((i, el) => {
        const $el = $(el);
        const text = $el.text();
        if (text.includes('Stay Informed') && text.includes('email address')) {
          // Find the outermost container
          let container = $el;
          while (container.parent().length > 0 && !container.parent().is('body') && !container.parent().is('.site-wrapper')) {
            if (container.parent().hasClass('sqs-block') || 
                container.parent().hasClass('row') ||
                container.parent().hasClass('newsletter')) {
              container = container.parent();
            } else {
              break;
            }
          }
          container.remove();
          removed = true;
        }
      });
      
      if (removed) {
        console.log(`    ✅ Removed email signup section`);
      }
      
      // 2. Fix GitHub icon
      // Look for GitHub links with broken icons
      $('a[href*="github.com"]').each((i, el) => {
        const $link = $(el);
        const $img = $link.find('img');
        
        if ($img.length > 0) {
          // Check if image source is broken or missing
          const src = $img.attr('src');
          if (!src || src.includes('undefined') || src.includes('null')) {
            // Replace with GitHub SVG icon
            $link.html(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="color: white;">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            `);
            console.log(`    ✅ Fixed GitHub icon`);
          }
        }
      });
      
      // Also look for social icons that might be broken
      $('.social-icons a, .sqs-svg-icon--wrapper').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href');
        
        if (href && href.includes('github.com')) {
          const $img = $el.find('img');
          if ($img.length > 0 && (!$img.attr('src') || $img.attr('src').includes('undefined'))) {
            $el.html(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="color: white;">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            `);
          }
        }
      });
      
      // 3. Fix background image appearing at bottom
      // Add CSS to ensure footer has proper background
      let hasFooterFix = $('style#footer-fix').length > 0;
      if (!hasFooterFix) {
        $('head').append(`
          <style id="footer-fix">
            /* Fix footer background */
            footer {
              background-color: #1a1a1a !important;
              position: relative;
              z-index: 10;
            }
            
            /* Ensure no background images leak into footer */
            footer::before,
            footer::after {
              display: none !important;
            }
            
            /* Fix any parallax or background issues */
            .parallax-item:last-child {
              margin-bottom: 0 !important;
            }
            
            /* Ensure footer stays at bottom */
            .site-wrapper {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            .site-inner-wrapper {
              flex: 1;
            }
            
            /* Fix GitHub icon styling */
            .social-icons svg,
            .sqs-svg-icon--wrapper svg,
            a[href*="github.com"] svg {
              width: 24px;
              height: 24px;
              fill: white;
              transition: opacity 0.3s ease;
            }
            
            .social-icons a:hover svg,
            .sqs-svg-icon--wrapper:hover svg,
            a[href*="github.com"]:hover svg {
              opacity: 0.7;
            }
            
            /* Hide any stray background elements */
            body > .parallax-item:last-of-type {
              z-index: 1;
            }
            
            /* Ensure footer has higher z-index */
            footer,
            .Footer {
              z-index: 100;
              background: #1a1a1a !important;
              margin-top: 0 !important;
            }
          </style>
        `);
        console.log(`    ✅ Added footer background fixes`);
      }
      
      // Save the updated HTML
      await fs.writeFile(filePath, $.html());
    }
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('✅ FOOTER ISSUES FIXED!\n');
  console.log('Fixed:');
  console.log('  • Removed "Stay Informed" email signup section');
  console.log('  • Fixed GitHub icon (now using SVG)');
  console.log('  • Fixed background appearing at bottom');
  console.log('  • Added proper footer styling');
}

// Run the fix
fixFooterIssues().catch(console.error);