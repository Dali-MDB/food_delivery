// Cart Page Specific JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Cart page loaded');
    
    // Initialize authentication state first
    await initializeAuthState();
    
    // Check if user is authenticated
    if (!currentUser) {
        showMessage('Please login to view your cart', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // Load cart on page load
    loadCartPage();

    // Event listeners
    document.getElementById('clearCart').addEventListener('click', clearCart);
    document.getElementById('continueShopping').addEventListener('click', () => {
        window.location.href = 'categories.html';
    });
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            showMessage('Your cart is empty', 'warning');
            return;
        }
        openModal(document.getElementById('checkoutModal'));
        loadOrderSummary();
    });

    // Checkout form submission
    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const address = document.getElementById('checkoutAddress').value;

        try {
            await checkout(address);
            showMessage('Order placed successfully!', 'success');
            closeModal(document.getElementById('checkoutModal'));
            // Redirect to home page instead of orders page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } catch (error) {
            console.error('Checkout error:', error);
            showMessage('Failed to place order: ' + error.message, 'error');
        }
    });
});

// Initialize authentication state
async function initializeAuthState() {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        try {
            currentUser = await apiCall('/auth/current_user/');
            console.log('User authenticated:', currentUser);
        } catch (error) {
            console.error('Failed to get current user:', error);
            localStorage.removeItem('authToken');
            currentUser = null;
        }
    } else {
        currentUser = null;
    }
}

async function loadCartPage() {
    try {
        console.log('Loading cart page...');
        showLoading(document.getElementById('cartItemsList'));
        
        const cartData = await apiCall('/orders/view_cart/');
        console.log('Cart data received:', cartData);
        
        cart = cartData.item_orders || [];
        console.log('Cart items:', cart);
        
        displayCartPage();
    } catch (error) {
        console.error('Failed to load cart:', error);
        showMessage('Failed to load cart: ' + error.message, 'error');
        document.getElementById('cartItemsList').innerHTML = '<p>Failed to load cart items. Please try refreshing the page.</p>';
    }
}

function displayCartPage() {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const cartPage = document.querySelector('.cart-page');

    if (cart.length === 0) {
        cartPage.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }

    cartPage.style.display = 'block';
    emptyCart.style.display = 'none';

    cartItemsList.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.item_name}</div>
                <div class="cart-item-price">${formatPrice(item.unit_price)} each</div>
            </div>
            <div class="cart-item-quantity">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateCartItemQuantity(${item.item_order_id}, ${item.quantity - 1})">-</button>
                    <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartItemQuantity(${item.item_order_id}, ${item.quantity + 1})">+</button>
                </div>
                <button class="btn btn-danger" onclick="removeFromCart(${item.item_order_id})">Remove</button>
            </div>
        </div>
    `).join('');

    updateCartSummary();
}

function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const deliveryFee = 2.99;
    const total = subtotal + deliveryFee;

    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('deliveryFee').textContent = formatPrice(deliveryFee);
    document.getElementById('cartTotal').textContent = formatPrice(total);
}

async function updateCartItemQuantity(itemOrderId, newQuantity) {
    if (newQuantity <= 0) {
        await removeFromCart(itemOrderId);
        return;
    }

    try {
        console.log(`Updating quantity for item ${itemOrderId} to ${newQuantity}`);
        
        await apiCall(`/orders/change_item_order_quantity/${itemOrderId}?new_quantity=${newQuantity}`, {
            method: 'PUT'
        });
        
        showMessage('Quantity updated successfully');
        await loadCartPage();
    } catch (error) {
        console.error('Failed to update quantity:', error);
        showMessage('Failed to update quantity: ' + error.message, 'error');
    }
}

function loadOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    const orderTotal = document.getElementById('orderTotal');
    
    const summaryItems = cart.map(item => `
        <div class="order-item">
            <span>${item.item_name} x${item.quantity}</span>
            <span>${formatPrice(item.total_price)}</span>
        </div>
    `).join('');
    
    orderSummary.innerHTML = summaryItems;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const deliveryFee = 2.99;
    const total = subtotal + deliveryFee;
    
    orderTotal.textContent = formatPrice(total);
}

// Override the global removeFromCart function for cart page
async function removeFromCart(itemOrderId) {
    try {
        console.log(`Removing item ${itemOrderId} from cart`);
        
        await apiCall(`/orders/remove_from_cart/${itemOrderId}/`, {
            method: 'DELETE'
        });
        
        showMessage('Item removed from cart successfully');
        await loadCartPage();
    } catch (error) {
        console.error('Failed to remove item from cart:', error);
        showMessage('Failed to remove item from cart: ' + error.message, 'error');
    }
}

// Override the global clearCart function for cart page
async function clearCart() {
    if (!currentUser) return;
    
    try {
        console.log('Clearing cart...');
        
        // Remove all items one by one
        for (const item of cart) {
            await apiCall(`/orders/remove_from_cart/${item.item_order_id}/`, {
                method: 'DELETE'
            });
        }
        
        showMessage('Cart cleared successfully');
        await loadCartPage();
    } catch (error) {
        console.error('Failed to clear cart:', error);
        showMessage('Failed to clear cart: ' + error.message, 'error');
    }
} 