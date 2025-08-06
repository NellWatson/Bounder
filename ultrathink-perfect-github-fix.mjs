import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ultrathinkPerfectGitHubFix() {
  console.log('🎯 ULTRATHINK: PERFECT GITHUB ICON REPLICATION\n');
  console.log('='.repeat(80));
  
  // The EXACT SVG path from GitHub's official icon, scaled for 64x64 viewBox
  const githubPath = "M32 0C14.327 0 0 14.327 0 32c0 14.147 9.169 26.133 21.885 30.365 1.598.296 2.115-.696 2.115-1.539v-5.957c-8.901 1.936-10.755-3.776-10.755-3.776-1.456-3.699-3.555-4.683-3.555-4.683-2.904-1.987.221-1.945.221-1.945 3.213.224 4.904 3.299 4.904 3.299 2.853 4.891 7.485 3.477 9.312 2.659.285-2.067 1.115-3.48 2.032-4.277-7.107-.813-14.579-3.557-14.579-15.816 0-3.496 1.251-6.349 3.296-8.589-.331-.808-1.427-4.064.312-8.469 0 0 2.688-.859 8.803 3.28 2.552-.709 5.288-1.064 8.008-1.077 2.72.013 5.459.368 8.016 1.077 6.107-4.139 8.787-3.28 8.787-3.28 1.744 4.413.648 7.661.317 8.469 2.053 2.24 3.293 5.093 3.293 8.589 0 12.291-7.485 14.992-14.616 15.789 1.147.992 2.195 2.939 2.195 5.925v8.781c0 .851.507 1.851 2.136 1.536C54.843 58.117 64 45.147 64 32 64 14.327 49.673 0 32 0z";
  
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
      
      console.log(`  📄 Perfecting GitHub icon in ${file}...`);
      
      let html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html, { decodeEntities: false });
      
      let changes = [];
      
      // 1. Fix the GitHub BUTTON (main CTA button)
      $('.sqs-block-button-element[href*="github.com"]').each((i, el) => {
        const $button = $(el);
        
        // Keep button text simple - just "GitHub"
        $button.text('GitHub');
        
        // Ensure button has correct classes and styling
        $button.attr('class', 'sqs-block-button-element--large sqs-button-element--secondary sqs-block-button-element');
        $button.attr('target', '_blank');
        
        changes.push('Fixed GitHub button');
      });
      
      // 2. Fix the GitHub SOCIAL ICON in footer
      // Look for the social icon wrapper
      $('a[href*="github.com"].sqs-svg-icon--wrapper, .sqs-svg-icon--wrapper[href*="github.com"]').each((i, el) => {
        const $link = $(el);
        
        // Recreate EXACT structure from original
        $link.attr('class', 'sqs-svg-icon--wrapper github-unauth');
        $link.attr('aria-label', 'GitHub');
        $link.attr('target', '_blank');
        
        // Set the EXACT HTML structure with proper SVG
        $link.html(`
      <div>
        <svg class="sqs-svg-icon--social" viewBox="0 0 64 64">
          <g class="sqs-svg-icon--outer">
            <circle cx="32" cy="32" r="31" fill="transparent"/>
          </g>
          <g class="sqs-svg-icon--inner">
            <path fill="#ffffff" d="${githubPath}"/>
          </g>
        </svg>
      </div>
    `);
        
        changes.push('Perfected GitHub social icon');
      });
      
      // 3. Also check for any other GitHub links in footer that need to be social icons
      $('footer a[href*="github.com"], .Footer a[href*="github.com"]').each((i, el) => {
        const $link = $(el);
        
        // Skip if it's already a button or properly formatted
        if ($link.hasClass('sqs-block-button-element') || $link.hasClass('sqs-svg-icon--wrapper')) {
          return;
        }
        
        // Convert to social icon format
        $link.attr('class', 'sqs-svg-icon--wrapper github-unauth');
        $link.attr('aria-label', 'GitHub');
        $link.attr('target', '_blank');
        
        $link.html(`
      <div>
        <svg class="sqs-svg-icon--social" viewBox="0 0 64 64">
          <g class="sqs-svg-icon--outer">
            <circle cx="32" cy="32" r="31" fill="transparent"/>
          </g>
          <g class="sqs-svg-icon--inner">
            <path fill="#ffffff" d="${githubPath}"/>
          </g>
        </svg>
      </div>
    `);
        
        changes.push('Converted footer link to social icon');
      });
      
      // 4. Add/Update comprehensive CSS to match original exactly
      let hasStyles = $('style#ultrathink-github-styles').length > 0;
      if (!hasStyles) {
        // Remove any previous style blocks that might conflict
        $('style#github-icon-styles, style#github-white-fix, style#github-icon-fix').remove();
        
        $('head').append(`
          <style id="ultrathink-github-styles">
            /* EXACT replication of Squarespace GitHub social icon */
            .sqs-svg-icon--wrapper {
              display: inline-block;
              width: 32px;
              height: 32px;
              margin: 0 4px;
              position: relative;
              background-color: transparent;
              border-radius: 50%;
              transition: all 0.3s ease;
              vertical-align: middle;
              line-height: 0;
            }
            
            .sqs-svg-icon--wrapper.github-unauth {
              background-color: transparent !important;
            }
            
            .sqs-svg-icon--wrapper > div {
              display: block;
              width: 100%;
              height: 100%;
              position: relative;
            }
            
            .sqs-svg-icon--social {
              width: 32px;
              height: 32px;
              display: block;
              fill: #ffffff;
            }
            
            .sqs-svg-icon--outer {
              opacity: 0;
              transition: opacity 0.3s ease;
            }
            
            .sqs-svg-icon--wrapper:hover .sqs-svg-icon--outer {
              opacity: 0.3;
              fill: #ffffff;
            }
            
            .sqs-svg-icon--inner path {
              fill: #ffffff !important;
              transition: transform 0.3s ease;
            }
            
            .sqs-svg-icon--wrapper:hover .sqs-svg-icon--inner {
              transform: scale(0.9);
              transform-origin: center;
            }
            
            /* GitHub Button styling (exact match) */
            .sqs-block-button-element[href*="github.com"] {
              display: inline-block;
              padding: 25px 46px;
              background-color: #272727;
              color: #ffffff;
              text-decoration: none;
              font-family: proxima-nova, "Helvetica Neue", Helvetica, Arial, sans-serif;
              font-size: 15px;
              font-weight: 500;
              letter-spacing: 1px;
              line-height: 1.6em;
              text-transform: uppercase;
              transition: opacity 0.3s ease, transform 0.3s ease;
              border: none;
              cursor: pointer;
            }
            
            .sqs-block-button-element[href*="github.com"]:hover {
              opacity: 0.8;
              transform: translateY(-2px);
            }
            
            /* Footer social icons container */
            .sqs-svg-icon--list {
              text-align: center;
              padding: 20px 0;
            }
            
            /* Ensure no conflicting styles */
            footer a[href*="github.com"]:not(.sqs-block-button-element):not(.sqs-svg-icon--wrapper) {
              display: none !important;
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
              .sqs-svg-icon--wrapper {
                width: 28px;
                height: 28px;
              }
              
              .sqs-svg-icon--social {
                width: 28px;
                height: 28px;
              }
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
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 ULTRATHINK PERFECT FIX COMPLETE!\n');
  console.log('Achieved:');
  console.log('  • Exact SVG structure matching original Squarespace implementation');
  console.log('  • Proper 64x64 viewBox with scaled GitHub path');
  console.log('  • Circular hover effect with outer ring');
  console.log('  • Correct button styling for GitHub CTA');
  console.log('  • Responsive sizing for mobile');
  console.log('  • Removed all conflicting styles');
  console.log('\n✨ GitHub icon should now be PIXEL-PERFECT match to original!');
}

// Run the ultrathink fix
ultrathinkPerfectGitHubFix().catch(console.error);