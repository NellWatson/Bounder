import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function cleanInlineStyles() {
  console.log('🧹 CLEANING INLINE STYLES FROM GITHUB ICONS\n');
  console.log('='.repeat(80));
  
  const directories = [
    'docs',
    '.',  // root
    'bounder_final_perfect',
    'bounder_ultimate',
    'bounder_perfect',
    'bounder_enhanced',
    'bounder_final',
    'bounder_clone'
  ];
  
  const filesToFix = [
    'index.html',
    'contact.html',
    'privacy.html',
    'terms.html',
    'gallery-shift.html',
    'ride-to-live-shift.html',
    '404.html'
  ];
  
  for (const dir of directories) {
    const dirPath = path.join(__dirname, dir);
    
    if (!await fs.pathExists(dirPath)) {
      continue;
    }
    
    console.log(`\n📁 Processing ${dir}/`);
    
    for (const file of filesToFix) {
      const filePath = path.join(dirPath, file);
      
      if (!await fs.pathExists(filePath)) {
        continue;
      }
      
      console.log(`  📄 Cleaning ${file}...`);
      
      let html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html, { decodeEntities: false });
      
      // Clean inline styles from GitHub icon wrappers
      $('.sqs-svg-icon--wrapper.github-unauth').each((i, el) => {
        const $el = $(el);
        // Remove all inline styles
        $el.removeAttr('style');
        $el.removeAttr('data-perfect-id');
        
        // Also clean any child elements
        $el.find('*').each((j, child) => {
          $(child).removeAttr('style');
        });
      });
      
      // Clean GitHub buttons
      $('.sqs-block-button-element[href*="github.com"]').each((i, el) => {
        const $el = $(el);
        $el.removeAttr('style');
        $el.removeAttr('data-perfect-id');
      });
      
      // Save the updated HTML
      await fs.writeFile(filePath, $.html());
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ INLINE STYLES CLEANED!');
}

cleanInlineStyles().catch(console.error);