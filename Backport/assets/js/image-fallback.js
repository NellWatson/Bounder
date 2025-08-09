(function() {
  'use strict';
  
  // Fallback to ensure banner image loads
  function ensureBannerImageLoads() {
    const bannerImg = document.querySelector('.banner-thumbnail-wrapper figure img');
    
    if (bannerImg) {
      // If there's a data-src but no src, copy it over
      if (bannerImg.dataset.src && !bannerImg.src) {
        bannerImg.src = bannerImg.dataset.src;
      }
      
      // Ensure image is visible
      if (!bannerImg.style.opacity || bannerImg.style.opacity === '0') {
        setTimeout(function() {
          bannerImg.style.opacity = '1';
        }, 1000);
      }
      
      // Add error handler
      bannerImg.onerror = function() {
        console.error('Banner image failed to load:', this.src);
        // Try the CDN URL if local failed
        if (this.dataset.src && this.src !== this.dataset.src) {
          this.src = this.dataset.src;
        }
      };
    }
  }
  
  // Run on multiple events to ensure it catches the image
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureBannerImageLoads);
  } else {
    ensureBannerImageLoads();
  }
  
  // Also run after a delay as a final fallback
  setTimeout(ensureBannerImageLoads, 2000);
})();