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

// Enhanced CSS to ensure navigation is always visible
const navigationFixCSS = `
    /* Fix header navigation visibility at all scales */
    .Header,
    header {
      overflow: visible !important;
    }
    
    .Header-inner,
    .header-inner {
      max-width: 100% !important;
      padding: 0 20px !important;
    }
    
    /* Ensure navigation is visible */
    .header-nav,
    .Header-nav,
    .main-nav {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: static !important;
      width: auto !important;
      overflow: visible !important;
    }
    
    .header-nav ul,
    .Header-nav ul {
      display: flex !important;
      list-style: none !important;
      gap: 20px !important;
      margin: 0 !important;
      padding: 0 !important;
      flex-wrap: nowrap !important;
    }
    
    .header-nav li,
    .Header-nav li {
      display: inline-block !important;
      white-space: nowrap !important;
    }
    
    .header-nav a,
    .Header-nav a {
      color: white !important;
      text-decoration: none !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      text-transform: uppercase !important;
      letter-spacing: 1.2px !important;
      transition: opacity 0.3s ease !important;
      padding: 5px 8px !important;
      display: inline-block !important;
      white-space: nowrap !important;
    }
    
    .header-nav a:hover,
    .Header-nav a:hover {
      opacity: 0.6 !important;
    }
    
    /* Responsive adjustments */
    @media (min-width: 769px) {
      .Header-inner,
      .header-inner {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
      
      .site-title {
        flex-shrink: 0 !important;
      }
      
      .header-nav,
      .Header-nav {
        margin-left: auto !important;
        flex-shrink: 0 !important;
      }
      
      .header-nav ul,
      .Header-nav ul {
        gap: 25px !important;
      }
      
      .header-nav a,
      .Header-nav a {
        font-size: 13px !important;
        padding: 5px 10px !important;
      }
    }
    
    /* Hide mobile nav on desktop */
    @media (min-width: 769px) {
      .Mobile-bar,
      .mobile-nav-toggle {
        display: none !important;
      }
    }
    
    /* Mobile navigation */
    @media (max-width: 768px) {
      .header-nav,
      .Header-nav {
        display: none !important;
      }
      
      .Mobile-bar,
      .mobile-nav-toggle {
        display: block !important;
      }
    }`;

// Process each HTML file
htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove old navigation fix styles
    content = content.replace(/<style[^>]*id="nav-fix"[^>]*>[\s\S]*?<\/style>/g, '');
    content = content.replace(/<style[^>]*id="spacing-fix"[^>]*>[\s\S]*?<\/style>/g, '');
    
    // Add new combined fix before closing head
    const newStyle = `  <style id="nav-visibility-fix">${navigationFixCSS}</style>\n`;
    const headCloseIndex = content.indexOf('</head>');
    if (headCloseIndex > -1) {
      content = content.slice(0, headCloseIndex) + newStyle + content.slice(headCloseIndex);
    }
    
    // Ensure navigation structure exists
    if (!content.includes('class="header-nav"') && !content.includes('class="Header-nav"')) {
      // Find where to add navigation
      const patterns = [
        /<div[^>]*class="[^"]*site-title[^"]*"[^>]*>[\s\S]*?<\/div>/,
        /<div[^>]*class="[^"]*Site-title[^"]*"[^>]*>[\s\S]*?<\/div>/,
        /<h1[^>]*class="[^"]*site-title[^"]*"[^>]*>[\s\S]*?<\/h1>/
      ];
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          const insertIndex = content.indexOf(match[0]) + match[0].length;
          const navHTML = `
      <nav class="header-nav">
        <ul>
          <li><a href="/gallery-shift.html">GALLERY</a></li>
          <li><a href="/ride-to-live-shift.html">RIDE TO LIVE</a></li>
          <li><a href="/contact.html">CONTACT</a></li>
        </ul>
      </nav>`;
          content = content.slice(0, insertIndex) + navHTML + content.slice(insertIndex);
          break;
        }
      }
    }
    
    // Write updated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${file}`);
    
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

// Update contact.html separately
const contactPath = path.join(__dirname, 'contact.html');
try {
  let contactContent = fs.readFileSync(contactPath, 'utf8');
  
  // Ensure contact page has proper navigation styling
  if (!contactContent.includes('nav-visibility-fix')) {
    const styleEndIndex = contactContent.indexOf('</style>');
    if (styleEndIndex > -1) {
      // Add responsive navigation fixes
      const contactNavFix = `
    
    /* Ensure navigation visibility at all scales */
    @media (min-width: 769px) {
      .header-nav {
        display: flex !important;
        visibility: visible !important;
      }
      
      .header-nav ul {
        display: flex !important;
        gap: 25px !important;
      }
      
      .header-inner {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        max-width: 1200px !important;
      }
    }`;
      
      contactContent = contactContent.slice(0, styleEndIndex) + contactNavFix + '\n  ' + contactContent.slice(styleEndIndex);
    }
  }
  
  fs.writeFileSync(contactPath, contactContent, 'utf8');
  console.log('✓ Updated contact.html navigation');
  
} catch (error) {
  console.error('Error updating contact.html:', error.message);
}

console.log('\n✅ Navigation visibility fixes applied successfully!');
console.log('The Contact link should now be visible at 100% scale.');