// Category Page Specific JavaScript
let currentCategory = null;
let categoryItems = [];

// Wait for both DOM and app.js to be ready
function initializeCategoryPage() {
    // Get category ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');
    
    if (!categoryId) {
        showMessage('No category specified', 'error');
        window.location.href = 'categories.html';
        return;
    }

    // Load category and items
    loadCategory(categoryId);
    loadCategoryItems(categoryId);

    // Event listeners
    document.getElementById('sortSelect').addEventListener('change', handleSort);
    
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
        
        document.getElementById('orderSummary').innerHTML = orderItems;
        const total = cart.reduce((sum, item) => sum + (item.total_price || 0), 0);
        document.getElementById('orderTotal').textContent = formatPrice(total);
        
        closeModal(document.getElementById('cartModal'));
        openModal(document.getElementById('checkoutModal'));
    });

    // Checkout form event
    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const address = document.getElementById('checkoutAddress').value;
        
        try {
            await checkout(address);
            showMessage('Order placed successfully!', 'success');
            closeModal(document.getElementById('checkoutModal'));
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 2000);
        } catch (error) {
            showMessage('Failed to place order', 'error');
        }
    });
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Category page DOM loaded');
    
    // Check if app.js functions are available
    if (typeof apiCall === 'undefined') {
        console.log('apiCall not available, waiting...');
        // Wait a bit more for app.js to load
        setTimeout(() => {
            if (typeof apiCall === 'undefined') {
                console.error('apiCall still not available after timeout');
                showMessage('Failed to initialize page. Please refresh.', 'error');
            } else {
                console.log('apiCall now available, initializing...');
                initializeCategoryPage();
            }
        }, 500);
    } else {
        console.log('apiCall available, initializing immediately...');
        initializeCategoryPage();
    }
});

async function loadCategory(categoryId) {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try {
            console.log(`Loading category with ID: ${categoryId} (attempt ${retryCount + 1})`);
            console.log('API_BASE_URL:', typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'undefined');
            console.log('apiCall function:', typeof apiCall !== 'undefined' ? 'available' : 'undefined');
            
            const category = await apiCall(`/category/${categoryId}/view/`);
            console.log('Category loaded:', category);
            currentCategory = category;
            displayCategoryInfo(category);
            updatePageTitle(category.name);
            return; // Success, exit the retry loop
        } catch (error) {
            retryCount++;
            console.error(`Failed to load category (attempt ${retryCount}):`, error);
            
            if (retryCount >= maxRetries) {
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    categoryId: categoryId,
                    apiCallAvailable: typeof apiCall !== 'undefined',
                    apiBaseUrl: typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'undefined'
                });
                showMessage('Failed to load category information after multiple attempts', 'error');
            } else {
                console.log(`Retrying in ${retryCount * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
            }
        }
    }
}

async function loadCategoryItems(categoryId) {
    try {
        console.log('Loading items for category ID:', categoryId);
        showLoading(document.getElementById('itemsGrid'));
        const items = await apiCall(`/category/${categoryId}/all_items/`);
        console.log('Items loaded:', items);
        categoryItems = items || [];
        displayCategoryItems(categoryItems);
    } catch (error) {
        console.error('Failed to load category items:', error);
        showMessage('Failed to load items', 'error');
        document.getElementById('itemsGrid').innerHTML = '<p>Failed to load items.</p>';
    }
}

function displayCategoryInfo(category) {
    // Update breadcrumb
    document.getElementById('categoryName').textContent = category.name;
    
    // Update page title and description
    document.getElementById('categoryTitle').textContent = category.name;
    document.getElementById('categoryDescription').textContent = `Explore our delicious ${category.name.toLowerCase()} selection`;
    
    // Update category info section
    document.getElementById('categoryNameHeader').textContent = category.name;
    document.getElementById('categoryDescriptionHeader').textContent = `Discover our amazing ${category.name.toLowerCase()} options`;
    
    // Update category icon based on name
    const icon = getCategoryIcon(category.name);
    document.getElementById('categoryIcon').className = icon;
    
    // Update item count
    document.getElementById('itemCount').textContent = `${categoryItems.length} items`;
}

function displayCategoryItems(items) {
    const itemsGrid = document.getElementById('itemsGrid');
    const emptyItems = document.getElementById('emptyItems');

    if (items.length === 0) {
        itemsGrid.style.display = 'none';
        emptyItems.style.display = 'block';
        return;
    }

    itemsGrid.style.display = 'grid';
    emptyItems.style.display = 'none';

    itemsGrid.innerHTML = items.map(item => `
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

function handleSort() {
    const sortBy = document.getElementById('sortSelect').value;
    let sortedItems = [...categoryItems];

    switch (sortBy) {
        case 'name':
            sortedItems.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price-low':
            sortedItems.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedItems.sort((a, b) => b.price - a.price);
            break;
    }

    displayCategoryItems(sortedItems);
}

function getCategoryIcon(categoryName) {
    const iconMap = {
        'Pizza': 'fas fa-pizza-slice',
        'Burgers': 'fas fa-hamburger',
        'Desserts': 'fas fa-ice-cream',
        'Beverages': 'fas fa-coffee',
        'Pasta': 'fas fa-utensils',
        'Salads': 'fas fa-leaf'
    };
    
    return iconMap[categoryName] || 'fas fa-utensils';
}

function updatePageTitle(categoryName) {
    document.title = `${categoryName} - FoodExpress`;
}

function changeQuantity(itemId, change) {
    const input = document.getElementById(`qty-${itemId}`);
    const newValue = Math.max(1, Math.min(10, parseInt(input.value) + change));
    input.value = newValue;
}

async function addToCart(itemId, itemName, itemPrice) {
    if (!currentUser) {
        showMessage('Please login to add items to cart', 'warning');
        openModal(document.getElementById('loginModal'));
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
        await apiCall(`/orders/add_to_cart/${itemId}/?quantity=${quantity}`, {
            method: 'POST'
        });
        
        showMessage(`${itemName} added to cart!`);
        await loadCart();
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add item to cart', 'error');
    }
}

async function loadCart() {
    if (!currentUser) return;
    
    try {
        const cartData = await apiCall('/orders/view_cart/');
        cart = cartData.item_orders || [];
        updateCartUI();
    } catch (error) {
        console.error('Failed to load cart:', error);
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
    
    if (cart.length === 0) {
        document.getElementById('cartItems').innerHTML = '<p>Your cart is empty</p>';
        document.getElementById('cartTotal').textContent = '0.00';
    } else {
        document.getElementById('cartItems').innerHTML = cart.map(item => `
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
        
        const total = cart.reduce((sum, item) => sum + (item.total_price || 0), 0);
        document.getElementById('cartTotal').textContent = formatPrice(total);
    }
}

async function removeFromCart(itemOrderId) {
    try {
        await apiCall(`/orders/remove_from_cart/${itemOrderId}/`, {
            method: 'DELETE'
        });
        
        showMessage('Item removed from cart');
        await loadCart();
    } catch (error) {
        showMessage('Failed to remove item from cart', 'error');
    }
}

async function clearCart() {
    if (!currentUser) return;
    
    try {
        // Remove all items one by one
        for (const item of cart) {
            await apiCall(`/orders/remove_from_cart/${item.item_order_id}/`, {
                method: 'DELETE'
            });
        }
        
        showMessage('Cart cleared');
        await loadCart();
    } catch (error) {
        showMessage('Failed to clear cart', 'error');
    }
}

async function checkout(address) {
    try {
        const response = await apiCall('/orders/confirm_order/', {
            method: 'POST',
            body: JSON.stringify({ address })
        });
        
        return response;
    } catch (error) {
        showMessage('Failed to place order', 'error');
        throw error;
    }
} 