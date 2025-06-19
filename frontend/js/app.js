// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Global State
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let cart = [];
let elements = {}; // Will be initialized after DOM loads

// Utility Functions
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the body
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showLoading(element) {
    if (element) {
        element.innerHTML = '<div class="loading"></div>';
    }
}

function hideLoading(element) {
    if (element) {
        element.innerHTML = '';
    }
}

function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

// API Functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Authentication Functions
async function login(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
    }
    
    const data = await response.json();
    authToken = data.access_token;
    localStorage.setItem('authToken', authToken);
    
    // Get current user info
    await getCurrentUser();
    
    return data;
}

async function signup(userData) {
    const response = await apiCall('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    return response;
}

async function getCurrentUser() {
    if (!authToken) return null;
    
    try {
        currentUser = await apiCall('/auth/current_user/');
        updateAuthUI();
        // Load cart after user authentication
        await loadCart();
        return currentUser;
    } catch (error) {
        console.error('Failed to get current user:', error);
        logout();
        return null;
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    cart = [];
    localStorage.removeItem('authToken');
    updateAuthUI();
    updateCartUI();
}

function updateAuthUI() {
    if (currentUser) {
        if (elements.loginBtn) elements.loginBtn.style.display = 'none';
        if (elements.signupBtn) elements.signupBtn.style.display = 'none';
        if (elements.logoutBtn) elements.logoutBtn.style.display = 'inline-block';
        if (elements.profileBtn) elements.profileBtn.style.display = 'inline-block';
        if (elements.cartBtn) elements.cartBtn.style.display = 'inline-block';
    } else {
        if (elements.loginBtn) elements.loginBtn.style.display = 'inline-block';
        if (elements.signupBtn) elements.signupBtn.style.display = 'inline-block';
        if (elements.logoutBtn) elements.logoutBtn.style.display = 'none';
        if (elements.profileBtn) elements.profileBtn.style.display = 'none';
        if (elements.cartBtn) elements.cartBtn.style.display = 'none';
    }
}

// Categories Functions
async function loadCategories() {
    try {
        if (!elements.categoriesGrid) {
            console.error('categoriesGrid element not found');
            return;
        }
        
        showLoading(elements.categoriesGrid);
        const categories = await apiCall('/category/all/');
        console.log('Categories loaded:', categories);
        displayCategories(categories);
    } catch (error) {
        console.error('Failed to load categories:', error);
        showMessage('Failed to load categories', 'error');
        if (elements.categoriesGrid) {
            elements.categoriesGrid.innerHTML = '<p>Failed to load categories. Please try again later.</p>';
        }
    }
}

function displayCategories(categories) {
    if (!elements.categoriesGrid) {
        console.error('categoriesGrid element not found in displayCategories');
        return;
    }
    
    if (!categories || categories.length === 0) {
        elements.categoriesGrid.innerHTML = '<p>No categories available.</p>';
        return;
    }
    
    const categoryIcons = [
        'fas fa-pizza-slice',
        'fas fa-hamburger',
        'fas fa-ice-cream',
        'fas fa-coffee',
        'fas fa-utensils',
        'fas fa-birthday-cake'
    ];
    
    elements.categoriesGrid.innerHTML = categories.map((category, index) => `
        <div class="category-card" onclick="navigateToCategory(${category.id})">
            <div class="category-image">
                <i class="${categoryIcons[index % categoryIcons.length]}"></i>
            </div>
            <div class="category-content">
                <h3 class="category-title">${category.name}</h3>
                <p class="category-description">Explore our delicious ${category.name.toLowerCase()} selection</p>
                <button class="btn btn-primary">View Items</button>
            </div>
        </div>
    `).join('');
}

function navigateToCategory(categoryId) {
    console.log('Navigating to category:', categoryId);
    window.location.href = `category.html?id=${categoryId}`;
}

async function loadCategoryItems(categoryId, categoryName) {
    try {
        showLoading(elements.itemsGrid);
        const items = await apiCall(`/category/${categoryId}/all_items/`);
        displayItems(items, categoryName);
        openModal(elements.itemsModal);
    } catch (error) {
        showMessage('Failed to load items', 'error');
        elements.itemsGrid.innerHTML = '<p>Failed to load items. Please try again later.</p>';
    }
}

function displayItems(items, categoryName) {
    elements.modalTitle.textContent = `${categoryName} Items`;
    
    if (items.length === 0) {
        elements.itemsGrid.innerHTML = '<p>No items available in this category.</p>';
        return;
    }
    
    elements.itemsGrid.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-image">
                <i class="fas fa-utensils"></i>
            </div>
            <div class="item-content">
                <h3 class="item-title">${item.name}</h3>
                <p class="item-description">${item.description || 'Delicious food item'}</p>
                <div class="item-price">${formatPrice(item.price)}</div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                        <input type="number" class="quantity-input" id="qty-${item.id}" value="1" min="1" max="10">
                        <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="btn btn-primary" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Cart Functions
function changeQuantity(itemId, change) {
    const input = document.getElementById(`qty-${itemId}`);
    const newValue = Math.max(1, Math.min(10, parseInt(input.value) + change));
    input.value = newValue;
}

async function addToCart(itemId, itemName, itemPrice) {
    if (!currentUser) {
        showMessage('Please login to add items to cart', 'warning');
        openModal(elements.loginModal);
        return;
    }
    
    const quantityInput = document.getElementById(`qty-${itemId}`);
    if (!quantityInput) {
        showMessage('Quantity input not found', 'error');
        return;
    }
    
    const quantity = parseInt(quantityInput.value);
    if (isNaN(quantity) || quantity < 1 || quantity > 10) {
        showMessage('Please enter a valid quantity (1-10)', 'error');
        return;
    }
    
    try {
        console.log(`Adding item ${itemId} to cart with quantity ${quantity}`);
        
        const response = await apiCall(`/orders/add_to_cart/${itemId}/?quantity=${quantity}`, {
            method: 'POST'
        });
        
        console.log('Add to cart response:', response);
        showMessage(`${itemName} added to cart successfully!`);
        await loadCart();
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add item to cart: ' + error.message, 'error');
    }
}

async function loadCart() {
    if (!currentUser) return;
    
    try {
        console.log('Loading cart for user:', currentUser.id);
        const cartData = await apiCall('/orders/view_cart/');
        console.log('Cart data received:', cartData);
        cart = cartData.item_orders || [];
        console.log('Cart items:', cart);
        updateCartUI();
    } catch (error) {
        console.error('Failed to load cart:', error);
        // Don't show error message for cart loading as it might be expected for new users
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update cart count if element exists
    if (elements.cartCount) {
        elements.cartCount.textContent = totalItems;
    }
    
    // Update cart items if element exists (for modal)
    if (elements.cartItems) {
        if (cart.length === 0) {
            elements.cartItems.innerHTML = '<p>Your cart is empty</p>';
        } else {
            elements.cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.item_name}</div>
                        <div class="cart-item-price">${formatPrice(item.unit_price)} each</div>
                    </div>
                    <div class="cart-item-quantity">
                        <span>Qty: ${item.quantity}</span>
                        <button class="btn btn-outline" onclick="removeFromCart(${item.item_order_id})">Remove</button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Update cart total if element exists
    if (elements.cartTotal) {
        if (cart.length === 0) {
            elements.cartTotal.textContent = '0.00';
        } else {
            const total = cart.reduce((sum, item) => sum + (item.total_price || 0), 0);
            elements.cartTotal.textContent = formatPrice(total);
        }
    }
}

async function removeFromCart(itemOrderId) {
    try {
        console.log(`Removing item ${itemOrderId} from cart`);
        
        await apiCall(`/orders/remove_from_cart/${itemOrderId}/`, {
            method: 'DELETE'
        });
        
        showMessage('Item removed from cart successfully');
        await loadCart();
    } catch (error) {
        console.error('Failed to remove item from cart:', error);
        showMessage('Failed to remove item from cart: ' + error.message, 'error');
    }
}

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
        await loadCart();
    } catch (error) {
        console.error('Failed to clear cart:', error);
        showMessage('Failed to clear cart: ' + error.message, 'error');
    }
}

async function checkout(address) {
    try {
        console.log('Processing checkout with address:', address);
        
        const response = await apiCall('/orders/confirm_order/', {
            method: 'POST',
            body: JSON.stringify({ address })
        });
        
        console.log('Checkout response:', response);
        showMessage('Order placed successfully!', 'success');
        closeModal(elements.checkoutModal);
        await loadCart(); // Refresh cart
        return response;
    } catch (error) {
        console.error('Failed to place order:', error);
        showMessage('Failed to place order: ' + error.message, 'error');
        throw error;
    }
}

// Reviews Functions
async function loadReviews() {
    try {
        if (!elements.reviewsGrid) {
            console.error('reviewsGrid element not found');
            return;
        }
        
        showLoading(elements.reviewsGrid);
        const reviewsData = await apiCall('/reviews/get_all_reviews/');
        // The backend returns {general: [], item: [], order: []}
        const reviews = reviewsData.general || [];
        console.log('Reviews loaded:', reviews);
        displayReviews(reviews);
    } catch (error) {
        console.error('Failed to load reviews:', error);
        showMessage('Failed to load reviews', 'error');
        if (elements.reviewsGrid) {
            elements.reviewsGrid.innerHTML = '<p>Failed to load reviews. Please try again later.</p>';
        }
    }
}

function displayReviews(reviews) {
    if (reviews.length === 0) {
        elements.reviewsGrid.innerHTML = '<p>No reviews available yet.</p>';
        return;
    }
    
    elements.reviewsGrid.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-avatar">
                    ${review.user_id.toString().charAt(0).toUpperCase()}
                </div>
                <div class="review-info">
                    <h4>User ${review.user_id}</h4>
                    <div class="review-rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                </div>
            </div>
            <div class="review-content">
                "${review.content}"
            </div>
        </div>
    `).join('');
}

// Modal Functions
function openModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => closeModal(modal));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    elements = {
        // Navigation
        loginBtn: document.getElementById('loginBtn'),
        signupBtn: document.getElementById('signupBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        profileBtn: document.getElementById('profileBtn'),
        cartBtn: document.getElementById('cartBtn'),
        cartCount: document.getElementById('cartCount'),
        
        // Modals
        loginModal: document.getElementById('loginModal'),
        signupModal: document.getElementById('signupModal'),
        itemsModal: document.getElementById('itemsModal'),
        cartModal: document.getElementById('cartModal'),
        checkoutModal: document.getElementById('checkoutModal'),
        
        // Forms
        loginForm: document.getElementById('loginForm'),
        signupForm: document.getElementById('signupForm'),
        checkoutForm: document.getElementById('checkoutForm'),
        
        // Content areas
        categoriesGrid: document.getElementById('categoriesGrid'),
        itemsGrid: document.getElementById('itemsGrid'),
        reviewsGrid: document.getElementById('reviewsGrid'),
        cartItems: document.getElementById('cartItems'),
        cartTotal: document.getElementById('cartTotal'),
        orderSummary: document.getElementById('orderSummary'),
        orderTotal: document.getElementById('orderTotal'),
        
        // Modal elements
        modalTitle: document.getElementById('modalTitle'),
        closeButtons: document.querySelectorAll('.close'),
        
        // Auth switches
        switchToSignup: document.getElementById('switchToSignup'),
        switchToLogin: document.getElementById('switchToLogin')
    };

    // Initialize app
    if (authToken) {
        getCurrentUser().then(() => {
            // Cart will be loaded by getCurrentUser
        }).catch(error => {
            console.error('Failed to initialize user:', error);
        });
    }
    
    loadCategories();
    loadReviews();
    
    // Navigation events
    elements.loginBtn.addEventListener('click', () => openModal(elements.loginModal));
    elements.signupBtn.addEventListener('click', () => openModal(elements.signupModal));
    elements.logoutBtn.addEventListener('click', logout);
    elements.profileBtn.addEventListener('click', () => {
        window.location.href = 'html/profile.html';
    });
    // Cart button is now a link to cart.html, no need for modal trigger
    
    // Modal close events
    elements.closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
    
    // Auth form events
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await login(email, password);
            closeModal(elements.loginModal);
            showMessage('Login successful!');
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
    
    elements.signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            username: document.getElementById('signupUsername').value,
            email: document.getElementById('signupEmail').value,
            phone: document.getElementById('signupPhone').value,
            password: document.getElementById('signupPassword').value
        };
        
        try {
            await signup(userData);
            closeModal(elements.signupModal);
            showMessage('Account created successfully! Please login.');
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
    
    // Auth switch events
    elements.switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(elements.loginModal);
        openModal(elements.signupModal);
    });
    
    elements.switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(elements.signupModal);
        openModal(elements.loginModal);
    });
    
    // Cart events
    document.getElementById('clearCart').addEventListener('click', clearCart);
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            showMessage('Your cart is empty', 'warning');
            return;
        }
        
        // Prepare order summary
        const orderItems = cart.map(item => `
            <div class="order-item">
                <span>${item.item_name} x${item.quantity}</span>
                <span>${formatPrice(item.total_price)}</span>
            </div>
        `).join('');
        
        elements.orderSummary.innerHTML = orderItems;
        const total = cart.reduce((sum, item) => sum + (item.total_price || 0), 0);
        elements.orderTotal.textContent = formatPrice(total);
        
        closeModal(elements.cartModal);
        openModal(elements.checkoutModal);
    });
    
    // Checkout form event
    elements.checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const address = document.getElementById('checkoutAddress').value;
        
        try {
            await checkout(address);
        } catch (error) {
            // Error already handled in checkout function
        }
    });
    
    // Smooth scrolling for navigation links
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
    
    // Hero button events
    document.querySelector('.hero-buttons .btn-primary').addEventListener('click', () => {
        document.getElementById('categories').scrollIntoView({ behavior: 'smooth' });
    });
    
    document.querySelector('.hero-buttons .btn-outline').addEventListener('click', () => {
        document.getElementById('categories').scrollIntoView({ behavior: 'smooth' });
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});

// Export functions for global use
window.loadCategoryItems = loadCategoryItems;
window.changeQuantity = changeQuantity;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart; 