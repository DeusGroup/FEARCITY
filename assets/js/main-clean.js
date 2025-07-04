// Fear City Cycles - Clean Main JavaScript (No Cart Conflicts)
// This file replaces the problematic main.js to resolve cart variable conflicts

console.log('Clean main.js loaded - no cart conflicts');

// Simple mobile menu functionality only
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    console.log('Mobile menu and smooth scrolling initialized');
});

// Toast notification function
function showToast(message, duration = 3000) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #000;
        color: white;
        padding: 15px 25px;
        border: 2px solid #8B0000;
        border-radius: 4px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

// Make toast function globally available
window.showToast = showToast;

console.log('Clean main.js initialization complete');