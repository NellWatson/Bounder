#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 Moving contact link to correct position...');

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
    
    // Find and replace the contact div positioning - move it WAY left
    content = content.replace(
      /<div style="position: absolute; right: 60px;[^>]*>/gi,
      '<div style="position: absolute; right: 200px; top: 50%; transform: translateY(-50%); z-index: 9999;">'
    );
    
    // Also update any inline nav elements
    content = content.replace(
      /<nav class="header-nav" style="[^"]*">/gi,
      '<nav class="header-nav" style="position: absolute; right: 200px; top: 50%; transform: translateY(-50%);">'
    );
    
    writeFileSync(filePath, content);
    console.log(`  ✅ Fixed ${file}`);
    
  } catch (error) {
    console.log(`  ⚠️  Error: ${error.message}`);
  }
});

console.log('\n✨ Contact link repositioned!');