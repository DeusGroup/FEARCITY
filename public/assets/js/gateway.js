// Fear City Cycles - Gateway JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Add entrance animation
    const container = document.querySelector('.gateway-container');
    container.style.opacity = '0';
    container.style.transform = 'scale(0.9)';

    setTimeout(() => {
        container.style.transition = 'all 1s ease';
        container.style.opacity = '1';
        container.style.transform = 'scale(1)';
    }, 100);

    // Add sound effect simulation (visual feedback)
    const enterButton = document.querySelector('.enter-button');
    enterButton.addEventListener('mouseenter', function() {
        this.style.animation = 'pulse 0.5s ease';
    });

    enterButton.addEventListener('animationend', function() {
        this.style.animation = '';
    });
});

function enterSite() {
    // Add dramatic exit effect
    const container = document.querySelector('.gateway-container');
    const audio = new Audio(); // Placeholder for sound effect

    // Visual transition effect
    container.style.transition = 'all 0.8s ease';
    container.style.transform = 'scale(1.1)';
    container.style.opacity = '0';

    // Redirect to main site after animation
    setTimeout(() => {
        window.location.href = 'main.html';
    }, 800);
}

// Add keyboard support
document.addEventListener('keydown', function(event) {
    if (event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        enterSite();
    }
});

// Add dramatic lighting effect
function createLightningEffect() {
    const overlay = document.querySelector('.background-overlay');
    overlay.style.transition = 'opacity 0.1s ease';
    overlay.style.opacity = '0.8';

    setTimeout(() => {
        overlay.style.opacity = '0.3';
    }, 100);
}

// Random lightning effects
setInterval(() => {
    if (Math.random() < 0.1) { // 10% chance every interval
        createLightningEffect();
    }
}, 5000);