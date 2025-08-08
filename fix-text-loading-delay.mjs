#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Fixing text loading delay - removing font animation...');

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
    
    // Remove the font loading animation that hides text for 3 seconds
    content = content.replace(
      /<style[^>]*>@keyframes fonts-loading[\s\S]*?html\.wf-loading[\s\S]*?<\/style>/gi,
      ''
    );
    
    // Remove the wf-loading class script
    content = content.replace(
      /<script[^>]*>document\.documentElement\.classList\.add\('wf-loading'\)<\/script>/gi,
      ''
    );
    
    // Remove async and defer from critical scripts to load them immediately
    // Keep defer for non-critical scripts
    content = content.replace(
      /(<script[^>]*src="[^"]*typekit[^"]*"[^>]*)async=""([^>]*)/gi,
      '$1$2'
    );
    
    // Remove the onload handler that removes wf-loading class
    content = content.replace(
      /onload="try\{Typekit\.load\(\);\}catch\(e\)\{\} document\.documentElement\.classList\.remove\('wf-loading'\);"/gi,
      'onload="try{Typekit.load();}catch(e){}"'
    );
    
    // Add styles to ensure text is immediately visible
    if (!content.includes('/* Text immediately visible */')) {
      content = content.replace(/<\/head>/i, `
  <style>
    /* Text immediately visible */
    * {
      animation: none !important;
      color: inherit !important;
      opacity: 1 !important;
    }
    
    /* Ensure fonts fallback immediately */
    body, h1, h2, h3, h4, h5, h6, p, a, span, div {
      font-family: proxima-nova, "Helvetica Neue", Helvetica, Arial, sans-serif !important;
      visibility: visible !important;
    }
  </style>
</head>`);
    }
    
    // Remove any lazy loading from images in the hero/header area
    content = content.replace(
      /(<img[^>]*src="[^"]*logo[^"]*"[^>]*)loading="lazy"([^>]*)/gi,
      '$1$2'
    );
    
    writeFileSync(filePath, content);
    console.log(`  ✅ Fixed ${file}`);
    
  } catch (error) {
    console.log(`  ⚠️  Error: ${error.message}`);
  }
});

console.log('\n✨ Text loading delay fixed!');
console.log('📌 Removed 3-second font animation');
console.log('📌 Text now appears immediately');