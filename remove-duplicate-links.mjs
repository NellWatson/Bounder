#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🧹 Removing duplicate contact links...');

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
    
    // Remove standalone duplicate contact links (not in the header)
    // This pattern matches the duplicate contact link div that's outside the header
    content = content.replace(/<div style="position: absolute; right: \d+px; top: 50%; transform: translateY\(-50%\); z-index: 9999;">[\s\S]*?<a href="\/contact"[^>]*>CONTACT<\/a>[\s\S]*?<\/div>/gi, '');
    
    // Also remove any duplicate contact links with different positioning
    content = content.replace(/<div style="position: absolute; right: 60px;[^>]*>[\s\S]*?<a href="\/contact"[^>]*>[\s\S]*?<\/a>[\s\S]*?<\/div>/gi, '');
    
    // Clean up any extra whitespace created by removals
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    writeFileSync(filePath, content);
    console.log(`  ✅ Cleaned ${file}`);
    
  } catch (error) {
    console.log(`  ⚠️  Error: ${error.message}`);
  }
});

console.log('\n✨ Duplicate links removed!');