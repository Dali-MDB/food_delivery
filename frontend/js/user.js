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
        let html = '<h3 style="margin-bottom:0.5em; color:#2563eb;">Orders</h3>';
        let hasAny = false;
        for (const status of ["RECEIVED", "PREPARING", "DELIVERING", "DELIVERED", "CANCELLED"]) {
            const orders = ordersByStatus[status] || [];
            if (orders.length) {
                hasAny = true;
                html += `<h4 style=\"color:#2563eb; margin-top:1em;\">${status.charAt(0) + status.slice(1).toLowerCase()} Orders</h4>`;
                html += '<div class="orders-card-list">' +
                    orders.map(order =>
                        `<div class="order-card">
                            <div class="order-card-header">
                                <span class="order-id">Order #${order.id}</span>
                                <span class="order-status badge badge-${status.toLowerCase()}">${order.status}</span>
                            </div>
                            <div class="order-card-body">
                                <div><i class='fas fa-map-marker-alt'></i> <span>${order.address ? order.address : '-'}</span></div>
                                <div><i class='fas fa-calendar'></i> <span>${order.ordered_at ? new Date(order.ordered_at).toLocaleString() : '-'}</span></div>
                            </div>
                        </div>`
                    ).join('') + '</div>';
            }
        }
        if (!hasAny) {
            html += '<div style="color:#888;">No orders found.</div>';
        }
        sectionOrders.innerHTML = html;
    } catch {
        sectionOrders.innerHTML = '<div style=\"color:#e74c3c;\">Failed to load orders.</div>';
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

document.addEventListener('DOMContentLoaded', async () => {
    updateNavbarAuthUI();
    // Restrict access to admins only
    sectionProfile.innerHTML = '<div style="color:#2563eb;">Checking admin access...</div>';
    const allowed = await checkAdminAccess();
    if (!allowed) return;
    fetchUserProfile();
    switchTab('profile');
}); 