(function() {
  'use strict';

  function initProgressiveImageLoading() {
    const bannerWrapper = document.querySelector('.banner-thumbnail-wrapper figure');
    const bannerImg = bannerWrapper ? bannerWrapper.querySelector('img') : null;
    
    if (!bannerImg) return;
    
    // Check if this is the banner image
    const currentSrc = bannerImg.src || bannerImg.dataset.src || '';
    const isLocalFile = window.location.protocol === 'file:';
    
    if (currentSrc.includes('SlanaBannerSmaller.jpg') || 
        (bannerImg.dataset.src && bannerImg.dataset.src.includes('SlanaBannerSmaller.jpg'))) {
      
      // For CDN URLs, we'll use the data-src, for local we'll use the src
      const highQualitySrc = bannerImg.dataset.src || bannerImg.src;
      let lowQualitySrc;
      
      // If using CDN URL, construct the low quality URL
      if (highQualitySrc.includes('squarespace-cdn.com')) {
        // For CDN, we can't use our local low-quality image
        // So we'll use format parameter to reduce quality
        lowQualitySrc = highQualitySrc + '?format=100w';
      } else {
        // For local files, use our generated low-quality image
        lowQualitySrc = highQualitySrc.replace(/\.jpg$/, '-lq.jpg');
      }
      
      // First, ensure the image has opacity set
      bannerImg.style.opacity = '0';
      bannerImg.style.transition = 'opacity 0.5s ease-in';
      
      const placeholder = new Image();
      placeholder.className = 'progressive-placeholder';
      placeholder.style.cssText = bannerImg.style.cssText;
      placeholder.style.filter = 'blur(10px)';
      placeholder.style.transform = 'scale(1.05)';
      placeholder.style.transition = 'opacity 0.5s ease-out';
      placeholder.style.opacity = '1';
      
      placeholder.onload = function() {
        bannerWrapper.appendChild(placeholder);
        
        // Now load the high quality image
        const highQualityImg = new Image();
        highQualityImg.onload = function() {
          // Update both src and data-src to ensure compatibility
          bannerImg.src = highQualitySrc;
          if (bannerImg.dataset.src) {
            bannerImg.dataset.src = highQualitySrc;
          }
          bannerImg.style.opacity = '1';
          
          if (bannerWrapper.classList.contains('loading')) {
            bannerWrapper.classList.remove('loading');
          }
          
          setTimeout(function() {
            placeholder.style.opacity = '0';
            setTimeout(function() {
              if (placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
              }
            }, 500);
          }, 100);
        };
        
        highQualityImg.onerror = function() {
          console.error('Failed to load high quality image:', highQualitySrc);
          bannerImg.style.opacity = '1';
          if (placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
          }
        };
        
        highQualityImg.src = highQualitySrc;
      };
      
      placeholder.onerror = function() {
        console.error('Failed to load placeholder:', lowQualitySrc);
        // If placeholder fails, just show the original image
        bannerImg.style.opacity = '1';
        // Ensure original image loads
        if (bannerImg.dataset.src && !bannerImg.src) {
          bannerImg.src = bannerImg.dataset.src;
        }
      };
      
      placeholder.src = lowQualitySrc;
    } else {
      // Not our banner image, ensure it's visible
      bannerImg.style.opacity = '1';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProgressiveImageLoading);
  } else {
    setTimeout(initProgressiveImageLoading, 100);
  }

  if (window.Y) {
    Y.on('domready', function() {
      setTimeout(initProgressiveImageLoading, 500);
    });
  }
})();