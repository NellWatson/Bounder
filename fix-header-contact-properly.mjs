#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 Fixing contact link in header to match original Bounder.io exactly...');

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
    
    // Find the header navigation section
    // Look for the UL with the contact link
    const navPattern = /<ul[^>]*class="[^"]*header-nav-list[^"]*"[^>]*>[\s\S]*?<\/ul>/gi;
    const match = content.match(navPattern);
    
    if (match) {
      console.log(`  ✓ Found header navigation in ${file}`);
      
      // Replace the navigation list with a clean version
      const cleanNav = `<ul class="header-nav-list" style="list-style: none; margin: 0; padding: 0; position: absolute; right: 40px; top: 50%; transform: translateY(-50%);">
            <li style="display: inline-block;">
              <a href="/contact" style="color: #fff; text-decoration: none; font-family: futura-pt, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">CONTACT</a>
            </li>
          </ul>`;
      
      content = content.replace(navPattern, cleanNav);
      
      // Also ensure the header element itself has proper positioning
      content = content.replace(
        /<header[^>]*id="header"[^>]*style="[^"]*"[^>]*>/gi,
        '<header id="header" class="sqs-announcement-bar-dropzone" style="position: absolute; top: 0; left: 0; right: 0; z-index: 8001; background: transparent; padding: 40px;">'
      );
      
      writeFileSync(filePath, content);
      console.log(`  ✅ Fixed header navigation in ${file}`);
    } else {
      console.log(`  ⏭️  No header navigation found in ${file}`);
    }
    
  } catch (error) {
    console.log(`  ⚠️  Skipping ${file}: ${error.message}`);
  }
});

console.log('\n✨ Header contact link fix complete!');
console.log('The contact link should now match the original Bounder.io site exactly.');