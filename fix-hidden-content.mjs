#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Fixing hidden content issue - making all content immediately visible...');

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
    
    // Remove ALL defer and async attributes from scripts to ensure they load immediately
    content = content.replace(/(<script[^>]*)\s+defer(?:="[^"]*")?([^>]*>)/gi, '$1$2');
    content = content.replace(/(<script[^>]*)\s+async(?:="[^"]*")?([^>]*>)/gi, '$1$2');
    
    // Remove any display:none or visibility:hidden from main content areas
    content = content.replace(/display:\s*none\s*!important;/gi, 'display: block !important;');
    content = content.replace(/visibility:\s*hidden\s*!important;/gi, 'visibility: visible !important;');
    
    // Add critical CSS to ensure content is visible immediately
    const criticalCSS = `
  <style id="critical-visibility">
    /* CRITICAL: Force all content to be visible immediately */
    body, 
    .site-wrapper,
    .site-inner-wrapper,
    .sqs-layout,
    .sqs-block,
    .sqs-block-content,
    .sqs-html-content,
    main,
    section,
    article,
    div {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* Ensure text is visible */
    h1, h2, h3, h4, h5, h6, p, span, a {
      visibility: visible !important;
      opacity: 1 !important;
      color: inherit !important;
    }
    
    /* Remove any animations that might hide content */
    * {
      animation: none !important;
      transition: none !important;
    }
    
    /* Specific fixes for Squarespace content */
    .sqs-block-html,
    .sqs-block-button,
    .sqs-block-video,
    .sqs-block-content {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* Fix for main content area */
    #page,
    #content,
    .Main,
    .Main-content,
    .content-container {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* Remove loading states */
    .loading,
    .is-loading,
    .wf-loading {
      display: none !important;
    }
    
    /* Ensure the site wrapper shows content */
    .site-wrapper {
      overflow: visible !important;
      height: auto !important;
      min-height: 100vh !important;
    }
    
    .site-inner-wrapper {
      display: block !important;
      visibility: visible !important;
      height: auto !important;
    }
  </style>`;
    
    // Add the critical CSS right after opening head tag
    content = content.replace(/<head[^>]*>/i, (match) => match + criticalCSS);
    
    // Remove any existing wf-loading animations
    content = content.replace(
      /<style[^>]*>[\s\S]*?@keyframes\s+fonts-loading[\s\S]*?<\/style>/gi,
      ''
    );
    
    // Remove the grecaptcha badge hiding style
    content = content.replace(
      /<style[^>]*id="forms-grecaptcha-badge-style"[^>]*>[\s\S]*?<\/style>/gi,
      ''
    );
    
    // Ensure main content divs are properly structured
    // Look for site-inner-wrapper and ensure it's visible
    content = content.replace(
      /(<div[^>]*class="[^"]*site-inner-wrapper[^"]*"[^>]*)(>)/gi,
      '$1 style="display: block !important; visibility: visible !important;"$2'
    );
    
    writeFileSync(filePath, content);
    console.log(`  ✅ Fixed ${file}`);
    
  } catch (error) {
    console.log(`  ⚠️  Error: ${error.message}`);
  }
});

console.log('\n✨ Content visibility fixed!');
console.log('📌 All content now visible immediately');
console.log('📌 Removed all defer/async from scripts');
console.log('📌 Added critical CSS for immediate rendering');