// Categories Page Specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load categories
    loadCategories();
    
    // Event listeners for cart and checkout
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
});

async function loadCategories() {
    try {
        showLoading(document.getElementById('categoriesGrid'));
        const categories = await apiCall('/category/all/');
        displayCategories(categories);
    } catch (error) {
        showMessage('Failed to load categories', 'error');
        document.getElementById('categoriesGrid').innerHTML = '<p>Failed to load categories. Please try again later.</p>';
    }
}

function displayCategories(categories) {
    const categoryIcons = [
        'fas fa-pizza-slice',
        'fas fa-hamburger',
        'fas fa-ice-cream',
        'fas fa-coffee',
        'fas fa-utensils',
        'fas fa-birthday-cake'
    ];
    
    document.getElementById('categoriesGrid').innerHTML = categories.map((category, index) => `
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
    window.location.href = `category.html?id=${categoryId}`;
} 