#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 Fixing contact link visibility in header...');

// List of HTML files to process
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
    
    // Find and fix the contact link in the header
    // Look for the contact link with visibility: hidden
    const contactLinkPattern = /<a\s+href="\/contact"[^>]*visibility:\s*hidden\s*!important[^>]*>/gi;
    
    if (contactLinkPattern.test(content)) {
      console.log(`  ✓ Found hidden contact link in ${file}`);
      
      // Replace the entire style attribute with a clean, minimal one
      content = content.replace(
        /<a\s+href="\/contact"[^>]*style="[^"]*visibility:\s*hidden\s*!important[^"]*"[^>]*>/gi,
        '<a href="/contact" style="color: #fff; text-decoration: none; font-family: futura-pt, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; display: inline-block; padding: 0 20px;">'
      );
      
      // Also fix the span inside if it exists
      content = content.replace(
        /<span[^>]*style="[^"]*visibility:\s*hidden\s*!important[^"]*"[^>]*>Contact<\/span>/gi,
        '<span style="color: #fff;">Contact</span>'
      );
      
      writeFileSync(filePath, content);
      console.log(`  ✅ Fixed contact link visibility in ${file}`);
    } else {
      console.log(`  ⏭️  No hidden contact link found in ${file}`);
    }
    
  } catch (error) {
    console.log(`  ⚠️  Skipping ${file}: ${error.message}`);
  }
});

console.log('\n✨ Contact link visibility fix complete!');
console.log('The contact link should now be visible at 100% scale.');