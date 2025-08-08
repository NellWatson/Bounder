#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 ULTRATHINK: Fixing header and contact link positioning properly...');

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
    
    // Remove ALL existing contact links and navigation to start fresh
    content = content.replace(/<nav class="header-nav"[^>]*>[\s\S]*?<\/nav>/gi, '');
    
    // Find the header wrapper div and add the contact link properly positioned
    const headerWrapperPattern = /<div[^>]*class="[^"]*header-wrapper[^"]*"[^>]*>/i;
    
    if (headerWrapperPattern.test(content)) {
      // Add contact link in the header wrapper with proper positioning
      content = content.replace(
        headerWrapperPattern,
        `$&
        <div style="position: absolute; right: 60px; top: 50%; transform: translateY(-50%); z-index: 9999;">
          <a href="/contact" style="color: #fff; text-decoration: none; font-family: futura-pt, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">CONTACT</a>
        </div>`
      );
    } else {
      // If no header wrapper, add after the logo
      content = content.replace(
        /(<\/h1>)/i,
        `$1
        <div style="position: absolute; right: 60px; top: 50%; transform: translateY(-50%); z-index: 9999;">
          <a href="/contact" style="color: #fff; text-decoration: none; font-family: futura-pt, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">CONTACT</a>
        </div>`
      );
    }
    
    // Also remove any duplicate contact links in the hidden nav
    content = content.replace(/<li[^>]*>\s*<a[^>]*href="\/contact"[^>]*>[\s\S]*?<\/a>\s*<\/li>/gi, '');
    
    writeFileSync(filePath, content);
    console.log(`  ✅ Fixed ${file}`);
    
  } catch (error) {
    console.log(`  ⚠️  Skipping ${file}: ${error.message}`);
  }
});

console.log('\n✨ ULTRATHINK: Header fixed properly!');