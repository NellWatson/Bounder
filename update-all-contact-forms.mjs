import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// All possible clone directories
const CLONE_DIRS = [
  'bounder_ultimate', 
  'bounder_perfect',
  'bounder_final',
  'bounder_enhanced',
  'bounder_clone'
];

async function updateAllContactForms() {
  console.log('📋 UPDATING ALL CONTACT FORMS WITH FORMSPREE\n');
  console.log('=' .repeat(60));
  
  const sourceFile = path.join(__dirname, 'bounder_final_perfect', 'contact.html');
  
  if (!await fs.pathExists(sourceFile)) {
    console.log('❌ Source contact.html not found in bounder_final_perfect');
    return;
  }
  
  console.log('✅ Found updated contact.html in bounder_final_perfect\n');
  
  let updatedCount = 0;
  
  for (const dir of CLONE_DIRS) {
    const dirPath = path.join(__dirname, dir);
    const targetFile = path.join(dirPath, 'contact.html');
    
    if (await fs.pathExists(dirPath) && await fs.pathExists(targetFile)) {
      console.log(`📁 Updating ${dir}/contact.html...`);
      await fs.copyFile(sourceFile, targetFile);
      console.log(`  ✅ Updated\n`);
      updatedCount++;
    } else if (await fs.pathExists(dirPath)) {
      console.log(`⚠️  ${dir} exists but no contact.html found\n`);
    }
  }
  
  console.log('=' .repeat(60));
  console.log(`✅ Updated ${updatedCount} contact forms across all clones\n`);
  
  if (updatedCount > 0) {
    console.log('📌 All contact forms now have:');
    console.log('  • Functional Formspree integration');
    console.log('  • Consistent Bounder branding');
    console.log('  • Drone safety-focused fields');
    console.log('  • Professional styling matching the site theme');
    console.log('\n⚠️  Remember to add your Formspree form ID!');
  }
}

// Run the update
updateAllContactForms().catch(console.error);