#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 Fixing footer spacing and header contact links...');

const htmlFiles = [
  'index.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  'gallery-shift.html',
  'ride-to-live-shift.html'
];

htmlFiles.forEach(file => {
  const filePath = join(process.cwd(), file);
  
  try {
    let content = readFileSync(filePath, 'utf-8');
    
    // Fix 1: Remove excessive margin from GitHub button container
    content = content.replace(
      /\.sqs-block-button-container\[data-github-button="true"\]\s*{\s*margin-bottom:\s*\d+px\s*!important;\s*}/gi,
      '.sqs-block-button-container[data-github-button="true"] { margin-bottom: 60px !important; }'
    );
    
    // Fix 2: Add styles to reduce the massive gap
    const footerStylePattern = /<style[^>]*>[\s\S]*?\.github-footer-icon[\s\S]*?<\/style>/gi;
    
    if (!content.includes('/* Fix enormous gap above footer */')) {
      // Find the closing </head> tag and add our fix before it
      content = content.replace(/<\/head>/i, `
  <style>
    /* Fix enormous gap above footer */
    .site-inner-wrapper > div:last-of-type {
      padding-bottom: 60px !important;
    }
    
    /* Reduce excessive spacing in content area */
    .sqs-block {
      padding-top: 17px !important;
      padding-bottom: 17px !important;
    }
    
    /* Specific fix for GitHub button area */
    .sqs-block-button-container[data-github-button="true"] {
      margin-bottom: 60px !important;
    }
    
    /* Remove any huge min-height or height values */
    .site-inner-wrapper,
    .site-wrapper {
      min-height: auto !important;
      height: auto !important;
    }
    
    /* Ensure footer sits properly */
    #footer,
    footer {
      margin-top: 0 !important;
      padding-top: 50px !important;
    }
  </style>
</head>`);
    }
    
    // Fix 3: Correct the header contact link URL
    // For non-contact pages, link should go to /contact or contact.html
    if (!file.includes('contact')) {
      // Fix relative links to contact page
      content = content.replace(
        /<a href="\/contact">CONTACT<\/a>/gi,
        '<a href="contact.html">CONTACT</a>'
      );
      
      // Also fix any header nav links
      content = content.replace(
        /(<nav class="header-nav"[^>]*>[\s]*)<a href="\/contact">/gi,
        '$1<a href="contact.html">'
      );
    } else {
      // On contact page itself, link to home
      content = content.replace(
        /<a href="\/contact">CONTACT<\/a>/gi,
        '<a href="index.html">HOME</a>'
      );
      
      content = content.replace(
        /(<nav class="header-nav"[^>]*>[\s]*)<a href="contact\.html">/gi,
        '$1<a href="index.html">'
      );
    }
    
    // Fix 4: Remove any inline height styles causing issues
    content = content.replace(/height:\s*\d+px\s*!important;/gi, (match) => {
      // Only remove if it's a very large height (over 2000px)
      const heightMatch = match.match(/\d+/);
      if (heightMatch && parseInt(heightMatch[0]) > 2000) {
        return 'height: auto !important;';
      }
      return match;
    });
    
    // Fix 5: Clean up excessive block-size styles
    content = content.replace(/block-size:\s*\d+px\s*!important;/gi, (match) => {
      const sizeMatch = match.match(/\d+/);
      if (sizeMatch && parseInt(sizeMatch[0]) > 2000) {
        return 'block-size: auto !important;';
      }
      return match;
    });
    
    writeFileSync(filePath, content);
    console.log(`  ✅ Fixed ${file}`);
    
  } catch (error) {
    console.log(`  ⚠️  Error: ${error.message}`);
  }
});

console.log('\n✨ Footer spacing and contact links fixed!');
console.log('📌 GitHub button spacing reduced to 60px');
console.log('📌 Contact links now point to correct pages');