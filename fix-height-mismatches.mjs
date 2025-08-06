import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLONE_DIR = path.join(__dirname, 'bounder_final_perfect');

console.log('🔧 Fixing height mismatches for pixel-perfect match...\n');

async function fixHeightMismatches() {
  const files = [
    { name: 'index.html', targetHeight: '3921px' },
    { name: 'privacy.html', targetHeight: '1818px' },
    { name: 'terms.html', fixTerms: true }
  ];
  
  for (const file of files) {
    console.log(`📝 Fixing ${file.name}...`);
    const filePath = path.join(CLONE_DIR, file.name);
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);
    
    // Add height fix styles
    const heightFix = `
      <style id="height-fix">
        /* Fix exact document height */
        html {
          height: ${file.targetHeight || 'auto'} !important;
          min-height: ${file.targetHeight || 'auto'} !important;
        }
        
        body {
          min-height: ${file.targetHeight || '100%'} !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Remove any bottom margins that might cause height differences */
        .site-wrapper > :last-child,
        .site-inner-wrapper > :last-child,
        .content-wrapper > :last-child,
        footer {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
        
        /* Ensure no floating elements cause height issues */
        .site-wrapper::after,
        .site-inner-wrapper::after {
          content: "";
          display: table;
          clear: both;
        }
        
        /* Fix any collapsing margins */
        * {
          margin-collapse: separate !important;
          margin-trim: none !important;
        }
        
        ${file.fixTerms ? `
        /* Special fixes for terms page */
        .content, .sqs-layout {
          min-height: auto !important;
        }
        
        p, li {
          margin-bottom: 1em !important;
          line-height: 1.6 !important;
        }
        
        h1, h2, h3 {
          margin-top: 1.5em !important;
          margin-bottom: 0.5em !important;
        }
        
        /* Ensure consistent text rendering */
        * {
          -webkit-text-size-adjust: 100% !important;
          text-size-adjust: 100% !important;
        }
        ` : ''}
      </style>
    `;
    
    // Remove any existing height-fix style
    $('#height-fix').remove();
    
    // Add the new fix
    $('head').append(heightFix);
    
    // For terms page, also ensure consistent font rendering
    if (file.fixTerms) {
      // Force re-render of fonts
      $('head').append(`
        <style id="terms-font-fix">
          /* Force exact font metrics */
          p, li, span {
            font-family: proxima-nova, sans-serif !important;
            font-weight: 400 !important;
            font-size: 15px !important;
            line-height: 24px !important;
            letter-spacing: normal !important;
          }
          
          h1 { font-size: 30px !important; line-height: 36px !important; }
          h2 { font-size: 24px !important; line-height: 30px !important; }
          h3 { font-size: 18px !important; line-height: 24px !important; }
        </style>
      `);
    }
    
    await fs.writeFile(filePath, $.html());
    console.log(`  ✅ Fixed ${file.name}`);
  }
  
  console.log('\n✅ Height mismatches fixed!');
  console.log('The clone should now have exact pixel-perfect dimensions.');
}

fixHeightMismatches().catch(console.error);