// Fear City Cycles - Culture/Blog JavaScript
class CultureSection {
    constructor() {
        this.init();
    }

    init() {
        this.setupCategoryFiltering();
        this.setupNewsletterForm();
        this.setupPostAnimations();
        this.setupSearchFilter();
    }

    setupCategoryFiltering() {
        const categoryLinks = document.querySelectorAll('.category-list a');
        const postCards = document.querySelectorAll('.post-card');

        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active category
                categoryLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const category = link.dataset.category;
                
                // Filter posts
                postCards.forEach(card => {
                    const postCategory = card.querySelector('.post-category');
                    const categoryText = postCategory ? postCategory.textContent.toLowerCase().replace(/\s+/g, '-') : '';
                    
                    if (category === 'all' || categoryText === category) {
                        card.style.display = 'block';
                        card.classList.add('fade-in');
                    } else {
                        card.style.display = 'none';
                        card.classList.remove('fade-in');
                    }
                });
            });
        });
    }

    setupNewsletterForm() {
        const form = document.getElementById('culture-newsletter');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = form.querySelector('input[type="email"]').value;
                
                if (this.validateEmail(email)) {
                    this.showToast('Welcome to the underground! Check your email for confirmation.', 'success');
                    form.reset();
                } else {
                    this.showToast('Please enter a valid email address.', 'error');
                }
            });
        }
    }

    setupPostAnimations() {
        // Intersection Observer for post animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.post-card').forEach(card => {
            observer.observe(card);
        });
    }

    setupSearchFilter() {
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const postCards = document.querySelectorAll('.post-card');
                
                postCards.forEach(card => {
                    const title = card.querySelector('.post-title').textContent.toLowerCase();
                    const excerpt = card.querySelector('.post-excerpt').textContent.toLowerCase();
                    const author = card.querySelector('.post-author').textContent.toLowerCase();
                    
                    if (title.includes(searchTerm) || excerpt.includes(searchTerm) || author.includes(searchTerm)) {
                        card.style.display = 'block';
                        card.classList.add('search-match');
                    } else {
                        card.style.display = 'none';
                        card.classList.remove('search-match');
                    }
                });
            });
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove after 5 seconds
        setTimeout(() => this.removeToast(toast), 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
    }

    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CultureSection();
    
    // Initialize cart if main.js is loaded
    if (window.fearCityCart) {
        window.fearCityCart.updateCartCount();
    }
});

// Reading progress indicator for individual posts
class ReadingProgress {
    constructor() {
        this.init();
    }

    init() {
        // Only run on individual post pages
        if (document.querySelector('.post-content-full')) {
            this.createProgressBar();
            this.updateProgress();
        }
    }

    createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.innerHTML = '<div class="reading-progress-fill"></div>';
        document.body.appendChild(progressBar);
    }

    updateProgress() {
        const progressFill = document.querySelector('.reading-progress-fill');
        if (!progressFill) return;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            
            progressFill.style.width = Math.min(scrollPercent, 100) + '%';
        });
    }
}

// Initialize reading progress
document.addEventListener('DOMContentLoaded', () => {
    new ReadingProgress();
});