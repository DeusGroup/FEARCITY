// Fear City Cycles - Contact Page JavaScript

// EmailJS Configuration
const EMAILJS_CONFIG = {
    SERVICE_ID: 'fear_city_service', // Replace with your actual service ID
    TEMPLATE_IDS: {
        custom: 'template_custom_build',
        gear: 'template_gear_inquiry',
        press: 'template_press_request',
        general: 'template_general_contact'
    },
    PUBLIC_KEY: import.meta?.env?.VITE_EMAILJS_PUBLIC_KEY || '' // Loaded from environment
};

document.addEventListener('DOMContentLoaded', function() {
    // Inquiry form switching
    const inquiryButtons = document.querySelectorAll('.inquiry-btn');
    const contactForms = document.querySelectorAll('.contact-form');

    inquiryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const formType = this.dataset.form;

            // Update button states
            inquiryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Update form visibility
            contactForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === formType + '-form') {
                    form.classList.add('active');
                }
            });
        });
    });

    // Form submissions
    contactForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            if (validateContactForm(this)) {
                submitContactForm(this);
            }
        });
    });
});

function submitContactForm(form) {
    const formData = new FormData(form);
    const formType = form.id.replace('-form', '');

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'SENDING...';
    submitBtn.disabled = true;

    // Prepare email parameters from form data
    const emailParams = {
        form_type: formType.toUpperCase(),
        timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
        // Common fields
        name: formData.get('name') || 'Not provided',
        email: formData.get('email') || 'Not provided',
        phone: formData.get('phone') || 'Not provided',
        message: formData.get('message') || 'Not provided',
        // Custom build specific fields
        build_type: formData.get('build-type') || 'Not specified',
        budget: formData.get('budget') || 'Not specified',
        // Gear inquiry specific fields
        product: formData.get('product') || 'Not specified',
        size: formData.get('size') || 'Not specified',
        // Press specific fields
        organization: formData.get('organization') || 'Not specified',
        deadline: formData.get('deadline') || 'Not specified',
        // Add reply_to for convenience
        reply_to: formData.get('email') || 'noreply@fearcitycycles.com'
    };

    // Use EmailJS to send the email
    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY') {
        // Real EmailJS implementation
        emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_IDS[formType] || EMAILJS_CONFIG.TEMPLATE_IDS.general,
            emailParams
        ).then(
            function(response) {
                console.log('EmailJS Success:', response.status, response.text);
                // Reset form
                form.reset();
                // Show success message
                showSuccessMessage(getSuccessMessage(formType));
                // Track successful submission
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        'event_category': 'Contact',
                        'event_label': formType,
                        'value': 1
                    });
                }
            },
            function(error) {
                console.error('EmailJS Error:', error);
                showErrorMessage('Failed to send message. Please try again or email us directly at info@fearcitycycles.com');
            }
        ).finally(() => {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    } else {
        // Fallback for development/demo (EmailJS not configured)
        console.warn('EmailJS not configured. Using demo mode.');
        console.log('Form submission:', emailParams);
        
        // Simulate API call for demo
        setTimeout(() => {
            // Reset form
            form.reset();
            // Show success message
            showSuccessMessage(getSuccessMessage(formType));
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }
}

function getSuccessMessage(formType) {
    const messages = {
        'custom': 'Your custom build consultation has been submitted. We\'ll be in touch within 24 hours to discuss your vision.',
        'gear': 'Your gear inquiry has been received. We\'ll respond shortly with the information you need.',
        'press': 'Your press request has been submitted. We\'ll review and respond to legitimate media inquiries.',
        'general': 'Your message has been received. Thanks for reaching out to Fear City Cycles.'
    };

    return messages[formType] || messages['general'];
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>MESSAGE SENT</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">CLOSE</button>
        </div>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;

    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        background: #000;
        border: 2px solid #8B0000;
        padding: 40px;
        text-align: center;
        max-width: 500px;
        margin: 20px;
    `;

    document.body.appendChild(notification);
}

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>ERROR</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">CLOSE</button>
        </div>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;

    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        background: #000;
        border: 2px solid #ff0000;
        padding: 40px;
        text-align: center;
        max-width: 500px;
        margin: 20px;
        color: #ff0000;
    `;

    document.body.appendChild(notification);
}