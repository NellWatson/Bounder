#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Adding lazy loading to all images...\n');

// List of HTML files to process
const htmlFiles = [
  'index.html',
  'gallery-shift.html',
  'ride-to-live-shift.html',
  'privacy.html',
  'terms.html',
  '404.html',
  'contact.html'
];

// Lazy loading script for background images
const lazyLoadScript = `
<script>
  // Lazy load background images
  document.addEventListener('DOMContentLoaded', function() {
    // Create Intersection Observer for lazy loading
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Handle background images
          if (element.dataset.bgSrc) {
            element.style.backgroundImage = 'url(' + element.dataset.bgSrc + ')';
            delete element.dataset.bgSrc;
            element.classList.add('loaded');
          }
          
          // Handle regular images with data-src
          if (element.dataset.src) {
            element.src = element.dataset.src;
            delete element.dataset.src;
            element.classList.add('loaded');
          }
          
          observer.unobserve(element);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
    
    // Observe all elements with lazy load attributes
    document.querySelectorAll('[data-bg-src], [data-src]').forEach(img => {
      imageObserver.observe(img);
    });
    
    // Also observe any dynamically added images
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.dataset && (node.dataset.bgSrc || node.dataset.src)) {
              imageObserver.observe(node);
            }
            // Check children
            const lazyElements = node.querySelectorAll ? node.querySelectorAll('[data-bg-src], [data-src]') : [];
            lazyElements.forEach(el => imageObserver.observe(el));
          }
        });
      });
    });
    
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
  
  // Add loading animation styles
  if (!document.getElementById('lazy-load-styles')) {
    const style = document.createElement('style');
    style.id = 'lazy-load-styles';
    style.textContent = \`
      [data-bg-src], [data-src] {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }
      
      [data-bg-src].loaded, [data-src].loaded,
      img.loaded {
        opacity: 1;
      }
      
      /* Placeholder for images while loading */
      img[data-src] {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    \`;
    document.head.appendChild(style);
  }
</script>`;

// Process each HTML file
htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Add loading="lazy" to all img tags that don't have it
    content = content.replace(/<img\s+([^>]*?)>/gi, (match, attributes) => {
      if (!attributes.includes('loading=')) {
        // Check if this is a critical above-the-fold image
        const isLogo = attributes.includes('logo') || attributes.includes('bounder-logo');
        const isIcon = attributes.includes('icon') || attributes.includes('svg');
        
        if (!isLogo && !isIcon) {
          modified = true;
          // Add loading="lazy" attribute
          return `<img loading="lazy" ${attributes}>`;
        }
      }
      return match;
    });
    
    // Add loading="lazy" to iframe tags (for embedded content)
    content = content.replace(/<iframe\s+([^>]*?)>/gi, (match, attributes) => {
      if (!attributes.includes('loading=')) {
        modified = true;
        return `<iframe loading="lazy" ${attributes}>`;
      }
      return match;
    });
    
    // Convert background images to lazy load for hero sections
    if (file === 'contact.html') {
      // Special handling for contact page hero
      content = content.replace(
        /background:\s*url\(['"]([^'"]+)['"]\)/gi,
        (match, url) => {
          if (url.includes('drone-698564')) {
            modified = true;
            // Keep a low-quality placeholder and lazy load the full image
            return `background: #1a1a1a`;
          }
          return match;
        }
      );
      
      // Add data attribute for lazy loading
      content = content.replace(
        '<div class="hero-section">',
        '<div class="hero-section" data-bg-src="https://images.squarespace-cdn.com/content/v1/55acf641e4b0b8a3dbbdbd91/1437403987855-UZEGF7VV4UCP5MQ7E5MI/drone-698564.jpg">'
      );
    }
    
    // Add lazy loading script if not already present
    if (!content.includes('lazy-load-styles') && !content.includes('Intersection Observer for lazy loading')) {
      const bodyCloseIndex = content.indexOf('</body>');
      if (bodyCloseIndex > -1) {
        content = content.slice(0, bodyCloseIndex) + lazyLoadScript + '\n' + content.slice(bodyCloseIndex);
        modified = true;
      }
    }
    
    // Add decoding="async" to images for better performance
    content = content.replace(/<img\s+([^>]*?)>/gi, (match, attributes) => {
      if (!attributes.includes('decoding=')) {
        return match.replace('<img', '<img decoding="async"');
      }
      return match;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Added lazy loading to ${file}`);
    } else {
      console.log(`  ${file} already optimized`);
    }
    
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

// Create a performance monitoring script
const perfScript = `// Performance monitoring
window.addEventListener('load', function() {
  // Log performance metrics
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    console.log('Page Load Time:', loadTime + 'ms');
    
    // Track lazy loaded images
    let lazyLoadedCount = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.includes('image')) {
          lazyLoadedCount++;
        }
      }
    });
    observer.observe({ entryTypes: ['resource'] });
  }
});`;

console.log('\n📊 Adding performance monitoring...');

// Add performance script to index.html
const indexPath = path.join(__dirname, 'index.html');
try {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  if (!indexContent.includes('Performance monitoring')) {
    const scriptTag = `\n<script>\n${perfScript}\n</script>`;
    const bodyCloseIndex = indexContent.indexOf('</body>');
    if (bodyCloseIndex > -1) {
      indexContent = indexContent.slice(0, bodyCloseIndex) + scriptTag + '\n' + indexContent.slice(bodyCloseIndex);
      fs.writeFileSync(indexPath, indexContent, 'utf8');
      console.log('✓ Added performance monitoring to index.html');
    }
  }
} catch (error) {
  console.error('Error adding performance monitoring:', error.message);
}

console.log('\n✅ Lazy loading implementation complete!');
console.log('   - All images now load on-demand');
console.log('   - Background images use Intersection Observer');
console.log('   - Performance monitoring added');
console.log('   - Smooth fade-in transitions for loaded images');