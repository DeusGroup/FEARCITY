// Fear City Cycles - v0.1.2 JavaScript
// Basic interactions and functionality

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for internal links
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Enhanced CTA button interactions
    const ctaButtons = document.querySelectorAll('.cta-btn, .view-btn, .enter-btn');
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Product card hover effects
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 10px 20px rgba(139, 0, 0, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });
    
    // Basic shopping cart functionality
    let cart = JSON.parse(localStorage.getItem('fearCityCart')) || [];
    
    function updateCartCount() {
        const cartLink = document.querySelector('.cart');
        if (cartLink) {
            const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
            cartLink.textContent = `Cart (${itemCount})`;
        }
    }
    
    function addToCart(productId, productName, price) {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: price,
                quantity: 1
            });
        }
        
        localStorage.setItem('fearCityCart', JSON.stringify(cart));
        updateCartCount();
        
        // Show confirmation
        showNotification(`${productName} added to cart!`);
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #8B0000;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            transition: opacity 0.3s;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Initialize cart count on page load
    updateCartCount();
    
    // Add click handlers for view buttons (simulate add to cart)
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Extract product info from parent card
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('h3').textContent;
            const priceText = productCard.querySelector('.price').textContent;
            const price = parseFloat(priceText.replace(/[^0-9.-]+/g, ''));
            
            addToCart(`bike-${index + 1}`, productName, price);
        });
    });
    
    // Console welcome message
    console.log('%cFear City Cycles - v0.1.2', 'color: #8B0000; font-size: 20px; font-weight: bold;');
    console.log('Queens, NYC - Ride or Die');
});