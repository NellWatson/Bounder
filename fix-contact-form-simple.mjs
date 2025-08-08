#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('📝 Simplifying contact form to Name, Email, Message with privacy checkbox...');

const filePath = join(process.cwd(), 'contact.html');

try {
  let content = readFileSync(filePath, 'utf-8');
  
  // Find and replace the form section
  const formPattern = /<form[^>]*id="contact-form"[^>]*>[\s\S]*?<\/form>/gi;
  
  const newForm = `<form action="https://formspree.io/f/xqalyykn" method="POST" id="contact-form">
      <div class="form-field">
        <label for="name">Name <span class="required">*</span></label>
        <input type="text" id="name" name="name" required />
      </div>
      
      <div class="form-field">
        <label for="email">Email <span class="required">*</span></label>
        <input type="email" id="email" name="email" required />
      </div>
      
      <div class="form-field">
        <label for="message">Message <span class="required">*</span></label>
        <textarea id="message" name="message" rows="6" required></textarea>
      </div>
      
      <div class="form-field checkbox-field">
        <label class="checkbox-label">
          <input type="checkbox" name="privacy_consent" required />
          <span>I agree to the <a href="/privacy.html" target="_blank">Privacy Policy</a> and <a href="/terms.html" target="_blank">Terms & Conditions</a> <span class="required">*</span></span>
        </label>
      </div>
      
      <!-- Honeypot for spam protection -->
      <input type="text" name="_gotcha" style="display:none" />
      <input type="hidden" name="_next" value="https://nellinc.github.io/Bounder/contact.html?success=true" />
      <input type="hidden" name="_subject" value="New Contact Form Submission - Bounder" />
      
      <button type="submit" class="submit-button">Send Message</button>
    </form>`;
  
  content = content.replace(formPattern, newForm);
  
  // Update or add the CSS for the form
  const formStyles = `
    <style>
      .form-container {
        max-width: 600px;
        margin: 60px auto;
        padding: 0 20px;
      }
      
      #contact-form {
        background: #fff;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .form-field {
        margin-bottom: 25px;
      }
      
      .form-field label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .form-field input[type="text"],
      .form-field input[type="email"],
      .form-field textarea {
        width: 100%;
        padding: 12px 15px;
        border: 2px solid #e0e0e0;
        border-radius: 4px;
        font-size: 16px;
        font-family: inherit;
        transition: border-color 0.3s ease;
        box-sizing: border-box;
      }
      
      .form-field input:focus,
      .form-field textarea:focus {
        outline: none;
        border-color: #ff6b6b;
      }
      
      .form-field textarea {
        resize: vertical;
        min-height: 120px;
      }
      
      .checkbox-field {
        margin: 30px 0;
      }
      
      .checkbox-label {
        display: flex;
        align-items: flex-start;
        cursor: pointer;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .checkbox-label input[type="checkbox"] {
        margin-right: 10px;
        margin-top: 2px;
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      
      .checkbox-label a {
        color: #ff6b6b;
        text-decoration: underline;
      }
      
      .checkbox-label a:hover {
        color: #ff4444;
      }
      
      .required {
        color: #ff6b6b;
        font-weight: bold;
      }
      
      .submit-button {
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 15px 40px;
        font-size: 16px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.3s ease;
        width: 100%;
      }
      
      .submit-button:hover {
        background: #ff4444;
      }
      
      .submit-button:active {
        transform: translateY(1px);
      }
      
      /* Success message */
      .success-message {
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 20px;
        text-align: center;
        display: none;
      }
      
      .success-message.show {
        display: block;
      }
      
      @media (max-width: 768px) {
        #contact-form {
          padding: 30px 20px;
        }
        
        .form-field label {
          font-size: 13px;
        }
        
        .submit-button {
          padding: 12px 30px;
          font-size: 14px;
        }
      }
    </style>`;
  
  // Add styles if not present or update existing ones
  if (!content.includes('.form-field')) {
    content = content.replace('</head>', formStyles + '\n</head>');
  }
  
  // Add success message handler
  if (!content.includes('success-message')) {
    const successScript = `
    <script>
      // Check for success parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        // Add success message
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
          const successDiv = document.createElement('div');
          successDiv.className = 'success-message show';
          successDiv.textContent = 'Thank you! Your message has been sent successfully.';
          formContainer.insertBefore(successDiv, formContainer.firstChild);
          
          // Scroll to top
          window.scrollTo(0, 0);
          
          // Remove success parameter from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    </script>`;
    
    content = content.replace('</body>', successScript + '\n</body>');
  }
  
  writeFileSync(filePath, content);
  console.log('✅ Contact form updated successfully!');
  console.log('📋 Form now has:');
  console.log('   - Name field (required)');
  console.log('   - Email field (required)');
  console.log('   - Message field (required)');
  console.log('   - Privacy & Terms checkbox (required)');
  console.log('   - Spam protection (honeypot)');
  console.log('   - Success message handling');
  
} catch (error) {
  console.log('⚠️  Error:', error.message);
}

console.log('\n✨ Contact form simplified and ready!');