import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixGitHubIconColor() {
  console.log('🔧 FIXING GITHUB ICON COLOR (BLACK CIRCLE ISSUE)\n');
  console.log('='.repeat(70));
  
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
      
      console.log(`  📄 Fixing GitHub icon in ${file}...`);
      
      let html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html, { decodeEntities: false });
      
      let changes = [];
      
      // Find ALL GitHub links and ensure they have white SVG icons
      $('a[href*="github.com"]').each((i, el) => {
        const $link = $(el);
        
        // Check if it's in footer or social icons area
        const isInFooter = $link.closest('footer, .Footer, .footer-wrapper, .social-icons').length > 0;
        
        if (isInFooter) {
          // Replace entire link content with properly styled white SVG
          $link.html(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" style="display: block;">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          `);
          $link.attr('title', 'GitHub');
          $link.attr('aria-label', 'GitHub');
          $link.css({
            'display': 'inline-block',
            'line-height': '0'
          });
          changes.push('Fixed GitHub footer icon color');
        }
      });
      
      // Also fix any social icon wrappers
      $('.sqs-svg-icon--wrapper, .social-icon').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href') || $el.parent().attr('href');
        
        if (href && href.includes('github.com')) {
          // Replace with white SVG
          $el.html(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" style="display: block;">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          `);
          changes.push('Fixed social GitHub icon color');
        }
      });
      
      // Update/add CSS to ensure GitHub icons stay white
      let hasStyles = $('style#github-white-fix').length > 0;
      if (!hasStyles && changes.length > 0) {
        $('head').append(`
          <style id="github-white-fix">
            /* Force GitHub icons to be white in footer */
            footer a[href*="github.com"] svg,
            .Footer a[href*="github.com"] svg,
            .social-icons a[href*="github.com"] svg,
            .sqs-svg-icon--wrapper svg {
              fill: #ffffff !important;
              color: #ffffff !important;
              width: 24px !important;
              height: 24px !important;
              display: block !important;
            }
            
            /* Remove any background circles */
            footer a[href*="github.com"],
            .Footer a[href*="github.com"],
            .social-icons a[href*="github.com"] {
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
              width: auto !important;
              height: auto !important;
              border-radius: 0 !important;
              display: inline-block !important;
              line-height: 0 !important;
            }
            
            /* Hover effect */
            footer a[href*="github.com"]:hover svg,
            .Footer a[href*="github.com"]:hover svg,
            .social-icons a[href*="github.com"]:hover svg {
              opacity: 0.7 !important;
              fill: #ffffff !important;
            }
            
            /* Hide any broken images or placeholders */
            footer a[href*="github.com"] img,
            .Footer a[href*="github.com"] img,
            .social-icons a[href*="github.com"] img,
            a[href*="github.com"] .broken-icon,
            a[href*="github.com"] .placeholder {
              display: none !important;
            }
            
            /* Ensure no black circles appear */
            .sqs-svg-icon--wrapper::before,
            .sqs-svg-icon--wrapper::after,
            footer a[href*="github.com"]::before,
            footer a[href*="github.com"]::after {
              display: none !important;
              background: none !important;
            }
          </style>
        `);
      }
      
      if (changes.length > 0) {
        console.log(`    ✅ ${changes.join(', ')}`);
      }
      
      // Save the updated HTML
      await fs.writeFile(filePath, $.html());
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ GITHUB ICON COLOR FIXED!\n');
  console.log('Fixed:');
  console.log('  • GitHub icon now displays as white SVG');
  console.log('  • Removed black circle background');
  console.log('  • Added proper hover effects');
  console.log('  • Applied fix to all pages and directories');
}

// Run the fix
fixGitHubIconColor().catch(console.error);