// Fear City Cycles - Cart Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadCartPage();

    // Checkout modal functionality
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckout = document.getElementById('close-checkout');
    const checkoutForm = document.getElementById('checkout-form');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (window.fearCityCart && window.fearCityCart.getItemCount() > 0) {
                checkoutModal.style.display = 'flex';
            }
        });
    }

    if (closeCheckout) {
        closeCheckout.addEventListener('click', function() {
            checkoutModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    checkoutModal.addEventListener('click', function(e) {
        if (e.target === checkoutModal) {
            checkoutModal.style.display = 'none';
        }
    });

    // Payment method toggle
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const cardDetails = document.getElementById('card-details');

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'card') {
                cardDetails.style.display = 'block';
            } else {
                cardDetails.style.display = 'none';
            }
        });
    });

    // Checkout form submission
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processCheckout();
        });
    }

    // Card number formatting
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            this.value = value;
        });
    }

    // Expiry date formatting
    const expiryInput = document.getElementById('expiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            this.value = value;
        });
    }
});

function loadCartPage() {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.querySelector('.cart-content');

    if (!window.fearCityCart || window.fearCityCart.getItemCount() === 0) {
        cartContent.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }

    cartContent.style.display = 'flex';
    emptyCart.style.display = 'none';

    cartItemsContainer.innerHTML = '';

    window.fearCityCart.items.forEach(item => {
        const cartItem = createCartItemElement(item);
        cartItemsContainer.appendChild(cartItem);
    });

    updateCartSummary();
}

function createCartItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
        <div class="item-image">
            <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="item-details">
            <h3>${item.name}</h3>
            ${item.size ? `<p>Size: ${item.size}</p>` : ''}
            <p class="item-price">$${item.price.toFixed(2)}</p>
        </div>
        <div class="item-quantity">
            <div class="quantity-selector">
                <button class="quantity-minus" onclick="updateItemQuantity('${item.id}', ${item.quantity - 1})">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                       onchange="updateItemQuantity('${item.id}', this.value)">
                <button class="quantity-plus" onclick="updateItemQuantity('${item.id}', ${item.quantity + 1})">+</button>
            </div>
        </div>
        <div class="item-total">
            $${(item.price * item.quantity).toFixed(2)}
        </div>
        <div class="item-remove">
            <button onclick="removeCartItem('${item.id}')" class="remove-btn">×</button>
        </div>
    `;

    return itemElement;
}

function updateItemQuantity(itemId, newQuantity, size = 'Standard', customOptions = []) {
    if (window.fearCityCart) {
        window.fearCityCart.updateQuantity(itemId, size, parseInt(newQuantity), customOptions);
        setTimeout(() => loadCartPage(), 100); // Small delay for animation
    }
}

function removeCartItem(itemId, size = 'Standard', customOptions = []) {
    if (window.fearCityCart) {
        // Show confirmation for expensive items
        const item = window.fearCityCart.items.find(item => 
            item.id === itemId && 
            (item.size || 'Standard') === size &&
            JSON.stringify(item.customOptions || []) === JSON.stringify(customOptions)
        );
        
        if (item && item.price > 1000) {
            showRemoveConfirmation(item, () => {
                window.fearCityCart.removeItem(itemId, size, customOptions);
                setTimeout(() => loadCartPage(), 100);
            });
        } else {
            window.fearCityCart.removeItem(itemId, size, customOptions);
            setTimeout(() => loadCartPage(), 100);
        }
    }
}

function updateCartSummary() {
    if (!window.fearCityCart) return;

    const subtotal = window.fearCityCart.getTotal();
    const shipping = subtotal > 500 ? 0 : 25; // Free shipping over $500
    const tax = subtotal * 0.08625; // NYC tax rate
    const total = subtotal + shipping + tax;

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

function processCheckout() {
    const submitBtn = document.querySelector('#checkout-form button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'PROCESSING...';
    submitBtn.disabled = true;

    // Simulate payment processing
    setTimeout(() => {
        // Clear cart
        if (window.fearCityCart) {
            window.fearCityCart.items = [];
            window.fearCityCart.saveCart();
            window.fearCityCart.updateCartDisplay();
        }

        // Show success and redirect
        alert('Order placed successfully! You will receive a confirmation email shortly.');

        // Close modal and redirect
        document.getElementById('checkout-modal').style.display = 'none';
        window.location.href = '../main.html';
    }, 3000);
}

// Enhanced cart page functions
function showRemoveConfirmation(item, callback) {
    const modal = document.createElement('div');
    modal.className = 'remove-confirmation-modal';
    modal.innerHTML = `
        <div class="remove-confirmation-content">
            <h3>Remove ${item.name}?</h3>
            <p>This item costs $${item.price.toLocaleString()}. Are you sure you want to remove it from your cart?</p>
            <div class="confirmation-actions">
                <button class="btn-confirm-remove">Yes, Remove</button>
                <button class="btn-cancel-remove">Cancel</button>
            </div>
        </div>
    `;

    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.3s ease;
    `;

    const content = modal.querySelector('.remove-confirmation-content');
    content.style.cssText = `
        background: #000;
        border: 2px solid #8B0000;
        padding: 30px;
        text-align: center;
        max-width: 400px;
        margin: 20px;
    `;

    document.body.appendChild(modal);

    modal.querySelector('.btn-confirm-remove').addEventListener('click', () => {
        callback();
        modal.remove();
    });

    modal.querySelector('.btn-cancel-remove').addEventListener('click', () => {
        modal.remove();
    });
}

function clearCartWithConfirmation() {
    if (!window.fearCityCart || window.fearCityCart.getItemCount() === 0) return;

    const modal = document.createElement('div');
    modal.className = 'clear-cart-modal';
    modal.innerHTML = `
        <div class="clear-cart-content">
            <h3>Clear Entire Cart?</h3>
            <p>You have ${window.fearCityCart.getItemCount()} items worth $${window.fearCityCart.getTotal().toLocaleString()}. This action cannot be undone.</p>
            <div class="clear-cart-actions">
                <button class="btn-confirm-clear">Yes, Clear Cart</button>
                <button class="btn-cancel-clear">Cancel</button>
            </div>
        </div>
    `;

    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.3s ease;
    `;

    const content = modal.querySelector('.clear-cart-content');
    content.style.cssText = `
        background: #000;
        border: 2px solid #dc3545;
        padding: 30px;
        text-align: center;
        max-width: 400px;
        margin: 20px;
    `;

    document.body.appendChild(modal);

    modal.querySelector('.btn-confirm-clear').addEventListener('click', () => {
        window.fearCityCart.clearCart();
        loadCartPage();
        modal.remove();
    });

    modal.querySelector('.btn-cancel-clear').addEventListener('click', () => {
        modal.remove();
    });
}

// Save cart for later functionality
function saveCartForLater() {
    if (window.fearCityCart) {
        window.fearCityCart.saveCartForLater();
    }
}

function restoreSavedCart() {
    if (window.fearCityCart) {
        window.fearCityCart.restoreSavedCart();
        loadCartPage();
    }
}

// Check for saved cart on page load
window.addEventListener('load', function() {
    const savedCart = localStorage.getItem('fearCityCartSavedForLater');
    if (savedCart) {
        const cartData = JSON.parse(savedCart);
        const ageInHours = (Date.now() - cartData.savedAt) / (1000 * 60 * 60);
        
        if (ageInHours < 168) { // 1 week
            showSavedCartNotification();
        }
    }
});

function showSavedCartNotification() {
    const notification = document.createElement('div');
    notification.className = 'saved-cart-notification';
    notification.innerHTML = `
        <div class="saved-cart-content">
            <p>You have a saved cart from a previous session.</p>
            <div class="saved-cart-actions">
                <button onclick="restoreSavedCart()">Restore Cart</button>
                <button onclick="dismissSavedCart()">Dismiss</button>
            </div>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1a1a1a;
        border: 2px solid #8B0000;
        padding: 20px;
        z-index: 1000;
        max-width: 300px;
        animation: slideUp 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 30000);
}

function dismissSavedCart() {
    localStorage.removeItem('fearCityCartSavedForLater');
    const notification = document.querySelector('.saved-cart-notification');
    if (notification) {
        notification.remove();
    }
}