// Fear City Cycles - Contact Page JavaScript

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

    // Simulate API call
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