// Contact form handler for Slana website
// This enhances the Formspree contact form with better UX

document.addEventListener('DOMContentLoaded', function() {
  // Find the contact form (still has newsletter-form class for compatibility)
  const form = document.querySelector('.newsletter-form');
  if (!form) return;

  // Reset button state on page load (fixes browser back button issue)
  const submitButton = form.querySelector('button[type="submit"]');
  const buttonLabel = submitButton?.querySelector('.newsletter-form-button-label');
  if (buttonLabel && submitButton) {
    buttonLabel.textContent = 'Send Message';
    submitButton.disabled = false;
  }

  // Reset form if we're not showing a success message
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.get('success')) {
    form.reset();
  }

  // Add validation before submission
  form.addEventListener('submit', function(e) {
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[type="email"]');
    const messageInput = form.querySelector('textarea[name="message"]');
    const privacyCheckbox = form.querySelector('input[name="privacy-consent"]');
    const submitButton = form.querySelector('button[type="submit"]');

    // Validate all fields
    if (!nameInput.value.trim()) {
      e.preventDefault();
      showErrorMessage('Please enter your name', nameInput);
      return;
    }

    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      e.preventDefault();
      showErrorMessage('Please enter a valid email address', emailInput);
      return;
    }

    if (!messageInput.value.trim()) {
      e.preventDefault();
      showErrorMessage('Please enter a message', messageInput);
      return;
    }

    if (!privacyCheckbox.checked) {
      e.preventDefault();
      showErrorMessage('Please agree to the privacy policy', privacyCheckbox.parentElement);
      return;
    }

    // Update button text during submission
    const buttonLabel = submitButton.querySelector('.newsletter-form-button-label');
    if (buttonLabel) {
      buttonLabel.textContent = 'Sending...';
      submitButton.disabled = true;
    }
  });

  // Handle Formspree redirect by showing success message
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === 'true' || document.referrer.includes('formspree.io')) {
    // Show success message if we just submitted
    const formBody = form.querySelector('.newsletter-form-body');
    const successDiv = form.querySelector('.form-submission-text');
    
    if (successDiv && formBody) {
      successDiv.textContent = 'Thank you for contacting us! We will get back to you soon.';
      successDiv.style.display = 'block';
      formBody.style.display = 'none';
      
      // Clear the success parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // Helper function to show error messages
  function showErrorMessage(message, nearElement) {
    // Remove any existing error messages
    const existingErrors = form.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      background-color: #f44336;
      color: white;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
      margin: 10px 0;
      font-weight: 500;
      font-size: 0.9em;
    `;

    // Insert error message after the field that has the error
    if (nearElement) {
      nearElement.parentElement.appendChild(errorDiv);
    }

    // Remove error message after 3 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);

    // Focus on the field with error
    if (nearElement && nearElement.focus) {
      nearElement.focus();
    }
  }

  // Add CSS for styling
  const style = document.createElement('style');
  style.textContent = `
    .form-submission-text {
      background-color: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 4px;
      text-align: center;
      margin: 10px 0;
      font-weight: 500;
    }
    
    .newsletter-form button[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .newsletter-form textarea {
      font-family: inherit;
      font-size: inherit;
      padding: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      width: 100%;
      box-sizing: border-box;
    }
    
    .newsletter-form input[type="checkbox"] {
      cursor: pointer;
    }
    
    .newsletter-form .form-item.checkbox label {
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
});

// Handle browser back button - reset form state
window.addEventListener('pageshow', function(event) {
  // Reset button state when page is shown (including back button navigation)
  const form = document.querySelector('.newsletter-form');
  if (!form) return;
  
  const submitButton = form.querySelector('button[type="submit"]');
  const buttonLabel = submitButton?.querySelector('.newsletter-form-button-label');
  
  if (buttonLabel && submitButton) {
    buttonLabel.textContent = 'Send Message';
    submitButton.disabled = false;
  }
  
  // If page was loaded from cache (back button), reset the form
  if (event.persisted) {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('success')) {
      form.reset();
    }
  }
});