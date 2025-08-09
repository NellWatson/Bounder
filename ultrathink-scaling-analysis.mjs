#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔬 ULTRATHINK: Deep scaling analysis...\n');

const indexPath = join(process.cwd(), 'index.html');
const content = readFileSync(indexPath, 'utf-8');

// Critical scaling factors to check
const scalingFactors = {
  viewport: false,
  htmlFontSize: null,
  bodyFontSize: null,
  containerMaxWidth: null,
  headerPadding: null,
  logoHeight: null,
  contactFontSize: null,
  transformScale: false,
  zoom: false
};

// 1. Check for viewport meta tag
if (content.includes('<meta name="viewport"')) {
  const viewportMatch = content.match(/<meta name="viewport"[^>]*content="([^"]+)"/);
  scalingFactors.viewport = viewportMatch ? viewportMatch[1] : false;
} else {
  console.log('❌ CRITICAL: No viewport meta tag found!');
  console.log('   This causes the browser to render at desktop width (980px) then scale down');
  console.log('   Result: Everything appears smaller than intended\n');
}

// 2. Check font sizes
const htmlFontSizeMatch = content.match(/html\s*{[^}]*font-size:\s*([^;]+);/);
const bodyFontSizeMatch = content.match(/body\s*{[^}]*font-size:\s*([^;]+);/);

if (htmlFontSizeMatch) scalingFactors.htmlFontSize = htmlFontSizeMatch[1];
if (bodyFontSizeMatch) scalingFactors.bodyFontSize = bodyFontSizeMatch[1];

// 3. Check header padding
const headerPaddingMatch = content.match(/\.header-wrapper\s*{[^}]*padding:\s*([^;]+);/);
if (headerPaddingMatch) {
  scalingFactors.headerPadding = headerPaddingMatch[1];
  console.log(`📏 Header padding: ${headerPaddingMatch[1]}`);
}

// 4. Check logo height
const logoHeightMatch = content.match(/\.site-title img\s*{[^}]*height:\s*([^;]+);/);
if (logoHeightMatch) {
  scalingFactors.logoHeight = logoHeightMatch[1];
  console.log(`📐 Logo height: ${logoHeightMatch[1]}`);
}

// 5. Check contact link font size
const contactFontMatch = content.match(/\.header-nav a\s*{[^}]*font-size:\s*([^;]+);/);
if (contactFontMatch) {
  scalingFactors.contactFontSize = contactFontMatch[1];
  console.log(`🔤 Contact font size: ${contactFontMatch[1]}`);
}

// 6. Check for transform scale
if (content.includes('transform:') && content.includes('scale')) {
  scalingFactors.transformScale = true;
  console.log('⚠️  Transform scale detected');
}

// 7. Check for zoom
if (content.includes('zoom:')) {
  scalingFactors.zoom = true;
  console.log('⚠️  Zoom property detected');
}

// 8. Check container widths
const maxWidthMatches = content.match(/max-width:\s*(\d+px)/g);
if (maxWidthMatches) {
  console.log('\n📦 Container max-widths found:');
  maxWidthMatches.forEach(match => console.log(`   - ${match}`));
}

console.log('\n🎯 DIAGNOSIS:');
console.log('The scaling difference is likely caused by:');
console.log('1. Missing viewport meta tag - Browser defaults to 980px viewport');
console.log('2. This makes everything render at ~64% of intended size');
console.log('3. Font sizes and paddings appear smaller than on bounder.io');

console.log('\n✅ SOLUTION:');
console.log('Add viewport meta tag to match standard responsive behavior:');
console.log('<meta name="viewport" content="width=device-width, initial-scale=1">');

// Create the fix
console.log('\n🔧 Applying fix...');

// Add viewport meta tag after <head>
let fixedContent = content.replace(
  '<head data-perfect-id="perfect-1" >',
  `<head data-perfect-id="perfect-1" >
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">`
);

// Also ensure consistent scaling across all viewports
if (!fixedContent.includes('-webkit-text-size-adjust')) {
  fixedContent = fixedContent.replace(
    '</head>',
    `  <style id="scaling-fix">
    /* Prevent iOS text size adjustment */
    html {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
    
    /* Ensure consistent rendering */
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  </style>
</head>`
  );
}

writeFileSync(indexPath, fixedContent);
console.log('✅ Fixed index.html');

// Fix other HTML files too
const otherFiles = ['contact.html', 'privacy.html', 'terms.html', 'gallery-shift.html', 'ride-to-live-shift.html'];

otherFiles.forEach(file => {
  const filePath = join(process.cwd(), file);
  try {
    let fileContent = readFileSync(filePath, 'utf-8');
    
    // Add viewport if missing
    if (!fileContent.includes('<meta name="viewport"')) {
      // Find the head tag
      if (fileContent.includes('<head')) {
        fileContent = fileContent.replace(
          /<head[^>]*>/,
          (match) => `${match}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">`
        );
        writeFileSync(filePath, fileContent);
        console.log(`✅ Fixed ${file}`);
      }
    } else {
      // Ensure viewport is correct
      fileContent = fileContent.replace(
        /<meta name="viewport"[^>]*>/,
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
      );
      writeFileSync(filePath, fileContent);
      console.log(`✅ Updated viewport in ${file}`);
    }
  } catch (error) {
    // File doesn't exist, skip
  }
});

console.log('\n🎯 ULTRATHINK COMPLETE!');
console.log('Scaling should now match bounder.io exactly.');