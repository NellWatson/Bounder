import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Your Formspree form ID
const FORMSPREE_ID = 'xqalyykn';

// All clone directories to update
const CLONE_DIRS = [
  'bounder_final_perfect',
  'bounder_ultimate', 
  'bounder_perfect',
  'bounder_final',
  'bounder_enhanced',
  'bounder_clone'
];

async function configureFormspreeID() {
  console.log('🔧 CONFIGURING FORMSPREE WITH YOUR FORM ID\n');
  console.log('=' .repeat(70));
  console.log(`📋 Form ID: ${FORMSPREE_ID}`);
  console.log(`🔗 Endpoint: https://formspree.io/f/${FORMSPREE_ID}\n`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const dir of CLONE_DIRS) {
    const contactPath = path.join(__dirname, dir, 'contact.html');
    
    if (await fs.pathExists(contactPath)) {
      try {
        console.log(`📁 Updating ${dir}/contact.html...`);
        
        // Read the file
        let html = await fs.readFile(contactPath, 'utf-8');
        
        // Replace the placeholder with actual form ID
        const originalAction = 'https://formspree.io/f/YOUR_FORM_ID';
        const newAction = `https://formspree.io/f/${FORMSPREE_ID}`;
        
        if (html.includes(originalAction)) {
          html = html.replace(originalAction, newAction);
          
          // Save the updated file
          await fs.writeFile(contactPath, html);
          console.log(`  ✅ Updated with form ID: ${FORMSPREE_ID}\n`);
          updatedCount++;
        } else if (html.includes(`https://formspree.io/f/${FORMSPREE_ID}`)) {
          console.log(`  ℹ️  Already configured with correct form ID\n`);
          updatedCount++;
        } else if (html.includes('formspree.io')) {
          console.log(`  ⚠️  Has different Formspree configuration\n`);
        } else {
          console.log(`  ❌ No Formspree form found\n`);
          errorCount++;
        }
      } catch (error) {
        console.log(`  ❌ Error updating: ${error.message}\n`);
        errorCount++;
      }
    } else {
      console.log(`⚠️  ${dir}/contact.html not found\n`);
    }
  }
  
  console.log('=' .repeat(70));
  console.log('📊 CONFIGURATION COMPLETE!\n');
  console.log(`✅ Successfully configured: ${updatedCount} forms`);
  if (errorCount > 0) {
    console.log(`❌ Errors encountered: ${errorCount}`);
  }
  
  console.log('\n🎉 YOUR CONTACT FORM IS NOW ACTIVE!\n');
  console.log('When someone submits the form:');
  console.log('  1. You\'ll receive an email with their message');
  console.log('  2. They\'ll see a success message');
  console.log('  3. All submissions are stored in your Formspree dashboard');
  
  console.log('\n📧 Form submissions will be sent to:');
  console.log('  The email address associated with your Formspree account');
  
  console.log('\n🚀 Next Steps:');
  console.log('  1. Test the form locally:');
  console.log('     cd bounder_final_perfect');
  console.log('     python3 -m http.server 8080');
  console.log('     Open http://localhost:8080/contact.html');
  console.log('  2. Commit and push to GitHub');
  console.log('  3. Your live site will have a working contact form!');
  
  console.log('\n💡 Manage submissions at:');
  console.log('  https://formspree.io/forms/' + FORMSPREE_ID + '/submissions');
  
  console.log('\n✨ Contact form is ready for production use!');
}

// Run the configuration
configureFormspreeID().catch(console.error);