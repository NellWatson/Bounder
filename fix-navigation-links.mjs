import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLONE_DIR = path.join(__dirname, 'bounder_enhanced');

async function fixNavigationLinks() {
  console.log('🔧 Fixing all navigation links to use .html extensions...\n');
  
  // Get all HTML files
  const htmlFiles = await fs.readdir(CLONE_DIR);
  const htmlPages = htmlFiles.filter(f => f.endsWith('.html'));
  
  for (const file of htmlPages) {
    console.log(`📝 Processing ${file}...`);
    const filePath = path.join(CLONE_DIR, file);
    let html = await fs.readFile(filePath, 'utf-8');
    
    // Fix navigation links with simple string replacement
    const linkMappings = [
      { from: 'href="/contact"', to: 'href="/contact.html"' },
      { from: 'href="/privacy"', to: 'href="/privacy.html"' },
      { from: 'href="/new-page"', to: 'href="/terms.html"' },
      { from: 'href="/gallery-shift"', to: 'href="/gallery-shift.html"' },
      { from: 'href="/ride-to-live-shift"', to: 'href="/ride-to-live-shift.html"' },
      { from: 'href="/index.html"', to: 'href="/"' }, // Home should be root
    ];
    
    let changeCount = 0;
    for (const mapping of linkMappings) {
      const regex = new RegExp(mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = html.match(regex);
      if (matches) {
        html = html.replace(regex, mapping.to);
        changeCount += matches.length;
        console.log(`  Fixed: ${mapping.from} -> ${mapping.to} (${matches.length} occurrences)`);
      }
    }
    
    // Also fix logo links to home
    html = html.replace(/href="\/index\.html"/g, 'href="/"');
    
    // Save updated HTML
    if (changeCount > 0) {
      await fs.writeFile(filePath, html);
      console.log(`  ✅ ${file} updated with ${changeCount} fixes\n`);
    } else {
      console.log(`  ℹ️ ${file} - no changes needed\n`);
    }
  }
  
  console.log('🎯 All navigation links fixed!');
  console.log('\nTo test:');
  console.log('  cd bounder_enhanced');
  console.log('  python3 -m http.server 8080');
  console.log('  open http://localhost:8080');
  console.log('  Click on Contact link to verify it works');
}

// Run the fix
fixNavigationLinks().catch(console.error);