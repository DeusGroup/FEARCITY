// Fear City Cycles - Mobile Experience Enhancements

class MobileEnhancements {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTouch = 'ontouchstart' in window;
        this.swipeThreshold = 50;
        this.touchStartPos = { x: 0, y: 0 };
        this.touchEndPos = { x: 0, y: 0 };
        
        if (this.isMobile || this.isTouch) {
            this.initializeMobileFeatures();
        }
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    initializeMobileFeatures() {
        this.setupTouchOptimizations();
        this.setupSwipeGestures();
        this.setupMobileNavigation();
        this.setupMobileSearch();
        this.setupMobileCart();
        this.setupMobileGalleries();
        this.setupPullToRefresh();
        this.setupMobileKeyboard();
        this.setupHapticFeedback();
        
        // Add mobile-specific CSS class
        document.body.classList.add('mobile-enhanced');
        
        console.log('Mobile enhancements initialized');
    }

    setupTouchOptimizations() {
        // Increase touch target sizes
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .mobile-enhanced button,
                .mobile-enhanced .btn,
                .mobile-enhanced .add-to-cart,
                .mobile-enhanced .nav-link,
                .mobile-enhanced .search-result-item {
                    min-height: 44px;
                    min-width: 44px;
                    padding: 12px 16px;
                    touch-action: manipulation;
                    user-select: none;
                    -webkit-user-select: none;
                }
                
                .mobile-enhanced .product-card {
                    margin-bottom: 20px;
                    touch-action: manipulation;
                }
                
                .mobile-enhanced .quantity-selector button {
                    min-width: 44px;
                    min-height: 44px;
                    font-size: 18px;
                }
                
                .mobile-enhanced input,
                .mobile-enhanced select,
                .mobile-enhanced textarea {
                    font-size: 16px; /* Prevents zoom on iOS */
                    padding: 12px;
                    border-radius: 8px;
                }
                
                .mobile-enhanced .cart-notification {
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    transform: translateY(100px);
                    transition: transform 0.3s ease;
                }
                
                .mobile-enhanced .cart-notification.show {
                    transform: translateY(0);
                }
                
                /* Touch feedback */
                .mobile-enhanced .touch-feedback:active {
                    transform: scale(0.95);
                    opacity: 0.8;
                    transition: all 0.1s ease;
                }
            }
        `;
        document.head.appendChild(style);

        // Add touch feedback class to interactive elements
        const interactiveElements = document.querySelectorAll('button, .btn, .add-to-cart, .product-card, .nav-link');
        interactiveElements.forEach(el => {
            el.classList.add('touch-feedback');
        });
    }

    setupSwipeGestures() {
        // Product gallery swipe
        const galleries = document.querySelectorAll('.product-gallery, .gallery-thumbs');
        galleries.forEach(gallery => {
            this.addSwipeToElement(gallery, (direction) => {
                if (direction === 'left') {
                    this.nextGalleryImage(gallery);
                } else if (direction === 'right') {
                    this.prevGalleryImage(gallery);
                }
            });
        });

        // Product cards swipe for quick actions
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            this.addSwipeToElement(card, (direction) => {
                if (direction === 'right') {
                    // Quick add to cart
                    const addButton = card.querySelector('.add-to-cart');
                    if (addButton) {
                        this.showQuickAction(card, 'Added to Cart!', () => {
                            addButton.click();
                        });
                    }
                } else if (direction === 'left') {
                    // Quick view
                    const viewButton = card.querySelector('a[href*=".html"], .view-btn');
                    if (viewButton) {
                        this.showQuickAction(card, 'Quick View', () => {
                            viewButton.click();
                        });
                    }
                }
            });
        });

        // Cart items swipe to remove
        document.addEventListener('DOMContentLoaded', () => {
            const updateCartItems = () => {
                const cartItems = document.querySelectorAll('.cart-item');
                cartItems.forEach(item => {
                    this.addSwipeToElement(item, (direction) => {
                        if (direction === 'left') {
                            const removeButton = item.querySelector('.remove-btn, [onclick*="remove"]');
                            if (removeButton) {
                                this.showQuickAction(item, 'Remove Item', () => {
                                    removeButton.click();
                                });
                            }
                        }
                    });
                });
            };

            // Initial setup and re-run when cart updates
            updateCartItems();
            const observer = new MutationObserver(updateCartItems);
            const cartContainer = document.querySelector('.cart-items, .cart-container');
            if (cartContainer) {
                observer.observe(cartContainer, { childList: true, subtree: true });
            }
        });
    }

    addSwipeToElement(element, callback) {
        let startX, startY, distX, distY;
        const threshold = this.swipeThreshold;
        
        element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const touch = e.touches[0];
            distX = touch.clientX - startX;
            distY = touch.clientY - startY;
            
            // Prevent scrolling if horizontal swipe is detected
            if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > 20) {
                e.preventDefault();
            }
        }, { passive: false });

        element.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            if (Math.abs(distX) > threshold && Math.abs(distX) > Math.abs(distY)) {
                const direction = distX > 0 ? 'right' : 'left';
                callback(direction);
                this.triggerHapticFeedback('light');
            }
            
            startX = startY = distX = distY = 0;
        }, { passive: true });
    }

    nextGalleryImage(gallery) {
        const mainImage = gallery.querySelector('.main-product-image, .main-image');
        const thumbnails = gallery.querySelectorAll('.gallery-thumbs img, .thumbnail');
        
        if (!mainImage || thumbnails.length === 0) return;
        
        const currentActive = gallery.querySelector('.gallery-thumbs .active, .thumbnail.active');
        let nextIndex = 0;
        
        if (currentActive) {
            const currentIndex = Array.from(thumbnails).indexOf(currentActive);
            nextIndex = (currentIndex + 1) % thumbnails.length;
        }
        
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnails[nextIndex].classList.add('active');
        mainImage.src = thumbnails[nextIndex].src;
        
        this.showImageTransition(mainImage, 'next');
    }

    prevGalleryImage(gallery) {
        const mainImage = gallery.querySelector('.main-product-image, .main-image');
        const thumbnails = gallery.querySelectorAll('.gallery-thumbs img, .thumbnail');
        
        if (!mainImage || thumbnails.length === 0) return;
        
        const currentActive = gallery.querySelector('.gallery-thumbs .active, .thumbnail.active');
        let prevIndex = thumbnails.length - 1;
        
        if (currentActive) {
            const currentIndex = Array.from(thumbnails).indexOf(currentActive);
            prevIndex = currentIndex === 0 ? thumbnails.length - 1 : currentIndex - 1;
        }
        
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnails[prevIndex].classList.add('active');
        mainImage.src = thumbnails[prevIndex].src;
        
        this.showImageTransition(mainImage, 'prev');
    }

    showImageTransition(image, direction) {
        image.style.transform = direction === 'next' ? 'translateX(-10px)' : 'translateX(10px)';
        image.style.opacity = '0.8';
        
        setTimeout(() => {
            image.style.transform = 'translateX(0)';
            image.style.opacity = '1';
        }, 150);
    }

    showQuickAction(element, message, action) {
        const overlay = document.createElement('div');
        overlay.className = 'quick-action-overlay';
        overlay.innerHTML = `
            <div class="quick-action-message">${message}</div>
            <div class="quick-action-icon">⚡</div>
        `;
        
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(139, 0, 0, 0.9);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 100;
            animation: quickActionFade 0.3s ease;
        `;
        
        element.style.position = 'relative';
        element.appendChild(overlay);
        
        setTimeout(() => {
            action();
            overlay.remove();
        }, 500);
    }

    setupMobileNavigation() {
        const nav = document.querySelector('.main-nav, nav');
        if (!nav) return;

        // Add mobile menu improvements
        const mobileToggle = document.querySelector('.mobile-menu-toggle, .hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileToggle && navMenu) {
            // Improve mobile menu animation
            navMenu.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'mobile-nav-backdrop';
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(backdrop);
            
            // Enhanced mobile menu toggle
            mobileToggle.addEventListener('click', () => {
                const isActive = navMenu.classList.contains('active');
                
                if (isActive) {
                    navMenu.classList.remove('active');
                    backdrop.style.opacity = '0';
                    backdrop.style.visibility = 'hidden';
                    document.body.style.overflow = '';
                } else {
                    navMenu.classList.add('active');
                    backdrop.style.opacity = '1';
                    backdrop.style.visibility = 'visible';
                    document.body.style.overflow = 'hidden';
                    this.triggerHapticFeedback('medium');
                }
            });
            
            // Close menu when clicking backdrop
            backdrop.addEventListener('click', () => {
                mobileToggle.click();
            });
            
            // Close menu when clicking nav links
            const navLinks = navMenu.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (navMenu.classList.contains('active')) {
                        mobileToggle.click();
                    }
                });
            });
        }
    }

    setupMobileSearch() {
        const searchInput = document.getElementById('product-search');
        if (!searchInput) return;

        // Mobile search improvements
        searchInput.addEventListener('focus', () => {
            // Scroll to top to ensure search is visible
            if (this.isMobile) {
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 300);
            }
            
            // Add mobile search class for styling
            searchInput.classList.add('mobile-search-active');
        });

        searchInput.addEventListener('blur', () => {
            searchInput.classList.remove('mobile-search-active');
        });

        // Voice search support (if available)
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.addVoiceSearch(searchInput);
        }
    }

    addVoiceSearch(searchInput) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        const voiceButton = document.createElement('button');
        voiceButton.innerHTML = '🎤';
        voiceButton.className = 'voice-search-btn';
        voiceButton.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
            z-index: 10;
        `;
        
        // Position voice button
        const searchContainer = searchInput.parentElement;
        searchContainer.style.position = 'relative';
        searchContainer.appendChild(voiceButton);
        
        voiceButton.addEventListener('click', () => {
            recognition.start();
            voiceButton.innerHTML = '🔴';
            this.triggerHapticFeedback('medium');
        });
        
        recognition.addEventListener('result', (event) => {
            const transcript = event.results[0][0].transcript;
            searchInput.value = transcript;
            searchInput.dispatchEvent(new Event('input'));
            voiceButton.innerHTML = '🎤';
        });
        
        recognition.addEventListener('error', () => {
            voiceButton.innerHTML = '🎤';
        });
    }

    setupMobileCart() {
        // Mobile cart optimizations
        const cartLinks = document.querySelectorAll('.cart-link');
        cartLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (this.isMobile) {
                    // Add mobile cart loading state
                    link.classList.add('cart-loading');
                    setTimeout(() => {
                        link.classList.remove('cart-loading');
                    }, 300);
                }
            });
        });

        // Mobile cart notifications
        const originalShowNotification = window.fearCityCart?.showEnhancedNotification;
        if (originalShowNotification && this.isMobile) {
            window.fearCityCart.showEnhancedNotification = (message, type, duration) => {
                // Use mobile-optimized notifications
                this.showMobileNotification(message, type, duration);
            };
        }
    }

    showMobileNotification(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `mobile-notification mobile-notification--${type}`;
        
        const icons = {
            success: '✓',
            remove: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.success}</span>
            <span class="notification-message">${message}</span>
        `;

        const colors = {
            success: '#8B0000',
            remove: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: ${colors[type] || colors.success};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            z-index: 1001;
            font-family: inherit;
            font-weight: 600;
            transform: translateY(100px);
            transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-size: 16px;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
        }, 10);

        // Trigger haptic feedback
        this.triggerHapticFeedback('light');

        // Remove after duration
        setTimeout(() => {
            notification.style.transform = 'translateY(100px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    setupMobileGalleries() {
        // Enhanced mobile gallery experience
        const galleries = document.querySelectorAll('.product-gallery');
        galleries.forEach(gallery => {
            const mainImage = gallery.querySelector('.main-product-image, .main-image');
            if (!mainImage) return;

            // Add pinch-to-zoom support
            this.addPinchZoom(mainImage);
            
            // Add double-tap to zoom
            this.addDoubleTapZoom(mainImage);
            
            // Mobile gallery indicators
            this.addGalleryIndicators(gallery);
        });
    }

    addPinchZoom(image) {
        let scale = 1;
        let initialDistance = 0;
        let initialScale = 1;
        
        image.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
                initialScale = scale;
            }
        }, { passive: false });
        
        image.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const distance = this.getDistance(e.touches[0], e.touches[1]);
                scale = Math.min(Math.max(0.5, initialScale * (distance / initialDistance)), 3);
                image.style.transform = `scale(${scale})`;
            }
        }, { passive: false });
        
        image.addEventListener('touchend', (e) => {
            if (e.touches.length === 0 && scale !== 1) {
                // Reset zoom after a delay
                setTimeout(() => {
                    image.style.transform = 'scale(1)';
                    image.style.transition = 'transform 0.3s ease';
                    scale = 1;
                    setTimeout(() => {
                        image.style.transition = '';
                    }, 300);
                }, 2000);
            }
        });
    }

    addDoubleTapZoom(image) {
        let lastTap = 0;
        let isZoomed = false;
        
        image.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                
                if (isZoomed) {
                    image.style.transform = 'scale(1)';
                    isZoomed = false;
                } else {
                    image.style.transform = 'scale(2)';
                    isZoomed = true;
                }
                
                image.style.transition = 'transform 0.3s ease';
                this.triggerHapticFeedback('medium');
                
                setTimeout(() => {
                    image.style.transition = '';
                }, 300);
            }
            
            lastTap = currentTime;
        });
    }

    addGalleryIndicators(gallery) {
        const thumbnails = gallery.querySelectorAll('.gallery-thumbs img, .thumbnail');
        if (thumbnails.length <= 1) return;
        
        const indicators = document.createElement('div');
        indicators.className = 'mobile-gallery-indicators';
        indicators.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 10;
        `;
        
        thumbnails.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                transition: background 0.3s ease;
            `;
            
            if (index === 0) {
                indicator.style.background = 'rgba(139, 0, 0, 0.8)';
            }
            
            indicators.appendChild(indicator);
        });
        
        gallery.style.position = 'relative';
        gallery.appendChild(indicators);
        
        // Update indicators when thumbnails change
        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                const allIndicators = indicators.querySelectorAll('div');
                allIndicators.forEach((ind, i) => {
                    ind.style.background = i === index ? 'rgba(139, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.5)';
                });
            });
        });
    }

    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pullDistance = 0;
        const threshold = 80;
        let isPulling = false;
        
        const pullIndicator = document.createElement('div');
        pullIndicator.className = 'pull-to-refresh';
        pullIndicator.innerHTML = '↓ Pull to refresh';
        pullIndicator.style.cssText = `
            position: fixed;
            top: -60px;
            left: 0;
            right: 0;
            height: 60px;
            background: #8B0000;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            z-index: 1000;
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(pullIndicator);
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && startY > 0) {
                currentY = e.touches[0].clientY;
                pullDistance = currentY - startY;
                
                if (pullDistance > 0) {
                    isPulling = true;
                    const translateY = Math.min(pullDistance / 2, threshold);
                    pullIndicator.style.transform = `translateY(${translateY}px)`;
                    
                    if (pullDistance > threshold) {
                        pullIndicator.innerHTML = '↑ Release to refresh';
                        pullIndicator.style.background = '#660000';
                    } else {
                        pullIndicator.innerHTML = '↓ Pull to refresh';
                        pullIndicator.style.background = '#8B0000';
                    }
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (isPulling) {
                if (pullDistance > threshold) {
                    pullIndicator.innerHTML = '⟳ Refreshing...';
                    pullIndicator.style.transform = 'translateY(60px)';
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    pullIndicator.style.transform = 'translateY(-60px)';
                }
                
                isPulling = false;
                pullDistance = 0;
                startY = 0;
            }
        }, { passive: true });
    }

    setupMobileKeyboard() {
        // Handle virtual keyboard on mobile
        let initialViewportHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            if (heightDifference > 150) {
                // Keyboard is likely open
                document.body.classList.add('keyboard-open');
                
                // Adjust focused input position
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    setTimeout(() => {
                        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            } else {
                // Keyboard is likely closed
                document.body.classList.remove('keyboard-open');
            }
        });
    }

    setupHapticFeedback() {
        // Enable haptic feedback where supported
        this.hapticSupported = 'vibrate' in navigator;
        
        if (this.hapticSupported) {
            // Add haptic feedback to interactive elements
            document.addEventListener('click', (e) => {
                if (e.target.matches('button, .btn, .add-to-cart, .remove-btn')) {
                    this.triggerHapticFeedback('light');
                }
            });
        }
    }

    triggerHapticFeedback(type = 'light') {
        if (!this.hapticSupported) return;
        
        const patterns = {
            light: [10],
            medium: [50],
            heavy: [100],
            success: [10, 50, 10],
            error: [100, 50, 100]
        };
        
        navigator.vibrate(patterns[type] || patterns.light);
    }
}

// Initialize mobile enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileEnhancements = new MobileEnhancements();
});

// Add mobile-specific animations
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    @keyframes quickActionFade {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
    }
    
    @media (max-width: 768px) {
        .mobile-enhanced .product-card:active {
            transform: scale(0.98);
        }
        
        .mobile-enhanced .touch-feedback:active {
            transform: scale(0.95);
            transition: transform 0.1s ease;
        }
        
        .mobile-enhanced .cart-loading {
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .keyboard-open .main-footer {
            display: none;
        }
        
        .mobile-search-active {
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            right: 10px !important;
            z-index: 1000 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
    }
`;
document.head.appendChild(mobileStyles);

// Export for external use
window.MobileEnhancements = MobileEnhancements;