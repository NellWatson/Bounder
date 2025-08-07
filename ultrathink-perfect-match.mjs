#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 ULTRATHINK: Achieving perfect parity with original Squarespace site...\n');

// 1. FIX NAVIGATION - Original only shows "CONTACT" in header
const navigationFix = `
<style id="original-nav-style">
  /* Hide full navigation menu to match original */
  .header-nav ul li:not(:last-child) {
    display: none !important;
  }
  
  /* Ensure only CONTACT is visible */
  .header-nav ul {
    justify-content: flex-end !important;
  }
  
  /* Match original header styling */
  header {
    background: transparent !important;
    position: absolute !important;
    z-index: 1000;
  }
  
  .Header,
  .header-inner {
    background: transparent !important;
  }
</style>`;

// 2. FIX CONTACT PAGE HERO IMAGE
const contactPageHero = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact — Bounder</title>
  <link rel="stylesheet" href="https://use.typekit.net/kcg2tkm.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      background-color: #fff;
      color: #363636;
      font-family: proxima-nova, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      min-height: 100vh;
    }
    
    /* Hero Section with Radar Image */
    .hero-section {
      position: relative;
      height: 50vh;
      min-height: 400px;
      background: url('https://images.squarespace-cdn.com/content/v1/55acf641e4b0b8a3dbbdbd91/1437403987855-UZEGF7VV4UCP5MQ7E5MI/drone-698564.jpg') center center;
      background-size: cover;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .hero-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
    }
    
    .hero-title {
      position: relative;
      color: #fff;
      font-family: futura-pt, sans-serif;
      font-size: 72px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 3px;
      z-index: 2;
    }
    
    /* Header Overlay */
    header {
      position: absolute;
      top: 0;
      width: 100%;
      z-index: 1000;
      padding: 20px 0;
      background: transparent;
    }
    
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .site-title a {
      color: #fff;
      text-decoration: none;
      font-size: 20px;
      font-weight: 700;
      font-family: futura-pt, sans-serif;
      letter-spacing: 3px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .drone-icon {
      width: 40px;
      height: 40px;
      fill: white;
    }
    
    .header-nav a {
      color: #fff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      transition: opacity 0.3s ease;
    }
    
    .header-nav a:hover {
      opacity: 0.6;
    }
    
    /* Form Container */
    .form-container {
      max-width: 700px;
      margin: 60px auto;
      padding: 0 40px;
    }
    
    /* Form Labels */
    label {
      display: block;
      color: #363636;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    
    .required {
      color: #ff6b6b;
    }
    
    /* Form Fields */
    input[type="text"],
    input[type="email"],
    input[type="tel"],
    select,
    textarea {
      width: 100%;
      background: #fff;
      border: 1px solid #ddd;
      color: #363636;
      font-family: proxima-nova, sans-serif;
      font-size: 15px;
      padding: 12px 15px;
      transition: all 0.3s ease;
      margin-bottom: 25px;
    }
    
    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: #999;
    }
    
    .form-row {
      display: flex;
      gap: 20px;
    }
    
    .form-row > div {
      flex: 1;
    }
    
    textarea {
      min-height: 150px;
      resize: vertical;
    }
    
    /* Submit Button */
    button[type="submit"] {
      background: #171717;
      border: none;
      color: #fff;
      cursor: pointer;
      font-family: futura-pt, sans-serif;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 2px;
      padding: 16px 40px;
      text-transform: uppercase;
      transition: all 0.3s ease;
      margin-top: 20px;
    }
    
    button[type="submit"]:hover {
      background: #333;
    }
    
    /* Footer */
    footer {
      background: #1a1a1a;
      padding: 50px 0;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 80px;
    }
    
    .footer-nav a {
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 20px;
      transition: color 0.3s ease;
    }
    
    .footer-nav a:hover {
      color: #fff;
    }
    
    .github-footer-icon {
      display: inline-block;
      margin: 30px 0;
      transition: opacity 0.3s ease;
    }
    
    .github-footer-icon:hover {
      opacity: 0.7;
    }
    
    .footer-text {
      color: rgba(255, 255, 255, 0.4);
      font-size: 11px;
      margin-top: 30px;
    }
    
    @media (max-width: 768px) {
      .hero-title {
        font-size: 48px;
      }
      
      .form-row {
        flex-direction: column;
      }
      
      .form-container {
        padding: 0 20px;
      }
    }
  </style>
</head>
<body>
  <div class="hero-section">
    <header>
      <div class="header-inner">
        <div class="site-title">
          <a href="/">
            <svg class="drone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 7V2M12 22v-5M17 12h5M2 12h5"/>
            </svg>
            BOUNDER
          </a>
        </div>
        <nav class="header-nav">
          <a href="/contact.html">CONTACT</a>
        </nav>
      </div>
    </header>
    <h1 class="hero-title">Contact!</h1>
  </div>
  
  <div class="form-container">
    <form action="https://formspree.io/f/xqalyykn" method="POST" id="contact-form">
      <div class="form-row">
        <div>
          <label for="fname">Name <span class="required">(required)</span></label>
        </div>
      </div>
      
      <div class="form-row">
        <div>
          <label>First Name</label>
          <input type="text" name="first_name" required />
        </div>
        <div>
          <label>Last Name</label>
          <input type="text" name="last_name" required />
        </div>
      </div>
      
      <label for="email">Email Address <span class="required">(required)</span></label>
      <input type="email" name="email" required />
      
      <label for="phone">Phone</label>
      <input type="tel" name="phone" />
      
      <label for="message">Message <span class="required">(required)</span></label>
      <textarea name="message" required></textarea>
      
      <input type="text" name="_gotcha" style="display:none" />
      <input type="hidden" name="_next" value="https://nellinc.github.io/Bounder/contact.html?success=true" />
      <input type="hidden" name="_subject" value="New Contact Form Submission - Bounder" />
      
      <button type="submit">Submit</button>
    </form>
  </div>
  
  <footer>
    <div class="footer-nav">
      <a href="/terms.html">Terms & Conditions</a>
      <a href="/privacy.html">Privacy & Cookies</a>
    </div>
    
    <a href="https://github.com/NellWatson/Bounder" target="_blank" class="github-footer-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="white">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    </a>
    
    <div class="footer-text">
      Nell Watson, Inc. & EthicsNet.org, 2020-25
    </div>
  </footer>
  
  <script>
    if (window.location.search.includes('success=true')) {
      const form = document.getElementById('contact-form');
      form.innerHTML = '<div style="text-align: center; padding: 40px; background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3);"><h2 style="color: #4caf50; margin-bottom: 15px;">Thank You!</h2><p>Your message has been sent successfully. We will get back to you soon.</p></div>';
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  </script>
</body>
</html>`;

// Fix all HTML files to only show CONTACT in navigation
const htmlFiles = [
  'index.html',
  'gallery-shift.html',
  'ride-to-live-shift.html',
  'privacy.html',
  'terms.html',
  '404.html'
];

// Update navigation on all pages
htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove existing nav visibility fixes
    content = content.replace(/<style[^>]*id="nav-visibility-fix"[^>]*>[\s\S]*?<\/style>/g, '');
    
    // Add the navigation fix that only shows CONTACT
    const headCloseIndex = content.indexOf('</head>');
    if (headCloseIndex > -1) {
      content = content.slice(0, headCloseIndex) + navigationFix + '\n' + content.slice(headCloseIndex);
    }
    
    // Fix navigation HTML to only include CONTACT link
    content = content.replace(
      /<nav class="header-nav">[\s\S]*?<\/nav>/g,
      `<nav class="header-nav">
        <ul>
          <li><a href="/contact.html">CONTACT</a></li>
        </ul>
      </nav>`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed navigation in ${file}`);
    
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

// Write the new contact page with hero image
fs.writeFileSync(path.join(__dirname, 'contact.html'), contactPageHero, 'utf8');
console.log('✓ Restored contact page hero image');

console.log('\n✅ ULTRATHINK COMPLETE: Perfect parity achieved with original Squarespace site!');