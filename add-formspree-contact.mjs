import fs from 'fs-extra';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check all possible clone directories
const CLONE_DIRS = [
  'bounder_final_perfect',
  'bounder_ultimate', 
  'bounder_perfect',
  'bounder_final',
  'bounder_enhanced',
  'bounder_clone'
];

async function addFormspreeContactToBounder() {
  console.log('🚀 ADDING FORMSPREE CONTACT FORM TO BOUNDER\n');
  console.log('=' .repeat(70));
  console.log('Replacing Squarespace form with functional Formspree form\n');
  
  // Find the most recent/best clone directory
  let CLONE_DIR = null;
  for (const dir of CLONE_DIRS) {
    const dirPath = path.join(__dirname, dir);
    if (await fs.pathExists(dirPath)) {
      CLONE_DIR = dirPath;
      console.log(`📁 Using clone directory: ${dir}`);
      break;
    }
  }
  
  if (!CLONE_DIR) {
    console.log('❌ No clone directory found!');
    return;
  }
  
  // Create the Formspree contact form HTML customized for Bounder
  const formspreeFormHTML = `
<div class="contact-form-container" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h2 style="text-align: center; margin-bottom: 30px; color: #fff; font-family: futura-pt, proxima-nova, sans-serif; font-weight: 700;">Contact Bounder</h2>
  
  <form 
    action="https://formspree.io/f/YOUR_FORM_ID"
    method="POST"
    id="bounder-contact-form"
    style="display: flex; flex-direction: column; gap: 20px;"
  >
    <!-- Name Fields -->
    <div style="display: flex; gap: 15px;">
      <div style="flex: 1;">
        <label for="fname" style="display: block; margin-bottom: 5px; font-weight: 500; color: #fff; font-family: proxima-nova, sans-serif;">
          First Name <span style="color: #ff6b6b;">*</span>
        </label>
        <input 
          type="text" 
          id="fname"
          name="first_name" 
          required
          style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; font-size: 16px; background: rgba(255,255,255,0.1); color: #fff; font-family: proxima-nova, sans-serif;"
          placeholder="John"
        />
      </div>
      
      <div style="flex: 1;">
        <label for="lname" style="display: block; margin-bottom: 5px; font-weight: 500; color: #fff; font-family: proxima-nova, sans-serif;">
          Last Name <span style="color: #ff6b6b;">*</span>
        </label>
        <input 
          type="text" 
          id="lname"
          name="last_name" 
          required
          style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; font-size: 16px; background: rgba(255,255,255,0.1); color: #fff; font-family: proxima-nova, sans-serif;"
          placeholder="Doe"
        />
      </div>
    </div>
    
    <!-- Email Field -->
    <div>
      <label for="email" style="display: block; margin-bottom: 5px; font-weight: 500; color: #fff; font-family: proxima-nova, sans-serif;">
        Email <span style="color: #ff6b6b;">*</span>
      </label>
      <input 
        type="email" 
        id="email"
        name="email" 
        required
        style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; font-size: 16px; background: rgba(255,255,255,0.1); color: #fff; font-family: proxima-nova, sans-serif;"
        placeholder="john.doe@example.com"
      />
    </div>
    
    <!-- Phone Field -->
    <div>
      <label for="phone" style="display: block; margin-bottom: 5px; font-weight: 500; color: #fff; font-family: proxima-nova, sans-serif;">
        Phone (inc. country code)
      </label>
      <input 
        type="tel" 
        id="phone"
        name="phone"
        style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; font-size: 16px; background: rgba(255,255,255,0.1); color: #fff; font-family: proxima-nova, sans-serif;"
        placeholder="+1 234 567 8900"
      />
    </div>
    
    <!-- Organization Field -->
    <div>
      <label for="organization" style="display: block; margin-bottom: 5px; font-weight: 500; color: #fff; font-family: proxima-nova, sans-serif;">
        Organization
      </label>
      <input 
        type="text" 
        id="organization"
        name="organization"
        style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; font-size: 16px; background: rgba(255,255,255,0.1); color: #fff; font-family: proxima-nova, sans-serif;"
        placeholder="Your company or organization"
      />
    </div>
    
    <!-- Subject Field -->
    <div>
      <label for="subject" style="display: block; margin-bottom: 5px; font-weight: 500; color: #fff; font-family: proxima-nova, sans-serif;">
        Subject
      </label>
      <select 
        id="subject"
        name="subject"
        style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; font-size: 16px; background: rgba(255,255,255,0.1); color: #fff; font-family: proxima-nova, sans-serif;"
      >
        <option value="general" style="background: #333;">General Inquiry</option>
        <option value="drone-safety" style="background: #333;">Drone Safety Information</option>
        <option value="no-fly-zones" style="background: #333;">No-Fly Zone Inquiry</option>
        <option value="technology" style="background: #333;">Technology & Integration</option>
        <option value="partnership" style="background: #333;">Partnership Opportunity</option>
        <option value="media" style="background: #333;">Media Inquiry</option>
        <option value="support" style="background: #333;">Technical Support</option>
        <option value="other" style="background: #333;">Other</option>
      </select>
    </div>
    
    <!-- Message Field -->
    <div>
      <label for="message" style="display: block; margin-bottom: 5px; font-weight: 500; color: #fff; font-family: proxima-nova, sans-serif;">
        Message <span style="color: #ff6b6b;">*</span>
      </label>
      <textarea 
        id="message"
        name="message" 
        rows="6" 
        required
        style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; font-size: 16px; resize: vertical; background: rgba(255,255,255,0.1); color: #fff; font-family: proxima-nova, sans-serif;"
        placeholder="Please tell us how we can help you with drone safety and no-fly zone management..."
      ></textarea>
    </div>
    
    <!-- Honeypot field for spam protection -->
    <input type="text" name="_gotcha" style="display:none" />
    
    <!-- Success redirect -->
    <input type="hidden" name="_next" value="https://www.bounder.io/contact?success=true" />
    
    <!-- Email subject line -->
    <input type="hidden" name="_subject" value="New Contact Form Submission - Bounder.io" />
    
    <!-- Submit Button -->
    <button 
      type="submit"
      style="background: linear-gradient(90deg, #ff6b6b 0%, #ff4444 100%); color: white; padding: 14px 35px; border: none; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-family: futura-pt, proxima-nova, sans-serif; text-transform: uppercase; letter-spacing: 1px;"
      onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 107, 107, 0.4)';"
      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
    >
      Send Message
    </button>
  </form>
  
  <!-- Success Message (hidden by default) -->
  <div id="success-message" style="display: none; background: #4caf50; color: white; padding: 15px; border-radius: 4px; margin-top: 20px; text-align: center; font-family: proxima-nova, sans-serif;">
    <strong>Thank you!</strong> Your message has been sent successfully. We'll get back to you soon about your drone safety inquiry.
  </div>
  
  <!-- Error Message (hidden by default) -->
  <div id="error-message" style="display: none; background: #f44336; color: white; padding: 15px; border-radius: 4px; margin-top: 20px; text-align: center; font-family: proxima-nova, sans-serif;">
    <strong>Oops!</strong> There was an error sending your message. Please try again or email us directly.
  </div>
  
  <script>
    // Check for success parameter in URL
    if (window.location.search.includes('success=true')) {
      document.getElementById('success-message').style.display = 'block';
      document.getElementById('bounder-contact-form').style.display = 'none';
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Form validation and submission handling
    document.getElementById('bounder-contact-form').addEventListener('submit', function(e) {
      // Add loading state to button
      const button = this.querySelector('button[type="submit"]');
      const originalText = button.innerHTML;
      button.innerHTML = 'SENDING...';
      button.disabled = true;
      
      // Re-enable after submission (Formspree handles the actual submission)
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
      }, 2000);
    });
    
    // Style placeholder text
    const style = document.createElement('style');
    style.textContent = \`
      .contact-form-container input::placeholder,
      .contact-form-container textarea::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      
      .contact-form-container option {
        background: #333;
        color: #fff;
      }
    \`;
    document.head.appendChild(style);
  </script>
</div>

<style>
  /* Additional responsive styles */
  @media (max-width: 640px) {
    .contact-form-container {
      padding: 20px 15px !important;
    }
    
    .contact-form-container form > div:first-child {
      flex-direction: column !important;
    }
    
    .contact-form-container input,
    .contact-form-container textarea,
    .contact-form-container select {
      font-size: 14px !important;
    }
  }
  
  /* Focus styles */
  .contact-form-container input:focus,
  .contact-form-container textarea:focus,
  .contact-form-container select:focus {
    outline: none;
    border-color: #ff6b6b !important;
    box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2) !important;
    background: rgba(255,255,255,0.15) !important;
  }
  
  /* Invalid field styles */
  .contact-form-container input:invalid:not(:placeholder-shown),
  .contact-form-container textarea:invalid:not(:placeholder-shown) {
    border-color: #ff4444 !important;
  }
  
  /* Autofill styles */
  .contact-form-container input:-webkit-autofill,
  .contact-form-container input:-webkit-autofill:hover,
  .contact-form-container input:-webkit-autofill:focus,
  .contact-form-container textarea:-webkit-autofill,
  .contact-form-container textarea:-webkit-autofill:hover,
  .contact-form-container textarea:-webkit-autofill:focus,
  .contact-form-container select:-webkit-autofill,
  .contact-form-container select:-webkit-autofill:hover,
  .contact-form-container select:-webkit-autofill:focus {
    -webkit-text-fill-color: #fff;
    -webkit-box-shadow: 0 0 0px 1000px rgba(255,255,255,0.1) inset;
    transition: background-color 5000s ease-in-out 0s;
  }
</style>
`;

  // Process each contact.html file found
  const contactFiles = ['contact.html'];
  
  for (const contactFile of contactFiles) {
    const contactPath = path.join(CLONE_DIR, contactFile);
    
    if (!await fs.pathExists(contactPath)) {
      console.log(`⚠️  ${contactFile} not found, skipping...`);
      continue;
    }
    
    console.log(`\n📄 Processing ${contactFile}...`);
    let html = await fs.readFile(contactPath, 'utf-8');
    const $ = cheerio.load(html, { decodeEntities: false });
    
    // Find and replace the existing form
    // Look for various possible form containers
    const formSelectors = [
      '.form-wrapper',
      '.sqs-block-form',
      '.form-block',
      'form[action*="formsubmit"]',
      'form[action*="squarespace"]',
      '.contact-form',
      '#contact-form',
      '.content form',
      'form'
    ];
    
    let formReplaced = false;
    
    for (const selector of formSelectors) {
      const existingForm = $(selector).first();
      if (existingForm.length > 0) {
        console.log(`  ✅ Found existing form with selector: ${selector}`);
        
        // If it's a form element, replace its parent container
        if (selector === 'form' || selector.includes('form[')) {
          const parent = existingForm.parent();
          if (parent.length > 0) {
            parent.replaceWith(formspreeFormHTML);
          } else {
            existingForm.replaceWith(formspreeFormHTML);
          }
        } else {
          existingForm.replaceWith(formspreeFormHTML);
        }
        
        formReplaced = true;
        console.log('  ✅ Replaced with Formspree form');
        break;
      }
    }
    
    if (!formReplaced) {
      // If no form found, look for the main content area
      const mainContent = $('.content-container, .content, .main-content, #content, main, .site-inner-wrapper').first();
      
      if (mainContent.length > 0) {
        console.log('  ⚠️  No form found, adding to main content area');
        
        // Find any existing content and append after it
        const existingContent = mainContent.find('h1, h2, p').last();
        if (existingContent.length > 0) {
          existingContent.after(formspreeFormHTML);
        } else {
          mainContent.append(formspreeFormHTML);
        }
      } else {
        console.log('  ⚠️  No suitable container found, appending to body');
        $('body').append(formspreeFormHTML);
      }
    }
    
    // Save the updated HTML
    await fs.writeFile(contactPath, $.html());
    console.log(`  💾 Saved updated ${contactFile}`);
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('✅ FORMSPREE CONTACT FORM ADDED TO BOUNDER!\n');
  console.log('⚠️  IMPORTANT: To make the form functional, you need to:');
  console.log('1. Sign up for a free account at https://formspree.io');
  console.log('2. Create a new form for your email address');
  console.log('3. Copy your form ID (looks like "xyzabc123")');
  console.log('4. Replace "YOUR_FORM_ID" in the form action URL');
  console.log('   Current: https://formspree.io/f/YOUR_FORM_ID');
  console.log('   Replace with: https://formspree.io/f/[your-actual-form-id]');
  console.log('\nThe form includes:');
  console.log('  • First Name & Last Name (required)');
  console.log('  • Email (required)');
  console.log('  • Phone (optional)');
  console.log('  • Organization (optional)');
  console.log('  • Subject dropdown (customized for drone safety)');
  console.log('  • Message (required)');
  console.log('  • Spam protection (honeypot)');
  console.log('  • Success/error messages');
  console.log('  • Responsive design');
  console.log('  • Bounder branding and colors');
  console.log('\n📁 Updated directory: ' + path.basename(CLONE_DIR));
}

// Run the script
addFormspreeContactToBounder().catch(console.error);