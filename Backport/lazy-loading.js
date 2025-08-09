// Lazy loading for images and sections
document.addEventListener('DOMContentLoaded', function() {
  
  // Configuration
  const rootMargin = '50px 0px'; // Start loading 50px before element comes into view
  const threshold = 0.01; // Trigger when 1% of element is visible

  // Lazy load images
  function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src], img[src*="squarespace-cdn.com"]:not(.lazy-loaded)');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // If image has data-src, use that
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // Add class to mark as loaded
          img.classList.add('lazy-loaded');
          
          // Stop observing this image
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: rootMargin,
      threshold: threshold
    });

    images.forEach(img => {
      // Skip logo and header images from lazy loading
      if (img.closest('#logoImage, #header') || img.src.includes('slana-logo')) {
        img.classList.add('lazy-loaded'); // Mark as loaded immediately
        return;
      }
      
      // For images that already have src, store it in data-src and use placeholder
      if (!img.dataset.src && img.src && !img.classList.contains('lazy-loaded')) {
        img.dataset.src = img.src;
        // Use a tiny transparent placeholder
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
      }
      imageObserver.observe(img);
    });
  }

  // Lazy load sections
  function lazyLoadSections() {
    const sections = document.querySelectorAll('.sqs-block:not(.lazy-loaded), .summary-item:not(.lazy-loaded)');
    
    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = entry.target;
          
          // Add animation class
          section.classList.add('lazy-loaded', 'fade-in');
          
          // Load any images within this section
          const sectionImages = section.querySelectorAll('img[data-src]');
          sectionImages.forEach(img => {
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
          });
          
          // Stop observing this section
          observer.unobserve(section);
        }
      });
    }, {
      rootMargin: rootMargin,
      threshold: threshold
    });

    sections.forEach(section => {
      // Initially hide sections
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
      sectionObserver.observe(section);
    });
  }

  // Ensure all external links open in new tabs
  function setTargetBlank() {
    const links = document.querySelectorAll('a[href^="http"]:not([target="_blank"])');
    links.forEach(link => {
      // Check if it's an external link (not the current domain)
      if (link.hostname !== window.location.hostname) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  // CSS for fade-in animation
  const style = document.createElement('style');
  style.textContent = `
    .lazy-loaded {
      opacity: 1 !important;
      transform: translateY(0) !important;
      transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    }
    
    img.lazy-loaded {
      animation: fadeIn 0.5s ease-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    /* Placeholder styling - exclude logo and header images */
    img:not(.lazy-loaded):not(#logoImage img):not(#header img) {
      background-color: #f0f0f0;
      min-height: 100px;
    }
  `;
  document.head.appendChild(style);

  // Initialize
  lazyLoadImages();
  lazyLoadSections();
  setTargetBlank();

  // Re-run on dynamic content changes
  const contentObserver = new MutationObserver(() => {
    lazyLoadImages();
    lazyLoadSections();
    setTargetBlank();
  });

  contentObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
});