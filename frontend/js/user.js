// User Profile Page JS
// On page load, get user ID from URL
function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

const userId = getUserIdFromUrl();
const authToken = localStorage.getItem('authToken');

const usernameEl = document.getElementById('userProfileUsername');
const emailEl = document.getElementById('userProfileEmail');
const phoneEl = document.getElementById('userProfilePhone');
const extraEl = document.getElementById('userProfileExtra');

const tabProfile = document.getElementById('userTabProfile');
const tabOrders = document.getElementById('userTabOrders');
const tabReviews = document.getElementById('userTabReviews');
const sectionProfile = document.getElementById('userProfileSection');
const sectionOrders = document.getElementById('userOrdersSection');
const sectionReviews = document.getElementById('userReviewsSection');

let ordersLoaded = false;
let reviewsLoaded = false;

function showLoading() {
    extraEl.innerHTML = '<div style="color:#2563eb;">Loading user data...</div>';
}
function showError(msg) {
    extraEl.innerHTML = `<div style="color:#e74c3c;">${msg}</div>`;
}

function switchTab(tab) {
    tabProfile.classList.remove('active');
    tabOrders.classList.remove('active');
    tabReviews.classList.remove('active');
    tabProfile.style.color = '#888';
    tabOrders.style.color = '#888';
    tabReviews.style.color = '#888';
    tabProfile.style.borderBottom = '2.5px solid transparent';
    tabOrders.style.borderBottom = '2.5px solid transparent';
    tabReviews.style.borderBottom = '2.5px solid transparent';
    sectionProfile.style.display = 'none';
    sectionOrders.style.display = 'none';
    sectionReviews.style.display = 'none';
    if (tab === 'profile') {
        tabProfile.classList.add('active');
        tabProfile.style.color = '#2563eb';
        tabProfile.style.borderBottom = '2.5px solid #2563eb';
        sectionProfile.style.display = '';
    } else if (tab === 'orders') {
        tabOrders.classList.add('active');
        tabOrders.style.color = '#2563eb';
        tabOrders.style.borderBottom = '2.5px solid #2563eb';
        sectionOrders.style.display = '';
        if (!ordersLoaded) {
            renderOrdersSection();
            ordersLoaded = true;
        }
    } else if (tab === 'reviews') {
        tabReviews.classList.add('active');
        tabReviews.style.color = '#2563eb';
        tabReviews.style.borderBottom = '2.5px solid #2563eb';
        sectionReviews.style.display = '';
        if (!reviewsLoaded) {
            renderReviewsSection();
            reviewsLoaded = true;
        }
    }
}

tabProfile.addEventListener('click', () => switchTab('profile'));
tabOrders.addEventListener('click', () => switchTab('orders'));
tabReviews.addEventListener('click', () => switchTab('reviews'));

// Fetch and render orders
async function renderOrdersSection() {
    sectionOrders.innerHTML = '<div style="color:#2563eb;">Loading orders...</div>';
    try {
        const ordersRes = await fetch(`http://localhost:8000/orders/view_orders/${userId}/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        let ordersByStatus = { RECEIVED: [], PREPARING: [], DELIVERING: [], DELIVERED: [], CANCELLED: [] };
        if (ordersRes.ok) ordersByStatus = await ordersRes.json();
        
        // Create the orders section with tabs
        let html = `
            <div class="user-orders-container">
                <h3 style="margin-bottom:1em; color:#2563eb;">Orders</h3>
                <div class="user-orders-tabs" style="display:flex;gap:1.5em;margin-bottom:2em;">
                    ${["RECEIVED", "PREPARING", "DELIVERING", "DELIVERED", "CANCELLED"].map(status =>
                        `<button id="userTabOrders${status}" class="user-orders-tab" style="background:none;border:none;font-size:1.1em;font-weight:600;color:#888;padding:0.7em 0.5em;border-bottom:2.5px solid transparent;cursor:pointer;">${status.charAt(0) + status.slice(1).toLowerCase()}</button>`
                    ).join('')}
                </div>
                <div id="userOrdersTableContainer"></div>
            </div>
        `;
        
        sectionOrders.innerHTML = html;
        
        // Set up tab functionality and render initial orders
        setupUserOrdersTabs(ordersByStatus);
        renderUserOrdersTable(ordersByStatus, 'RECEIVED'); // Default to RECEIVED tab
        
    } catch {
        sectionOrders.innerHTML = '<div style="color:#e74c3c;">Failed to load orders.</div>';
    }
}

// Set up user orders tabs
function setupUserOrdersTabs(ordersByStatus) {
    const ORDER_STATUSES = ["RECEIVED", "PREPARING", "DELIVERING", "DELIVERED", "CANCELLED"];
    
    ORDER_STATUSES.forEach(status => {
        const btn = document.getElementById(`userTabOrders${status}`);
        if (btn) {
            btn.onclick = () => switchUserOrderTab(status, ordersByStatus);
        }
    });
    
    // Set RECEIVED as active by default
    const receivedBtn = document.getElementById('userTabOrdersRECEIVED');
    if (receivedBtn) {
        receivedBtn.style.color = '#2563eb';
        receivedBtn.style.borderBottom = '2.5px solid #2563eb';
    }
}

// Switch user order tab
function switchUserOrderTab(status, ordersByStatus) {
    // Update tab styles
    const ORDER_STATUSES = ["RECEIVED", "PREPARING", "DELIVERING", "DELIVERED", "CANCELLED"];
    ORDER_STATUSES.forEach(s => {
        const btn = document.getElementById(`userTabOrders${s}`);
        if (btn) {
            btn.style.color = '#888';
            btn.style.borderBottom = '2.5px solid transparent';
        }
    });
    
    const activeBtn = document.getElementById(`userTabOrders${status}`);
    if (activeBtn) {
        activeBtn.style.color = '#2563eb';
        activeBtn.style.borderBottom = '2.5px solid #2563eb';
    }
    
    // Render orders for selected status
    renderUserOrdersTable(ordersByStatus, status);
}

// Render user orders table
function renderUserOrdersTable(ordersByStatus, status) {
    const container = document.getElementById('userOrdersTableContainer');
    const orders = ordersByStatus[status] || [];
    
    if (orders.length) {
        let html = `
            <div class="user-orders-table">
                <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background:#f8f9fa;border-bottom:2px solid #dee2e6;">
                            <th style="padding:12px;text-align:left;font-weight:600;color:#374151;">Order ID</th>
                            <th style="padding:12px;text-align:left;font-weight:600;color:#374151;">Customer</th>
                            <th style="padding:12px;text-align:left;font-weight:600;color:#374151;">Address</th>
                            <th style="padding:12px;text-align:left;font-weight:600;color:#374151;">Date</th>
                            <th style="padding:12px;text-align:center;font-weight:600;color:#374151;">Status</th>
                            <th style="padding:12px;text-align:right;font-weight:600;color:#374151;">Total</th>
                            <th style="padding:12px;text-align:center;font-weight:600;color:#374151;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => {
                            // Check if order can be cancelled
                            const canCancel = order.status !== 'PENDING' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
                            
                            return `
                                <tr style="border-bottom:1px solid #f3f4f6;">
                                    <td style="padding:12px;text-align:left;font-weight:600;color:#1f2937;">#${order.id}</td>
                                    <td style="padding:12px;text-align:left;color:#6b7280;">
                                        <div style="font-weight:500;color:#1f2937;">${order.username || 'N/A'}</div>
                                        <div style="font-size:0.85em;color:#9ca3af;">${order.email || 'N/A'}</div>
                                        <div style="font-size:0.85em;color:#9ca3af;">${order.phone || 'N/A'}</div>
                                    </td>
                                    <td style="padding:12px;text-align:left;color:#6b7280;max-width:200px;word-wrap:break-word;">
                                        ${order.address || 'N/A'}
                                    </td>
                                    <td style="padding:12px;text-align:left;color:#6b7280;">
                                        ${order.ordered_at ? new Date(order.ordered_at).toLocaleString() : 'N/A'}
                                    </td>
                                    <td style="padding:12px;text-align:center;">
                                        <span class="badge badge-${order.status.toLowerCase()}">${order.status}</span>
                                    </td>
                                    <td style="padding:12px;text-align:right;font-weight:600;color:#059669;">
                                        $${order.calculate_total ? parseFloat(order.calculate_total).toFixed(2) : '0.00'}
                                    </td>
                                    <td style="padding:12px;text-align:center;">
                                        <div style="display:flex;gap:0.25rem;justify-content:center;align-items:center;">
                                            <button class="btn btn-outline btn-xs" onclick="viewOrderDetails(${order.id})" title="View Order Details">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <div style="position:relative;">
                                                <button class="btn btn-outline btn-xs" onclick="toggleStatusDropdown(${order.id})" title="Change Status">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <div id="statusDropdown${order.id}" class="status-dropdown" style="display:none;position:absolute;top:100%;right:0;background:#fff;border:1px solid #d1d5db;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);z-index:1000;min-width:120px;">
                                                    <div style="padding:0.5em;font-size:0.8em;color:#6b7280;border-bottom:1px solid #e5e7eb;">Change Status</div>
                                                    ${["RECEIVED", "PREPARING", "DELIVERING", "DELIVERED", "CANCELLED"].map(status => 
                                                        status !== order.status ? 
                                                            `<div onclick="changeOrderStatus(${order.id}, '${status}')" style="padding:0.5em 0.75em;cursor:pointer;font-size:0.85em;color:#374151;hover:background:#f3f4f6;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background=''">${status.charAt(0) + status.slice(1).toLowerCase()}</div>` 
                                                        : ''
                                                    ).join('')}
                                                </div>
                                            </div>
                                            ${canCancel ? `
                                                <button class="btn btn-danger btn-xs" onclick="cancelOrder(${order.id})" title="Cancel Order">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div style="color:#888;text-align:center;padding:2em;">No orders found for this status.</div>';
    }
}

// Fetch and render reviews
async function renderReviewsSection() {
    sectionReviews.innerHTML = '<div style="color:#2563eb;">Loading reviews...</div>';
    try {
        const reviewsRes = await fetch(`http://localhost:8000/reviews/view_user_reviews/${userId}/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        let reviews = { general: [], item_review: [], order_review: [] };
        if (reviewsRes.ok) reviews = await reviewsRes.json();
        let html = '<h3 style="margin-bottom:0.5em; color:#2563eb;">Reviews</h3>';
        let hasAny = false;
        // Helper to render a review card
        function reviewCard(review, type) {
            let itemBtn = '';
            if (type === 'item_review' && review.item_id) {
                itemBtn = `<button class=\"item-info-btn\" onclick=\"showItemInfo(${review.item_id})\" title=\"View Item Info\"><i class='fas fa-info-circle'></i> <span style=\"font-size:0.98em; font-weight:500; color:#2563eb; margin-left:0.3em;\">View Item</span></button>`;
            }
            return `<div class=\"review-card\">
                <div class=\"review-content\">
                    <span class=\"review-rating\">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                    <span class=\"review-text\">${review.content}</span>
                </div>
                <div style=\"display:flex;align-items:center;gap:0.5em;\">${itemBtn}<button class=\"delete-review-btn\" title=\"Delete Review\" onclick=\"deleteReview(${review.id})\"><i class='fas fa-trash'></i></button></div>
            </div>`;
        }
        if (reviews.general && reviews.general.length) {
            hasAny = true;
            html += '<div class="review-section"><h4 style="color:#2563eb; margin-top:1em;">General Reviews</h4>' +
                reviews.general.map(review => reviewCard(review, 'general')).join('') + '</div>';
        }
        if (reviews.item_review && reviews.item_review.length) {
            hasAny = true;
            html += '<div class="review-section"><h4 style="color:#2563eb; margin-top:1em;">Item Reviews</h4>' +
                reviews.item_review.map(review => reviewCard(review, 'item_review')).join('') + '</div>';
        }
        if (reviews.order_review && reviews.order_review.length) {
            hasAny = true;
            html += '<div class="review-section"><h4 style="color:#2563eb; margin-top:1em;">Order Reviews</h4>' +
                reviews.order_review.map(review => reviewCard(review, 'order_review')).join('') + '</div>';
        }
        if (!hasAny) {
            html += '<div style="color:#888;">No reviews found.</div>';
        }
        sectionReviews.innerHTML = html;
    } catch {
        sectionReviews.innerHTML = '<div style=\"color:#e74c3c;\">Failed to load reviews.</div>';
    }
}

// Delete review function
window.deleteReview = async function(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
        const res = await fetch(`http://localhost:8000/reviews/delete_review/${reviewId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            renderReviewsSection();
        } else {
            alert('Failed to delete review.');
        }
    } catch {
        alert('Failed to delete review.');
    }
}

// Only render profile info in the profile section now
async function fetchUserProfile() {
    if (!userId) {
        sectionProfile.innerHTML = '<div style="color:#e74c3c;">No user ID specified.</div>';
        return;
    }
    sectionProfile.innerHTML = '<div style="color:#2563eb;">Loading user data...</div>';
    try {
        // Fetch user info
        const userRes = await fetch(`http://localhost:8000/profile/user/${userId}/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!userRes.ok) throw new Error('Failed to fetch user info');
        const user = await userRes.json();
        sectionProfile.innerHTML = `<div class="user-profile-header">
            <div class="user-avatar-large" id="userProfileAvatar"><i class="fas fa-user"></i></div>
            <div class="user-profile-details">
                <h2 id="userProfileUsername">${user.username}</h2>
                <div class="user-email" id="userProfileEmail">${user.email || '-'}</div>
                <div class="user-phone" id="userProfilePhone">Phone: ${user.phone || '-'}</div>
            </div>
        </div>`;
    } catch (err) {
        sectionProfile.innerHTML = '<div style="color:#e74c3c;">Failed to load user data.</div>';
    }
}

async function checkAdminAccess() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = '../html/index.html';
        return false;
    }
    try {
        const response = await fetch('http://localhost:8000/profile/is_admin/', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.status === 401) {
            window.location.href = '../html/index.html';
            return false;
        }
        const isAdmin = await response.json();
        if (isAdmin !== true) {
            window.location.href = '../html/index.html';
            return false;
        }
        return true;
    } catch {
        window.location.href = '../html/index.html';
        return false;
    }
}

function updateNavbarAuthUI() {
    const authToken = localStorage.getItem('authToken');
    const adminBtn = document.getElementById('adminBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');
    if (!authToken) {
        if (adminBtn) adminBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        return;
    }
    // Check admin status
    fetch('http://localhost:8000/profile/is_admin/', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(isAdmin => {
        if (adminBtn) adminBtn.style.display = isAdmin === true ? 'inline-block' : 'none';
    })
    .catch(() => { if (adminBtn) adminBtn.style.display = 'none'; });
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (profileBtn) profileBtn.style.display = 'inline-block';
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
}

// Item info modal logic
window.showItemInfo = async function(itemId) {
    let modal = document.getElementById('itemInfoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'itemInfoModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class='modal-content' id='itemInfoModalContent'></div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) hideItemInfo();
        });
    }
    const content = document.getElementById('itemInfoModalContent');
    content.innerHTML = '<div style="padding:2em;text-align:center;color:#2563eb;">Loading item info...</div>';
    modal.style.display = 'block';
    try {
        const res = await fetch(`http://localhost:8000/items/${itemId}/view/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch item info');
        const item = await res.json();
        content.innerHTML = `<div style='padding:1.5em 1em;'>
            <h2 style='color:#2563eb;margin-bottom:0.5em;'>${item.name}</h2>
            <div style='color:#555;margin-bottom:0.7em;'>${item.description || ''}</div>
            <div style='color:#059669;font-weight:600;margin-bottom:0.7em;'>Price: $${parseFloat(item.price).toFixed(2)}</div>
            <div style='color:#888;'>Category: ${item.category_name || '-'}</div>
            <button onclick='hideItemInfo()' class='btn btn-outline' style='margin-top:1.5em;'>Close</button>
        </div>`;
    } catch {
        content.innerHTML = `<div style='padding:2em;text-align:center;color:#e74c3c;'>Failed to load item info.</div><button onclick='hideItemInfo()' class='btn btn-outline' style='margin-top:1.5em;'>Close</button>`;
    }
}
window.hideItemInfo = function() {
    const modal = document.getElementById('itemInfoModal');
    if (modal) modal.style.display = 'none';
}

// Order action functions
window.viewOrderDetails = async function(orderId) {
    let modal = document.getElementById('orderDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'orderDetailsModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class='modal-content' id='orderDetailsModalContent'></div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) hideOrderDetails();
        });
    }
    
    const content = document.getElementById('orderDetailsModalContent');
    content.innerHTML = '<div style="padding:2em;text-align:center;color:#2563eb;">Loading order details...</div>';
    modal.style.display = 'block';
    
    try {
        const res = await fetch(`http://localhost:8000/orders/view_order/${orderId}/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch order details');
        const order = await res.json();
        
        let itemsHtml = '';
        if (order.items && order.items.length > 0) {
            itemsHtml = `
                <div style="margin-top:1em;">
                    <h4 style="color:#374151;margin-bottom:0.5em;">Order Items:</h4>
                    <div style="background:#f8f9fa;border-radius:6px;padding:1em;">
                        ${order.items.map(item => `
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5em 0;border-bottom:1px solid #e5e7eb;">
                                <div>
                                    <div style="font-weight:600;color:#1f2937;">${item.name}</div>
                                    <div style="color:#6b7280;font-size:0.9em;">Quantity: ${item.quantity}</div>
                                </div>
                                <div style="font-weight:600;color:#059669;">$${parseFloat(item.price).toFixed(2)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        content.innerHTML = `
            <div style='padding:1.5em;max-width:500px;'>
                <h2 style='color:#2563eb;margin-bottom:1em;'>Order #${order.id}</h2>
                <div style='margin-bottom:0.5em;'>
                    <strong style='color:#374151;'>Status:</strong> 
                    <span class="badge badge-${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div style='margin-bottom:0.5em;'>
                    <strong style='color:#374151;'>Address:</strong> 
                    <span style='color:#6b7280;'>${order.address || 'N/A'}</span>
                </div>
                <div style='margin-bottom:0.5em;'>
                    <strong style='color:#374151;'>Order Date:</strong> 
                    <span style='color:#6b7280;'>${order.ordered_at ? new Date(order.ordered_at).toLocaleString() : 'N/A'}</span>
                </div>
                <div style='margin-bottom:0.5em;'>
                    <strong style='color:#374151;'>Total:</strong> 
                    <span style='color:#059669;font-weight:600;'>$${order.calculate_total ? parseFloat(order.calculate_total).toFixed(2) : '0.00'}</span>
                </div>
                ${itemsHtml}
                <button onclick='hideOrderDetails()' class='btn btn-outline' style='margin-top:1.5em;'>Close</button>
            </div>
        `;
    } catch {
        content.innerHTML = `
            <div style='padding:2em;text-align:center;color:#e74c3c;'>Failed to load order details.</div>
            <button onclick='hideOrderDetails()' class='btn btn-outline' style='margin-top:1.5em;'>Close</button>
        `;
    }
}

window.hideOrderDetails = function() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) modal.style.display = 'none';
}

window.cancelOrder = async function(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
        const res = await fetch(`http://localhost:8000/orders/cancel_order/${orderId}/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (res.ok) {
            alert('Order cancelled successfully!');
            // Refresh the orders section
            renderOrdersSection();
        } else {
            const error = await res.json();
            alert(`Failed to cancel order: ${error.detail || 'Unknown error'}`);
        }
    } catch {
        alert('Failed to cancel order. Please try again.');
    }
}

// Status dropdown functions
window.toggleStatusDropdown = function(orderId) {
    // Close all other dropdowns first
    const allDropdowns = document.querySelectorAll('.status-dropdown');
    allDropdowns.forEach(dropdown => {
        if (dropdown.id !== `statusDropdown${orderId}`) {
            dropdown.style.display = 'none';
        }
    });
    
    // Toggle current dropdown
    const dropdown = document.getElementById(`statusDropdown${orderId}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

window.changeOrderStatus = async function(orderId, newStatus) {
    if (!confirm(`Are you sure you want to change the order status to ${newStatus.toLowerCase()}?`)) return;
    
    try {
        const res = await fetch(`http://localhost:8000/orders/change_order_status/${orderId}/?new_status=${newStatus}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (res.ok) {
            alert('Order status updated successfully!');
            // Close dropdown
            const dropdown = document.getElementById(`statusDropdown${orderId}`);
            if (dropdown) dropdown.style.display = 'none';
            // Refresh the orders section
            renderOrdersSection();
        } else {
            const error = await res.json();
            alert(`Failed to update order status: ${error.detail || 'Unknown error'}`);
        }
    } catch {
        alert('Failed to update order status. Please try again.');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.status-dropdown') && !event.target.closest('button[onclick*="toggleStatusDropdown"]')) {
        const allDropdowns = document.querySelectorAll('.status-dropdown');
        allDropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    updateNavbarAuthUI();
    // Restrict access to admins only
    sectionProfile.innerHTML = '<div style="color:#2563eb;">Checking admin access...</div>';
    const allowed = await checkAdminAccess();
    if (!allowed) return;
    fetchUserProfile();
    switchTab('profile');
});
