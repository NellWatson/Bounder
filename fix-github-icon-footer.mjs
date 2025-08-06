import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixGitHubIconAndSpacing() {
  console.log('🔧 FIXING GITHUB ICON SIZE AND FOOTER SPACING\n');
  console.log('='.repeat(80));
  
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
      
      // Fix the GitHub social icon in footer - make it bigger and cleaner
      $('.sqs-svg-icon--wrapper.github-unauth').each((i, el) => {
        const $link = $(el);
        
        // Replace with a simpler, larger GitHub icon
        $link.attr('class', 'github-footer-icon');
        $link.attr('aria-label', 'GitHub');
        $link.attr('target', '_blank');
        
        // Use a clean, simple GitHub SVG at proper size
        $link.html(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="white">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        `);
      });
      
      // Also fix any other GitHub links in footer
      $('footer a[href*="github.com"]:not(.sqs-block-button-element):not(.github-footer-icon)').each((i, el) => {
        const $link = $(el);
        
        $link.attr('class', 'github-footer-icon');
        $link.attr('aria-label', 'GitHub');
        $link.attr('target', '_blank');
        
        $link.html(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="white">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        `);
      });
      
      // Fix spacing - reduce gap between GitHub button and footer
      const $buttonContainer = $('.sqs-block-button-container:has(a[href*="github.com"])');
      if ($buttonContainer.length > 0) {
        // Add data attribute to identify this container
        $buttonContainer.attr('data-github-button', 'true');
      }
      
      // Update/add CSS
      let hasStyles = $('style#github-footer-fix').length > 0;
      if (!hasStyles) {
        // Remove old conflicting styles
        $('style#ultrathink-github-styles, style#github-icon-styles, style#github-white-fix').remove();
        
        $('head').append(`
          <style id="github-footer-fix">
            /* GitHub footer icon - bigger and cleaner */
            .github-footer-icon {
              display: inline-block;
              width: 40px;
              height: 40px;
              margin: 0 8px;
              padding: 0;
              background: transparent;
              border: none;
              transition: opacity 0.3s ease, transform 0.2s ease;
              line-height: 0;
              vertical-align: middle;
            }
            
            .github-footer-icon svg {
              width: 40px !important;
              height: 40px !important;
              fill: white !important;
              display: block;
            }
            
            .github-footer-icon:hover {
              opacity: 0.7;
              transform: scale(1.1);
            }
            
            /* Social icons container */
            .sqs-svg-icon--list {
              text-align: center;
              padding: 20px 0;
              margin: 0;
            }
            
            /* Reduce spacing after GitHub button */
            .sqs-block-button-container[data-github-button="true"] {
              margin-bottom: 40px !important; /* Reduced from default */
            }
            
            /* Reduce padding before footer */
            footer,
            .Footer,
            .footer-wrapper {
              margin-top: 0 !important;
              padding-top: 40px !important; /* Reduced padding */
            }
            
            /* Ensure proper spacing for sections before footer */
            .page-section:last-of-type,
            .Index-page:last-of-type,
            .sqs-layout:last-of-type {
              padding-bottom: 60px !important; /* Reduced from default */
            }
            
            /* Fix any extra spacing from parent containers */
            .sqs-block-button-container[data-github-button="true"] + * {
              margin-top: 0 !important;
            }
            
            /* Hide duplicate or broken icons */
            .sqs-svg-icon--wrapper.github-unauth {
              display: none !important;
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
              .github-footer-icon {
                width: 35px;
                height: 35px;
              }
              
              .github-footer-icon svg {
                width: 35px !important;
                height: 35px !important;
              }
              
              .sqs-block-button-container[data-github-button="true"] {
                margin-bottom: 30px !important;
              }
            }
          </style>
        `);
      }
      
      // Save the updated HTML
      await fs.writeFile(filePath, $.html());
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ GITHUB ICON AND SPACING FIXED!\n');
  console.log('Fixed:');
  console.log('  • GitHub icon now 40px (larger and cleaner)');
  console.log('  • Removed ugly small icon appearance');
  console.log('  • Reduced whitespace between GitHub button and footer');
  console.log('  • Added proper hover effects');
}

// Run the fix
fixGitHubIconAndSpacing().catch(console.error);