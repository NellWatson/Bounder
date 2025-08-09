// Fix lightbox functionality for images
document.addEventListener('DOMContentLoaded', function() {
  
  // Find the lightbox button for the psilocybin image
  const lightboxButtons = document.querySelectorAll('button.lightbox');
  
  lightboxButtons.forEach(button => {
    // Remove any existing click handlers
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add our custom click handler
    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Get the image and data
      const img = newButton.querySelector('img');
      const description = newButton.getAttribute('data-description');
      const theme = newButton.getAttribute('data-lightbox-theme') || 'dark';
      
      // Extract URL from description if it exists
      const urlMatch = description ? description.match(/href="([^"]+)"/) : null;
      const url = urlMatch ? urlMatch[1] : null;
      
      if (img) {
        // Create lightbox overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-lightbox-overlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          cursor: zoom-out;
        `;
        
        // Create image container
        const container = document.createElement('div');
        container.style.cssText = `
          position: relative;
          max-width: 70%;
          max-height: 70%;
          transform: scale(0.9);
          transition: transform 0.3s ease;
        `;
        
        // Clone the image
        const lightboxImg = document.createElement('img');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxImg.style.cssText = `
          max-width: 100%;
          max-height: 70vh;
          display: block;
          margin: 0 auto;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
        `;
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
          position: absolute;
          top: -40px;
          right: -40px;
          width: 40px;
          height: 40px;
          background: transparent;
          border: 2px solid white;
          color: white;
          font-size: 30px;
          line-height: 1;
          cursor: pointer;
          border-radius: 50%;
          transition: all 0.3s ease;
        `;
        closeBtn.onmouseover = function() {
          this.style.background = 'white';
          this.style.color = 'black';
        };
        closeBtn.onmouseout = function() {
          this.style.background = 'transparent';
          this.style.color = 'white';
        };
        
        // Create caption/description
        if (description) {
          const caption = document.createElement('div');
          caption.style.cssText = `
            color: white;
            text-align: center;
            margin-top: 20px;
            padding: 0 20px;
            max-width: 800px;
          `;
          // Parse and set HTML content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = description.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
          caption.innerHTML = tempDiv.innerHTML;
          
          // Make links in caption open in new tab
          const links = caption.querySelectorAll('a');
          links.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            link.style.color = '#4a9eff';
            link.style.textDecoration = 'underline';
          });
          
          container.appendChild(caption);
        }
        
        // Add elements to container
        container.appendChild(lightboxImg);
        container.appendChild(closeBtn);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Animate in
        setTimeout(() => {
          overlay.style.opacity = '1';
          container.style.transform = 'scale(1)';
        }, 10);
        
        // Close functionality
        const closeLightbox = () => {
          overlay.style.opacity = '0';
          container.style.transform = 'scale(0.9)';
          setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
          }, 300);
        };
        
        closeBtn.addEventListener('click', closeLightbox);
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            closeLightbox();
          }
        });
        
        // ESC key to close
        const escHandler = (e) => {
          if (e.key === 'Escape') {
            closeLightbox();
            document.removeEventListener('keydown', escHandler);
          }
        };
        document.addEventListener('keydown', escHandler);
        
      } else if (url) {
        // Fallback: If no image but we have a URL, open it in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  });
  
  // Also handle direct clicks on images that should have lightbox
  const imageFigures = document.querySelectorAll('.image-block-wrapper figure');
  imageFigures.forEach(figure => {
    const img = figure.querySelector('img');
    const caption = figure.closest('.sqs-block-image').querySelector('.image-caption');
    
    if (img && caption && caption.textContent.includes('nature.com')) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Find parent button if it exists
        const parentButton = img.closest('button.lightbox');
        if (parentButton) {
          parentButton.click();
        }
      });
    }
  });
});