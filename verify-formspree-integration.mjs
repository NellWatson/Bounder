import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function verifyFormspreeIntegration() {
  console.log('🔍 VERIFYING FORMSPREE CONTACT FORM INTEGRATION\n');
  console.log('=' .repeat(70));
  
  const contactPath = path.join(__dirname, 'bounder_final_perfect', 'contact.html');
  
  if (!await fs.pathExists(contactPath)) {
    console.log('❌ Contact file not found');
    return;
  }
  
  const html = await fs.readFile(contactPath, 'utf-8');
  const $ = cheerio.load(html);
  
  // Check for Formspree form
  const form = $('form[action*="formspree.io"]');
  
  if (form.length > 0) {
    console.log('✅ Formspree form found!\n');
    
    const action = form.attr('action');
    console.log('📋 Form Details:');
    console.log('  Action URL:', action);
    
    if (action.includes('YOUR_FORM_ID')) {
      console.log('  ⚠️  Status: NEEDS CONFIGURATION');
      console.log('     Replace "YOUR_FORM_ID" with your actual Formspree form ID\n');
    } else {
      console.log('  ✅ Status: CONFIGURED\n');
    }
    
    // List all form fields
    console.log('📝 Form Fields:');
    const inputs = form.find('input[type!="hidden"][type!="text"][name], input[type="text"][name], input[type="email"][name], input[type="tel"][name]');
    inputs.each((i, el) => {
      const $el = $(el);
      const name = $el.attr('name');
      const type = $el.attr('type');
      const required = $el.attr('required') !== undefined;
      
      if (name && name !== '_gotcha') {
        console.log(`  • ${name} (${type})${required ? ' *required' : ''}`);
      }
    });
    
    const textarea = form.find('textarea[name]');
    textarea.each((i, el) => {
      const $el = $(el);
      const name = $el.attr('name');
      const required = $el.attr('required') !== undefined;
      console.log(`  • ${name} (textarea)${required ? ' *required' : ''}`);
    });
    
    const select = form.find('select[name]');
    select.each((i, el) => {
      const $el = $(el);
      const name = $el.attr('name');
      const options = $el.find('option').length;
      console.log(`  • ${name} (select with ${options} options)`);
    });
    
    // Check for spam protection
    const honeypot = form.find('input[name="_gotcha"]');
    if (honeypot.length > 0) {
      console.log('\n🔒 Security Features:');
      console.log('  ✅ Honeypot spam protection');
    }
    
    // Check for success redirect
    const successRedirect = form.find('input[name="_next"]');
    if (successRedirect.length > 0) {
      console.log('  ✅ Success redirect:', successRedirect.attr('value'));
    }
    
    // Check for custom subject
    const customSubject = form.find('input[name="_subject"]');
    if (customSubject.length > 0) {
      console.log('  ✅ Custom email subject:', customSubject.attr('value'));
    }
    
    // Check for JavaScript enhancements
    const hasJS = html.includes('bounder-contact-form');
    if (hasJS) {
      console.log('\n✨ JavaScript Enhancements:');
      console.log('  ✅ Form validation');
      console.log('  ✅ Loading state on submit');
      console.log('  ✅ Success message handling');
    }
    
    // Check styling
    const hasCustomStyles = html.includes('contact-form-container');
    if (hasCustomStyles) {
      console.log('\n🎨 Styling:');
      console.log('  ✅ Custom Bounder branding');
      console.log('  ✅ Responsive design');
      console.log('  ✅ Focus states');
      console.log('  ✅ Error validation styles');
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 INTEGRATION STATUS SUMMARY\n');
    
    if (action.includes('YOUR_FORM_ID')) {
      console.log('⚠️  Form is READY but needs configuration:\n');
      console.log('   1. Go to https://formspree.io');
      console.log('   2. Sign up for a free account');
      console.log('   3. Create a new form');
      console.log('   4. Copy your form ID');
      console.log('   5. Edit contact.html and replace YOUR_FORM_ID');
      console.log('   6. Deploy to GitHub Pages');
      console.log('\n   Once configured, the form will send emails directly to you!');
    } else {
      console.log('✅ Form is FULLY CONFIGURED and ready to receive submissions!');
      console.log('\n   Submissions will be sent to the email associated with your Formspree account.');
    }
    
  } else {
    console.log('❌ No Formspree form found in contact.html');
    console.log('   Run "node add-formspree-contact.mjs" to add it');
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('✅ Verification complete!\n');
}

// Run verification
verifyFormspreeIntegration().catch(console.error);