import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixApiAndGitHub() {
  console.log('🔧 FIXING API BUTTON AND GITHUB ICON\n');
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
      
      let changes = [];
      
      // 1. Remove API button from main page
      if (file === 'index.html' || file === '404.html') {
        // Look for API button
        const apiButtonSelectors = [
          'a[href*="api"]',
          '.sqs-block-button-element:contains("API")',
          'a:contains("API")',
          '.button:contains("API")',
          'button:contains("API")'
        ];
        
        apiButtonSelectors.forEach(selector => {
          $(selector).each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            
            // Only remove if it's specifically an API button
            if (text === 'API' || text === 'API Documentation' || text === 'Developer API') {
              // Check if it's part of a button container
              const $container = $el.closest('.sqs-block-button-container, .button-block, .sqs-block');
              if ($container.length > 0) {
                $container.remove();
                changes.push('Removed API button block');
              } else {
                $el.remove();
                changes.push('Removed API button');
              }
            }
          });
        });
      }
      
      // 2. Fix GitHub icon - Replace ALL GitHub links with proper implementation
      $('a[href*="github.com"]').each((i, el) => {
        const $link = $(el);
        const href = $link.attr('href');
        
        // Check if this is in the footer or main content
        const isInFooter = $link.closest('footer, .Footer, .footer-wrapper').length > 0;
        
        if (isInFooter || $link.hasClass('sqs-block-button-element')) {
          // This is the GitHub button/link we need to fix
          const linkText = $link.text().trim();
          
          // Create a properly styled GitHub button/link
          if ($link.hasClass('sqs-block-button-element')) {
            // It's a button - preserve button styling but add icon
            $link.html(`
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 8px;">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span style="vertical-align: middle;">GitHub</span>
            `);
            changes.push('Fixed GitHub button with icon');
          } else {
            // It's a simple link in footer - replace with icon
            $link.html(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            `);
            $link.attr('title', 'GitHub');
            $link.attr('aria-label', 'GitHub');
            changes.push('Fixed GitHub footer icon');
          }
        }
      });
      
      // 3. Also check for social icon wrappers that might have GitHub
      $('.sqs-svg-icon--wrapper, .social-icons a, .social-icon').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href');
        
        if (href && href.includes('github.com')) {
          // Replace content with GitHub SVG
          $el.html(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          `);
          $el.attr('title', 'GitHub');
          $el.attr('aria-label', 'GitHub');
          changes.push('Fixed social GitHub icon');
        }
      });
      
      // 4. Add/update CSS for GitHub icons
      let hasGitHubStyles = $('style#github-icon-styles').length > 0;
      if (!hasGitHubStyles && changes.length > 0) {
        $('head').append(`
          <style id="github-icon-styles">
            /* GitHub icon styles */
            a[href*="github.com"] svg {
              display: inline-block;
              width: 24px;
              height: 24px;
              fill: currentColor;
              vertical-align: middle;
              transition: opacity 0.3s ease, transform 0.2s ease;
            }
            
            /* Footer GitHub icon */
            footer a[href*="github.com"] svg,
            .Footer a[href*="github.com"] svg {
              fill: white;
            }
            
            /* Button GitHub icon */
            .sqs-block-button-element svg {
              display: inline-block;
              vertical-align: middle;
              margin-right: 8px;
            }
            
            /* Hover effects */
            a[href*="github.com"]:hover svg {
              opacity: 0.8;
              transform: scale(1.1);
            }
            
            /* Social icon wrapper fixes */
            .sqs-svg-icon--wrapper svg,
            .social-icons svg {
              width: 24px !important;
              height: 24px !important;
              fill: white !important;
            }
            
            /* Hide any broken image placeholders */
            a[href*="github.com"] img[src=""],
            a[href*="github.com"] img:not([src]),
            a[href*="github.com"] .broken-icon {
              display: none !important;
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
  
  console.log('\n' + '=' .repeat(70));
  console.log('✅ FIXES COMPLETE!\n');
  console.log('Fixed:');
  console.log('  • Removed API button from main pages');
  console.log('  • Fixed GitHub icon (now using inline SVG)');
  console.log('  • Added proper styling for all GitHub icons');
  console.log('  • Icons now visible in both footer and buttons');
}

// Run the fix
fixApiAndGitHub().catch(console.error);