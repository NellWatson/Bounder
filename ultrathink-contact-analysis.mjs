import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ultrathinkContactAnalysis() {
  console.log('🔬 ULTRATHINK: CONTACT PAGE & NAVIGATION ANALYSIS\n');
  console.log('='.repeat(80));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    // 1. Analyze ORIGINAL contact page
    console.log('\n📊 ANALYZING ORIGINAL BOUNDER.IO CONTACT PAGE...\n');
    const originalPage = await browser.newPage();
    await originalPage.goto('https://www.bounder.io/contact', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    // Wait for content to load
    await originalPage.waitForSelector('main, .site-wrapper', { timeout: 30000 });
    
    // Capture contact page structure
    const originalContact = await originalPage.evaluate(() => {
      const results = {
        navigation: [],
        pageTitle: '',
        pageLayout: {},
        formStructure: {},
        styling: {}
      };
      
      // Check navigation for Contact link
      const navLinks = document.querySelectorAll('header a, nav a, .header-nav a');
      navLinks.forEach(link => {
        const text = link.textContent.trim();
        const href = link.getAttribute('href');
        if (text || href) {
          results.navigation.push({
            text: text,
            href: href,
            isContact: text.toLowerCase().includes('contact') || (href && href.includes('contact'))
          });
        }
      });
      
      // Get page title/heading
      const heading = document.querySelector('h1, .page-title, .content h1');
      results.pageTitle = heading ? heading.textContent.trim() : '';
      
      // Analyze page layout
      const mainContent = document.querySelector('main, .content-wrapper, .site-inner');
      if (mainContent) {
        const rect = mainContent.getBoundingClientRect();
        results.pageLayout = {
          width: rect.width,
          padding: window.getComputedStyle(mainContent).padding,
          maxWidth: window.getComputedStyle(mainContent).maxWidth,
          margin: window.getComputedStyle(mainContent).margin
        };
      }
      
      // Analyze form structure
      const form = document.querySelector('form');
      if (form) {
        const formRect = form.getBoundingClientRect();
        const formStyle = window.getComputedStyle(form);
        
        results.formStructure = {
          exists: true,
          action: form.action,
          method: form.method,
          width: formRect.width,
          fields: [],
          styling: {
            padding: formStyle.padding,
            margin: formStyle.margin,
            backgroundColor: formStyle.backgroundColor,
            borderRadius: formStyle.borderRadius
          }
        };
        
        // Get all form fields
        const fields = form.querySelectorAll('input, textarea, select');
        fields.forEach(field => {
          const label = form.querySelector(`label[for="${field.id}"]`) || 
                       field.closest('label') ||
                       field.previousElementSibling;
          
          results.formStructure.fields.push({
            type: field.type || field.tagName.toLowerCase(),
            name: field.name,
            placeholder: field.placeholder,
            required: field.required,
            label: label ? label.textContent.trim() : '',
            className: field.className
          });
        });
      }
      
      // Get overall page styling
      const body = document.body;
      const bodyStyle = window.getComputedStyle(body);
      results.styling = {
        backgroundColor: bodyStyle.backgroundColor,
        fontFamily: bodyStyle.fontFamily,
        fontSize: bodyStyle.fontSize,
        color: bodyStyle.color
      };
      
      return results;
    });
    
    console.log('Original Contact Page Structure:');
    console.log(JSON.stringify(originalContact, null, 2));
    
    // Take screenshot of original
    await originalPage.screenshot({ 
      path: path.join(__dirname, 'original-contact-page.png'),
      fullPage: true
    });
    console.log('\n✅ Captured original contact page screenshot');
    
    // 2. Analyze CLONED contact page
    console.log('\n📊 ANALYZING CLONED CONTACT PAGE...\n');
    const clonedPage = await browser.newPage();
    await clonedPage.goto('https://nellinc.github.io/Bounder/contact.html', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    // Check current state
    const clonedContact = await clonedPage.evaluate(() => {
      const results = {
        navigation: [],
        hasContactLink: false,
        formExists: false,
        formFields: []
      };
      
      // Check navigation
      const navLinks = document.querySelectorAll('header a, nav a, .header-nav a, .main-nav a');
      navLinks.forEach(link => {
        const text = link.textContent.trim();
        const href = link.getAttribute('href');
        if (text.toLowerCase().includes('contact') || (href && href.includes('contact'))) {
          results.hasContactLink = true;
        }
        if (text) {
          results.navigation.push(text);
        }
      });
      
      // Check form
      const form = document.querySelector('form');
      if (form) {
        results.formExists = true;
        const fields = form.querySelectorAll('input, textarea, select');
        fields.forEach(field => {
          results.formFields.push({
            type: field.type || field.tagName.toLowerCase(),
            name: field.name,
            placeholder: field.placeholder
          });
        });
      }
      
      return results;
    });
    
    console.log('\nCloned Contact Page State:');
    console.log(JSON.stringify(clonedContact, null, 2));
    
    // Take screenshot of cloned
    await clonedPage.screenshot({ 
      path: path.join(__dirname, 'cloned-contact-page.png'),
      fullPage: true
    });
    console.log('✅ Captured cloned contact page screenshot');
    
    // Save analysis
    await fs.writeFile(
      path.join(__dirname, 'contact-analysis.json'),
      JSON.stringify({ original: originalContact, cloned: clonedContact }, null, 2)
    );
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS COMPLETE!');
    console.log('\nKey findings:');
    console.log(`  • Original has Contact in nav: ${originalContact.navigation.some(n => n.isContact)}`);
    console.log(`  • Cloned has Contact in nav: ${clonedContact.hasContactLink}`);
    console.log(`  • Original form fields: ${originalContact.formStructure.fields?.length || 0}`);
    console.log(`  • Cloned form fields: ${clonedContact.formFields.length}`);
    
  } finally {
    await browser.close();
  }
}

ultrathinkContactAnalysis().catch(console.error);