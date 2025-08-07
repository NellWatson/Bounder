#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Removing lazy loading from header/hero images...\n');

// List of HTML files to process
const htmlFiles = [
  'index.html',
  'gallery-shift.html',
  'ride-to-live-shift.html',
  'privacy.html',
  'terms.html',
  '404.html',
  'contact.html'
];

// Process each HTML file
htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Special handling for contact.html - restore immediate loading for hero
    if (file === 'contact.html') {
      // Remove lazy loading from hero section
      content = content.replace(
        '<div class="hero-section" data-bg-src="https://images.squarespace-cdn.com/content/v1/55acf641e4b0b8a3dbbdbd91/1437403987855-UZEGF7VV4UCP5MQ7E5MI/drone-698564.jpg">',
        '<div class="hero-section">'
      );
      
      // Restore the background image in CSS
      content = content.replace(
        'background: #1a1a1a center center;',
        "background: url('https://images.squarespace-cdn.com/content/v1/55acf641e4b0b8a3dbbdbd91/1437403987855-UZEGF7VV4UCP5MQ7E5MI/drone-698564.jpg') center center;"
      );
      
      modified = true;
    }
    
    // Remove lazy loading from header background images in all files
    // Look for header/hero sections and remove lazy loading
    content = content.replace(/<div([^>]*?)class="([^"]*)(banner|header|hero|Header|Hero|Banner)([^"]*)"([^>]*?)data-bg-src="([^"]+)"([^>]*)>/gi, 
      (match, before, classStart, headerType, classEnd, bgSrc, after) => {
        modified = true;
        // Remove data-bg-src and add style with background
        return `<div${before}class="${classStart}${headerType}${classEnd}"${after} style="background-image: url('${bgSrc}')"${after}>`;
      }
    );
    
    // Remove lazy loading from any images that are in header sections
    const headerPattern = /<(header|nav|\.header|\.nav|\.hero|\.banner)[^>]*>[\s\S]*?<\/(header|nav|div)>/gi;
    let headerMatches = content.match(headerPattern);
    
    if (headerMatches) {
      headerMatches.forEach(headerBlock => {
        const updatedBlock = headerBlock.replace(/loading="lazy"\s*/g, '');
        if (updatedBlock !== headerBlock) {
          content = content.replace(headerBlock, updatedBlock);
          modified = true;
        }
      });
    }
    
    // Remove lazy loading from images that have specific header-related classes or IDs
    content = content.replace(/<img([^>]*?)(class|id)="([^"]*)(logo|header|hero|banner|nav)([^"]*)"([^>]*?)loading="lazy"([^>]*)>/gi, 
      (match, before, attr, classStart, headerType, classEnd, middle, after) => {
        modified = true;
        return `<img${before}${attr}="${classStart}${headerType}${classEnd}"${middle}${after}>`;
      }
    );
    
    // Also handle the reverse order (loading="lazy" before class/id)
    content = content.replace(/<img([^>]*?)loading="lazy"([^>]*?)(class|id)="([^"]*)(logo|header|hero|banner|nav)([^"]*)"([^>]*)>/gi, 
      (match, before, middle, attr, classStart, headerType, classEnd, after) => {
        modified = true;
        return `<img${before}${middle}${attr}="${classStart}${headerType}${classEnd}"${after}>`;
      }
    );
    
    // Update the lazy loading script to exclude header elements
    if (content.includes('document.querySelectorAll(\'[data-bg-src], [data-src]\')')) {
      content = content.replace(
        "document.querySelectorAll('[data-bg-src], [data-src]')",
        "document.querySelectorAll('[data-bg-src]:not(.hero-section):not(.header):not(.banner), [data-src]:not(.header-image):not(.logo)')"
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed header lazy loading in ${file}`);
    } else {
      console.log(`  No header images found in ${file}`);
    }
    
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

// Add preload hints for critical images
console.log('\n📸 Adding preload hints for critical images...');

const criticalImages = [
  'https://images.squarespace-cdn.com/content/v1/55acf641e4b0b8a3dbbdbd91/1437403987855-UZEGF7VV4UCP5MQ7E5MI/drone-698564.jpg', // Contact hero
  'https://images.squarespace-cdn.com/content/v1/55acf641e4b0b8a3dbbdbd91/1437403009793-BFHNV4VS4T0CE5CSOQQM/castle-500179.jpg', // Homepage hero
];

// Add preload to index.html
const indexPath = path.join(__dirname, 'index.html');
try {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add preload links if not present
  if (!indexContent.includes('rel="preload"')) {
    const preloadLinks = `
  <!-- Preload critical images -->
  <link rel="preload" as="image" href="${criticalImages[1]}" />`;
    
    const headIndex = indexContent.indexOf('<head>');
    if (headIndex > -1) {
      indexContent = indexContent.slice(0, headIndex + 6) + preloadLinks + indexContent.slice(headIndex + 6);
      fs.writeFileSync(indexPath, indexContent, 'utf8');
      console.log('✓ Added preload hints to index.html');
    }
  }
} catch (error) {
  console.error('Error adding preload hints:', error.message);
}

// Add preload to contact.html
const contactPath = path.join(__dirname, 'contact.html');
try {
  let contactContent = fs.readFileSync(contactPath, 'utf8');
  
  if (!contactContent.includes('rel="preload"')) {
    const preloadLinks = `
  <!-- Preload hero image -->
  <link rel="preload" as="image" href="${criticalImages[0]}" />`;
    
    const headIndex = contactContent.indexOf('<head>');
    if (headIndex > -1) {
      contactContent = contactContent.slice(0, headIndex + 6) + preloadLinks + contactContent.slice(headIndex + 6);
      fs.writeFileSync(contactPath, contactContent, 'utf8');
      console.log('✓ Added preload hints to contact.html');
    }
  }
} catch (error) {
  console.error('Error adding preload hints:', error.message);
}

console.log('\n✅ Header images fixed!');
console.log('   - Hero/header images load immediately');
console.log('   - Other images still use lazy loading');
console.log('   - Added preload hints for critical images');
console.log('   - Better perceived performance');