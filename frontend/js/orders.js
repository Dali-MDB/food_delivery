// Orders Page Specific JavaScript
let currentPage = 1;
let currentFilter = 'all';
let allOrders = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Orders page loaded');
    
    // Initialize authentication state first
    await initializeAuthState();
    
    // Check if user is authenticated
    if (!currentUser) {
        showMessage('Please login to view your orders', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // Load orders on page load
    loadOrders();

    // Event listeners for filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            filterOrders();
        });
    });

    // Load more button
    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreOrders);
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

async function loadOrders() {
    try {
        showLoading(document.getElementById('ordersList'));
        const ordersData = await apiCall(`/orders/view_orders/${currentUser.id}/`);
        allOrders = ordersData || [];
        filterOrders();
    } catch (error) {
        console.error('Failed to load orders:', error);
        showMessage('Failed to load orders', 'error');
        document.getElementById('ordersList').innerHTML = '<p>Failed to load orders.</p>';
    }
}

function filterOrders() {
    const filteredOrders = currentFilter === 'all' 
        ? allOrders 
        : allOrders.filter(order => order.status === currentFilter);
    
    displayOrders(filteredOrders);
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    const emptyOrders = document.getElementById('emptyOrders');

    if (orders.length === 0) {
        ordersList.style.display = 'none';
        emptyOrders.style.display = 'block';
        return;
    }

    ordersList.style.display = 'block';
    emptyOrders.style.display = 'none';

    ordersList.innerHTML = orders.map(order => `
        <div class="order-card" onclick="viewOrderDetails(${order.id})">
            <div class="order-card-header">
                <div class="order-number">Order #${order.id}</div>
                <span class="order-status ${order.status}">${formatStatus(order.status)}</span>
            </div>
            <div class="order-details">
                <div class="order-detail">
                    <div class="order-detail-label">Order Date</div>
                    <div class="order-detail-value">${formatDate(order.ordered_at)}</div>
                </div>
                <div class="order-detail">
                    <div class="order-detail-label">Total Amount</div>
                    <div class="order-detail-value">${formatPrice(order.calculate_total)}</div>
                </div>
                <div class="order-detail">
                    <div class="order-detail-label">Items</div>
                    <div class="order-detail-value">${order.item_orders ? order.item_orders.length : 0} items</div>
                </div>
            </div>
            <div class="order-actions">
                <button class="btn btn-outline" onclick="event.stopPropagation(); viewOrderDetails(${order.id})">View Details</button>
                ${order.status === 'pending' ? `<button class="btn btn-outline" onclick="event.stopPropagation(); cancelOrder(${order.id})">Cancel</button>` : ''}
            </div>
        </div>
    `).join('');
}

async function viewOrderDetails(orderId) {
    try {
        const order = await apiCall(`/orders/view_order/${orderId}/`);
        displayOrderDetails(order);
        openModal(document.getElementById('orderDetailsModal'));
    } catch (error) {
        showMessage('Failed to load order details', 'error');
    }
}

function displayOrderDetails(order) {
    document.getElementById('orderNumber').textContent = order.id;
    document.getElementById('orderStatus').textContent = formatStatus(order.status);
    document.getElementById('orderStatus').className = `order-status ${order.status}`;
    document.getElementById('orderDate').textContent = formatDate(order.ordered_at);
    document.getElementById('orderAddress').textContent = order.address || 'N/A';
    document.getElementById('orderTotal').textContent = formatPrice(order.calculate_total);

    // Display order items
    const orderItemsList = document.getElementById('orderItemsList');
    if (order.item_orders && order.item_orders.length > 0) {
        orderItemsList.innerHTML = order.item_orders.map(item => `
            <div class="order-item">
                <span>${item.item.name} x${item.quantity}</span>
                <span>${formatPrice(item.total_price)}</span>
            </div>
        `).join('');
    } else {
        orderItemsList.innerHTML = '<p>No items found</p>';
    }

    // Show/hide cancel button based on order status
    const cancelBtn = document.getElementById('cancelOrder');
    if (order.status === 'pending') {
        cancelBtn.style.display = 'inline-block';
        cancelBtn.onclick = () => cancelOrder(order.id);
    } else {
        cancelBtn.style.display = 'none';
    }

    // Set up reorder button
    document.getElementById('reorderBtn').onclick = () => reorderItems(order.item_orders);
    
    // Set up review button
    document.getElementById('leaveReview').onclick = () => {
        closeModal(document.getElementById('orderDetailsModal'));
        openReviewModal(order.id);
    };
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    try {
        await apiCall(`/orders/cancel_order/${orderId}/`, {
            method: 'POST'
        });
        
        showMessage('Order cancelled successfully');
        closeModal(document.getElementById('orderDetailsModal'));
        await loadOrders();
    } catch (error) {
        showMessage('Failed to cancel order', 'error');
    }
}

async function reorderItems(itemOrders) {
    try {
        // Add all items from the order to cart
        for (const itemOrder of itemOrders) {
            await apiCall(`/orders/add_to_cart/${itemOrder.item_id}/?quantity=${itemOrder.quantity}`, {
                method: 'POST'
            });
        }
        
        showMessage('Items added to cart successfully!');
        closeModal(document.getElementById('orderDetailsModal'));
        // Redirect to cart page
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 1500);
    } catch (error) {
        showMessage('Failed to add items to cart', 'error');
    }
}

function openReviewModal(orderId) {
    // Store the order ID for the review
    window.currentReviewOrderId = orderId;
    openModal(document.getElementById('reviewModal'));
}

async function loadMoreOrders() {
    currentPage++;
    try {
        const moreOrders = await apiCall(`/orders/view_orders/${currentUser.id}/?page=${currentPage}`);
        if (moreOrders && moreOrders.length > 0) {
            allOrders = [...allOrders, ...moreOrders];
            filterOrders();
        } else {
            document.getElementById('loadMoreBtn').style.display = 'none';
        }
    } catch (error) {
        showMessage('Failed to load more orders', 'error');
    }
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'preparing': 'Preparing',
        'on_way': 'On the Way',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Review form submission
document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!window.currentReviewOrderId) {
                showMessage('No order selected for review', 'error');
                return;
            }

            const rating = document.querySelector('input[name="rating"]:checked').value;
            const content = document.getElementById('reviewContent').value;

            try {
                await apiCall(`/reviews/add_order_review/${window.currentReviewOrderId}/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        content: content,
                        rating: parseInt(rating)
                    })
                });
                
                showMessage('Review submitted successfully!');
                closeModal(document.getElementById('reviewModal'));
                window.currentReviewOrderId = null;
            } catch (error) {
                showMessage('Failed to submit review', 'error');
            }
        });
    }
}); 