import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function comprehensiveFooterFix() {
  console.log('🔧 COMPREHENSIVE FOOTER FIX\n');
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
      
      // 1. REMOVE "Stay Informed" section completely
      // Look for any element containing "Stay Informed" text
      $('*').each((i, el) => {
        const $el = $(el);
        const text = $el.text();
        if (text.includes('Stay Informed') && text.includes('email')) {
          // Find the outermost container
          let container = $el;
          while (container.parent().length > 0 && 
                 !container.parent().is('body') && 
                 !container.parent().is('.site-wrapper')) {
            const parent = container.parent();
            if (parent.hasClass('page-section') || 
                parent.hasClass('sqs-layout') ||
                parent.hasClass('Index-page') ||
                parent.attr('id') === 'collection-58aadb94e6f2e14e390f0fb0' ||
                parent.find('form').length > 0) {
              container = parent;
            } else {
              break;
            }
          }
          container.remove();
        }
      });
      
      // Also remove by specific selectors
      $('.newsletter-block, .newsletter-form, #collection-58aadb94e6f2e14e390f0fb0').remove();
      $('form[action*="newsletter"], form[action*="subscribe"]').parent().remove();
      $('.sqs-block-newsletter').parent('.sqs-block').remove();
      
      // Remove any section that has a newsletter form
      $('.page-section:has(form[action*="newsletter"])').remove();
      $('.Index-page--has-image:has(.newsletter-form)').remove();
      
      // 2. Fix GitHub icon in footer - ensure it exists and is visible
      let hasGitHubIcon = false;
      
      // Look for existing GitHub links in footer
      $('footer a[href*="github.com"], .Footer a[href*="github.com"]').each((i, el) => {
        const $link = $(el);
        
        // Skip if it's a button
        if ($link.hasClass('sqs-block-button-element')) {
          return;
        }
        
        hasGitHubIcon = true;
        
        // Replace with clean GitHub icon
        $link.attr('class', 'github-footer-icon');
        $link.attr('aria-label', 'GitHub');
        $link.attr('target', '_blank');
        $link.attr('href', 'https://github.com/NellWatson/Bounder');
        
        $link.html(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="white">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>`);
      });
      
      // If no GitHub icon found in footer, add one to social icons list
      if (!hasGitHubIcon) {
        const $socialList = $('.sqs-svg-icon--list, .social-icons').first();
        if ($socialList.length > 0) {
          $socialList.append(`
            <a href="https://github.com/NellWatson/Bounder" target="_blank" class="github-footer-icon" aria-label="GitHub">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          `);
        }
      }
      
      // 3. Mark GitHub button container for spacing fix
      $('.sqs-block-button-container:has(a[href*="github.com"])').attr('data-github-button', 'true');
      
      // 4. Update CSS - comprehensive styles
      $('style#github-footer-fix, style#ultrathink-github-styles, style#footer-fix').remove();
      
      const existingStyle = $('style#comprehensive-footer-styles').length > 0;
      if (!existingStyle) {
        $('head').append(`
          <style id="comprehensive-footer-styles">
            /* Hide Stay Informed section completely */
            #collection-58aadb94e6f2e14e390f0fb0,
            .newsletter-block,
            .newsletter-form,
            .sqs-block-newsletter,
            form[action*="newsletter"],
            form[action*="subscribe"],
            .stay-informed,
            *:has(> form[action*="newsletter"]) {
              display: none !important;
            }
            
            /* GitHub footer icon - clean and visible */
            .github-footer-icon {
              display: inline-block !important;
              width: 40px !important;
              height: 40px !important;
              margin: 0 10px !important;
              padding: 0 !important;
              background: transparent !important;
              border: none !important;
              transition: opacity 0.3s ease, transform 0.2s ease !important;
              line-height: 0 !important;
              vertical-align: middle !important;
            }
            
            .github-footer-icon svg {
              width: 40px !important;
              height: 40px !important;
              fill: white !important;
              display: block !important;
            }
            
            .github-footer-icon:hover {
              opacity: 0.7 !important;
              transform: scale(1.1) !important;
            }
            
            /* Social icons list */
            .sqs-svg-icon--list,
            .social-icons {
              text-align: center !important;
              padding: 20px 0 !important;
              margin: 0 !important;
            }
            
            /* Reduce spacing after GitHub button */
            .sqs-block-button-container[data-github-button="true"] {
              margin-bottom: 60px !important;
            }
            
            /* Footer spacing */
            footer,
            .Footer,
            .footer-wrapper {
              margin-top: 0 !important;
              padding-top: 50px !important;
            }
            
            /* Ensure no extra gap */
            .page-section:last-of-type:not(footer),
            .Index-page:last-of-type:not(:has(footer)),
            .sqs-layout:last-of-type {
              padding-bottom: 80px !important;
            }
            
            /* Hide any duplicate GitHub icons */
            .sqs-svg-icon--wrapper.github-unauth {
              display: none !important;
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
              .github-footer-icon {
                width: 35px !important;
                height: 35px !important;
              }
              
              .github-footer-icon svg {
                width: 35px !important;
                height: 35px !important;
              }
              
              .sqs-block-button-container[data-github-button="true"] {
                margin-bottom: 40px !important;
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
  console.log('✅ COMPREHENSIVE FOOTER FIX COMPLETE!\n');
  console.log('Fixed:');
  console.log('  • Removed "Stay Informed" email signup section');
  console.log('  • GitHub icon now 40px and properly visible');
  console.log('  • Reduced whitespace between GitHub button and footer');
  console.log('  • Added hover effects and responsive sizing');
}

// Run the fix
comprehensiveFooterFix().catch(console.error);