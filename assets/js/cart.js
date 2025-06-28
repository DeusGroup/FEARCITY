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

function updateItemQuantity(itemId, newQuantity) {
    if (window.fearCityCart) {
        window.fearCityCart.updateQuantity(itemId, parseInt(newQuantity));
        loadCartPage();
    }
}

function removeCartItem(itemId) {
    if (window.fearCityCart) {
        window.fearCityCart.removeItem(itemId);
        loadCartPage();
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