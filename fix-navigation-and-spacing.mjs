#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of HTML files to update
const htmlFiles = [
  'index.html',
  'gallery-shift.html',
  'ride-to-live-shift.html',
  'privacy.html',
  'terms.html',
  '404.html'
];

// Navigation HTML to inject
const navigationHTML = `
      <nav class="header-nav">
        <ul>
          <li><a href="/gallery-shift.html">GALLERY</a></li>
          <li><a href="/ride-to-live-shift.html">RIDE TO LIVE</a></li>
          <li><a href="/contact.html">CONTACT</a></li>
        </ul>
      </nav>`;

// CSS to reduce spacing
const spacingCSS = `
    /* Reduce excessive whitespace */
    .Main--page {
      min-height: auto !important;
    }
    
    #page {
      min-height: auto !important;
    }
    
    .Main {
      padding-bottom: 40px !important;
    }
    
    /* Reduce spacing after GitHub button */
    .sqs-block-button-container[data-github-button="true"] {
      margin-bottom: 40px !important;
    }
    
    /* Ensure footer stays at bottom without excessive space */
    footer, 
    .Footer,
    #footer {
      margin-top: 40px !important;
      position: relative !important;
    }
    
    /* Fix any excessive vertical padding */
    .content-wrapper,
    .sqs-layout {
      padding-bottom: 40px !important;
    }
    
    /* Ensure consistent header navigation display */
    .header-nav {
      display: block !important;
      visibility: visible !important;
    }
    
    .header-nav ul {
      list-style: none;
      display: flex;
      gap: 30px;
      margin: 0;
      padding: 0;
    }
    
    .header-nav a {
      color: white !important;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      transition: opacity 0.3s ease;
    }
    
    .header-nav a:hover {
      opacity: 0.6;
    }`;

// Process each HTML file
htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has a main-nav section and no header-nav
    if (!content.includes('class="header-nav"') && content.includes('main-nav')) {
      console.log(`Adding navigation to ${file}...`);
      
      // Find a good place to inject navigation (after site title if exists)
      const siteTitleMatch = content.match(/<div[^>]*class="[^"]*site-title[^"]*"[^>]*>[\s\S]*?<\/div>/);
      if (siteTitleMatch) {
        const insertIndex = content.indexOf(siteTitleMatch[0]) + siteTitleMatch[0].length;
        content = content.slice(0, insertIndex) + navigationHTML + content.slice(insertIndex);
      }
    }
    
    // Add or update spacing CSS
    if (!content.includes('/* Reduce excessive whitespace */')) {
      // Find existing style tag or create one
      const styleMatch = content.match(/<style[^>]*id="spacing-fix"[^>]*>[\s\S]*?<\/style>/);
      
      if (styleMatch) {
        // Update existing spacing fix style
        content = content.replace(styleMatch[0], `<style id="spacing-fix">${spacingCSS}</style>`);
      } else {
        // Add new style tag before closing head
        const headCloseIndex = content.indexOf('</head>');
        if (headCloseIndex > -1) {
          content = content.slice(0, headCloseIndex) + 
            `  <style id="spacing-fix">${spacingCSS}</style>\n` +
            content.slice(headCloseIndex);
        }
      }
    }
    
    // Write updated content back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${file}`);
    
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

// Update contact.html navigation to match
const contactPath = path.join(__dirname, 'contact.html');
try {
  let contactContent = fs.readFileSync(contactPath, 'utf8');
  
  // Replace the navigation in contact.html
  contactContent = contactContent.replace(
    /<nav class="header-nav">[\s\S]*?<\/nav>/,
    navigationHTML
  );
  
  // Add spacing CSS if not present
  if (!contactContent.includes('/* Reduce excessive whitespace */')) {
    const styleCloseIndex = contactContent.indexOf('</style>');
    if (styleCloseIndex > -1) {
      contactContent = contactContent.slice(0, styleCloseIndex) + 
        `\n    ${spacingCSS}\n  ` +
        contactContent.slice(styleCloseIndex);
    }
  }
  
  fs.writeFileSync(contactPath, contactContent, 'utf8');
  console.log('✓ Updated contact.html navigation');
  
} catch (error) {
  console.error('Error updating contact.html:', error.message);
}

console.log('\n✅ Navigation and spacing fixes applied successfully!');