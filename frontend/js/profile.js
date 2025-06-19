(function() {
// Profile Page JavaScript
if (!localStorage.getItem('authToken')) {
    alert("You cannot access this page. Please login first.");
    window.location.replace('/frontend/html/index.html');
}

console.log('=== PROFILE.JS SCRIPT LOADED ===');

let currentUser = null;
let userOrders = [];
let userReviewsByType = {};
let userReviews = [];
let currentReviewTypeFilter = 'all';

// API Configuration - Update this with your actual API base URL
const API_BASE_URL = 'http://localhost:8000'; // Change this to your FastAPI server URL

// Utility Functions
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        ${type === 'success' ? 'background-color: #4CAF50;' : ''}
        ${type === 'error' ? 'background-color: #f44336;' : ''}
        ${type === 'warning' ? 'background-color: #ff9800;' : ''}
    `;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
}

// API Call function
async function apiCall(endpoint, options = {}) {
    const authToken = localStorage.getItem('authToken');
    console.log(`Making API call to: ${API_BASE_URL}${endpoint}`);
    console.log('Auth token present:', !!authToken);
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    console.log('Request config:', config);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('authToken');
                showMessage('Session expired. Please login again.', 'warning');
                setTimeout(() => window.location.href = '/frontend/html/index.html', 2000);
                throw new Error('Authentication failed');
            }
            
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            console.error('API Error:', errorData);
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response data:', data);
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== PROFILE PAGE INITIALIZATION START ===');
    console.log('Profile page loaded');
    
    // Check if user is logged in
    const authToken = localStorage.getItem('authToken');
    console.log('Auth token found:', !!authToken);
    
    if (!authToken) {
        console.log('No auth token, redirecting to login...');
        showMessage('Please login to view your profile', 'warning');
        setTimeout(() => window.location.href = '/frontend/html/index.html', 2000);
        return;
    }
    
    try {
        console.log('Attempting to get current user...');
        // Get current user
        currentUser = await apiCall('/auth/current_user/');
        console.log('User authenticated:', currentUser);
        
        console.log('Loading profile data...');
        // Load profile data
        await loadProfileData();
        
        console.log('Loading user orders...');
        await loadUserOrders();
        
        console.log('Loading user reviews...');
        await loadUserReviews();
        
        console.log('Initializing page components...');
        // Initialize page components
        initializeProfilePage();
        
        console.log('=== PROFILE PAGE INITIALIZATION COMPLETE ===');
        
    } catch (error) {
        console.error('=== PROFILE PAGE INITIALIZATION FAILED ===');
        console.error('Failed to initialize profile:', error);
        showMessage('Failed to load profile data: ' + error.message, 'error');
        
        // If authentication fails, redirect to login
        if (error.message.includes('Authentication failed')) {
            setTimeout(() => window.location.href = '/frontend/html/index.html', 2000);
        }
    }
});

async function loadProfileData() {
    try {
        console.log('Loading profile data...');
        
        // Fetch fresh profile data from backend
        const profileData = await apiCall('/profile/me/view/');
        console.log('Profile data from backend:', profileData);
        
        if (profileData) {
            // Update the currentUser object with the fresh data
            currentUser = profileData;
            
            // Update DOM elements
            updateProfileDisplay();
            updateEditProfileForm();
        } else {
            throw new Error('No profile data received');
        }
        
    } catch (error) {
        console.error('Failed to load profile data:', error);
        showMessage('Failed to load profile data: ' + error.message, 'error');
    }
}

function updateProfileDisplay() {
    console.log('Updating profile display with:', currentUser);
    
    // Update sidebar
    const sidebarUsername = document.getElementById('sidebarUsername');
    const sidebarEmail = document.getElementById('sidebarEmail');
    
    if (sidebarUsername) {
        sidebarUsername.textContent = currentUser.username || 'Unknown User';
        console.log('Updated sidebarUsername:', sidebarUsername.textContent);
    }
    if (sidebarEmail) {
        sidebarEmail.textContent = currentUser.email || 'No email';
        console.log('Updated sidebarEmail:', sidebarEmail.textContent);
    }
    
    // Update main profile section
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileJoinDate = document.getElementById('profileJoinDate');
    const memberSince = document.getElementById('memberSince');
    
    if (profileUsername) {
        profileUsername.textContent = currentUser.username || 'Unknown User';
    }
    if (profileEmail) {
        profileEmail.textContent = currentUser.email || 'No email';
    }
    if (profilePhone) {
        profilePhone.textContent = currentUser.phone || 'Not provided';
    }
    
    // Format and display join date
    if (profileJoinDate) {
        const joinDate = new Date(currentUser.created_at || Date.now());
        profileJoinDate.textContent = `Member since: ${joinDate.toLocaleDateString()}`;
    }
    
    // Calculate and display days since joining
    if (memberSince) {
        const joinDate = new Date(currentUser.created_at || Date.now());
        const today = new Date();
        const daysSince = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
        memberSince.textContent = daysSince;
    }
}

function updateEditProfileForm() {
    const editUsername = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    const editPhone = document.getElementById('editPhone');
    if (editUsername) editUsername.placeholder = currentUser.username || '';
    if (editEmail) editEmail.placeholder = currentUser.email || '';
    if (editPhone) editPhone.placeholder = currentUser.phone || '';
}

async function loadUserOrders() {
    try {
        console.log('Loading user orders...');
        const ordersData = await apiCall('/profile/me/my_orders/');
        userOrders = ordersData || [];
        console.log('Orders loaded:', userOrders);
        displayUserOrders();
        updateProfileStats();
    } catch (error) {
        console.error('Failed to load user orders:', error);
        showMessage('Failed to load orders: ' + error.message, 'error');
    }
}

function displayUserOrders() {
    const ordersList = document.getElementById('profileOrdersList');
    if (!ordersList) {
        console.error('profileOrdersList element not found');
        return;
    }
    
    // Flatten orders from grouped structure
    let allOrders = [];
    if (userOrders && typeof userOrders === 'object') {
        Object.values(userOrders).forEach(statusOrders => {
            if (Array.isArray(statusOrders)) {
                allOrders = allOrders.concat(statusOrders);
            }
        });
    } else if (Array.isArray(userOrders)) {
        allOrders = userOrders;
    }
    
    if (allOrders.length === 0) {
        ordersList.innerHTML = '<p class="no-data">No orders found.</p>';
        return;
    }
    
    ordersList.innerHTML = allOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-id">Order #${order.id}</div>
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
        </div>
    `).join('');
}

async function loadUserReviews() {
    try {
        console.log('Loading user reviews...');
        const reviewsData = await apiCall('/profile/me/my_reviews/');
        userReviewsByType = reviewsData || {};
        // Flatten all reviews from the returned object
        userReviews = [];
        if (userReviewsByType && typeof userReviewsByType === 'object') {
            Object.values(userReviewsByType).forEach(arr => {
                if (Array.isArray(arr)) userReviews = userReviews.concat(arr);
            });
        }
        console.log('Reviews loaded:', userReviews);
        displayUserReviews();
        updateProfileStats();
    } catch (error) {
        console.error('Failed to load user reviews:', error);
        showMessage('Failed to load reviews: ' + error.message, 'error');
    }
}

function displayUserReviews() {
    const reviewsList = document.getElementById('profileReviewsList');
    if (!reviewsList) {
        console.error('profileReviewsList element not found');
        return;
    }
    let reviewsToDisplay = [];
    if (currentReviewTypeFilter === 'all') {
        reviewsToDisplay = userReviews;
    } else if (userReviewsByType && typeof userReviewsByType === 'object') {
        if (currentReviewTypeFilter === 'general') {
            reviewsToDisplay = userReviewsByType['general'] || [];
        } else if (currentReviewTypeFilter === 'item_review') {
            reviewsToDisplay = userReviewsByType['item_review'] || [];
        } else if (currentReviewTypeFilter === 'order_review') {
            reviewsToDisplay = userReviewsByType['order_review'] || [];
        }
    }
    if (!reviewsToDisplay || reviewsToDisplay.length === 0) {
        reviewsList.innerHTML = '<p class="no-data">No reviews found.</p>';
        return;
    }
    reviewsList.innerHTML = reviewsToDisplay.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-rating">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                </div>
                <div class="review-date">${formatDate(review.created_at)}</div>
            </div>
            <div class="review-content">
                "${review.content}"
            </div>
        </div>
    `).join('');
}

function updateProfileStats() {
    const totalOrdersElement = document.getElementById('totalOrders');
    const totalReviewsElement = document.getElementById('totalReviews');
    
    // Calculate total orders
    let totalOrders = 0;
    if (userOrders && typeof userOrders === 'object') {
        Object.values(userOrders).forEach(statusOrders => {
            if (Array.isArray(statusOrders)) {
                totalOrders += statusOrders.length;
            }
        });
    } else if (Array.isArray(userOrders)) {
        totalOrders = userOrders.length;
    }
    
    if (totalOrdersElement) {
        totalOrdersElement.textContent = totalOrders;
        console.log('Updated totalOrders:', totalOrders);
    }
    if (totalReviewsElement) {
        totalReviewsElement.textContent = userReviews.length;
        console.log('Updated totalReviews:', userReviews.length);
    }
}

function initializeProfilePage() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            switchSection(section);
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtnSidebar');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Edit profile form
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfile);
    }
    
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    // Add event listeners for review type filter radios
    const reviewTypeRadios = document.getElementsByName('reviewTypeFilter');
    reviewTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            currentReviewTypeFilter = this.value;
            displayUserReviews();
        });
    });
}

async function handleEditProfile(e) {
    e.preventDefault();
    const editUsername = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    const editPhone = document.getElementById('editPhone');
    const updateData = {
        username: editUsername.value || currentUser.username,
        email: editEmail.value || currentUser.email,
        phone: editPhone.value || currentUser.phone
    };
    try {
        const updatedUser = await apiCall('/profile/me/modify/', {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        currentUser = updatedUser;
        updateProfileDisplay();
        updateEditProfileForm();
        showMessage('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Failed to update profile:', error);
        showMessage('Failed to update profile: ' + error.message, 'error');
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const oldPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
    }
    
    try {
        await apiCall('/profile/me/change_password/', {
            method: 'POST',
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });
        
        showMessage('Password changed successfully!', 'success');
        e.target.reset();
    } catch (error) {
        console.error('Failed to change password:', error);
        showMessage('Failed to change password: ' + error.message, 'error');
    }
}

function switchSection(sectionId) {
    // Remove active class from all sections and links
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to selected section and link
    const targetSection = document.getElementById(sectionId);
    const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
    
    if (targetSection) targetSection.classList.add('active');
    if (targetLink) targetLink.classList.add('active');
    
    // If switching to edit-profile, update placeholders
    if (sectionId === 'edit-profile') {
        updateEditProfileForm();
    }
}

function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

function logout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    showMessage('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '/html/index.html';
    }, 500);
}

// === Add Review Form Logic ===
document.addEventListener('DOMContentLoaded', function() {
    // Review type change handler
    const reviewTypeSelect = document.getElementById('reviewType');
    if (reviewTypeSelect) {
        reviewTypeSelect.addEventListener('change', handleReviewTypeChange);
    }

    // Add review form submission
    const addReviewForm = document.getElementById('addReviewForm');
    if (addReviewForm) {
        addReviewForm.addEventListener('submit', handleAddReviewSubmit);
    }
});

function handleReviewTypeChange() {
    const reviewType = document.getElementById('reviewType').value;
    const orderSelectGroup = document.getElementById('orderSelectGroup');
    const itemSelectGroup = document.getElementById('itemSelectGroup');

    // Hide both by default
    orderSelectGroup.style.display = 'none';
    itemSelectGroup.style.display = 'none';

    if (reviewType === 'order_review') {
        orderSelectGroup.style.display = 'block';
        populateOrderSelect();
    } else if (reviewType === 'item_review') {
        itemSelectGroup.style.display = 'block';
        populateItemSelect();
    }
}

async function populateOrderSelect() {
    const orderSelect = document.getElementById('orderSelect');
    orderSelect.innerHTML = '<option value="">Choose an order...</option>';
    // Flatten all user orders
    let allOrders = [];
    if (userOrders && typeof userOrders === 'object') {
        Object.values(userOrders).forEach(statusOrders => {
            if (Array.isArray(statusOrders)) {
                allOrders = allOrders.concat(statusOrders);
            }
        });
    } else if (Array.isArray(userOrders)) {
        allOrders = userOrders;
    }
    // Only include delivered orders
    const deliveredOrders = allOrders.filter(order => order.status && order.status.toLowerCase() === 'delivered');
    deliveredOrders.forEach(order => {
        const option = document.createElement('option');
        option.value = order.id;
        option.textContent = `Order #${order.id} - ${formatDate(order.ordered_at)}`;
        orderSelect.appendChild(option);
    });
}

async function populateItemSelect() {
    const itemSelect = document.getElementById('itemSelect');
    itemSelect.innerHTML = '<option value="">Choose an item...</option>';
    try {
        const categories = await apiCall('/category/all/');
        for (const category of categories) {
            const items = await apiCall(`/category/${category.id}/all_items/`);
            if (items && items.length > 0) {
                items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = `${item.name} (${category.name})`;
                    itemSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        showMessage('Failed to load items for review', 'error');
    }
}

async function handleAddReviewSubmit(e) {
    e.preventDefault();
    if (!currentUser) {
        showMessage('Please login to submit a review', 'warning');
        return;
    }
    const reviewType = document.getElementById('reviewType').value;
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    const content = document.getElementById('reviewContent').value;
    if (!ratingInput) {
        showMessage('Please select a rating', 'warning');
        return;
    }
    let endpoint = '';
    let reviewData = {
        content: content,
        rating: parseInt(ratingInput.value)
    };
    if (reviewType === 'general') {
        endpoint = '/reviews/add_general_review/';
    } else if (reviewType === 'order_review') {
        const orderId = document.getElementById('orderSelect').value;
        if (!orderId) {
            showMessage('Please select an order', 'warning');
            return;
        }
        endpoint = `/reviews/add_order_review/${orderId}/`;
    } else if (reviewType === 'item_review') {
        const itemId = document.getElementById('itemSelect').value;
        if (!itemId) {
            showMessage('Please select an item', 'warning');
            return;
        }
        endpoint = `/reviews/add_item_review/${itemId}/`;
    } else {
        showMessage('Please select a review type', 'warning');
        return;
    }
    try {
        await apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
        showMessage('Review submitted successfully!');
        // Reset form
        e.target.reset();
        document.getElementById('charCount').textContent = '0';
        document.getElementById('orderSelectGroup').style.display = 'none';
        document.getElementById('itemSelectGroup').style.display = 'none';
        // Reload reviews
        await loadUserReviews();
        // Optionally switch to the My Reviews section
        switchSection('my-reviews');
    } catch (error) {
        showMessage('Failed to submit review', 'error');
    }
}

// Temporary test function - call this first
async function testApiConnection() {
    try {
        console.log("Testing API connection...");
        const response = await fetch(`${API_BASE_URL}/profile/me/view/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        console.log("API Response:", response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API Data:", data);
        return data;
    } catch (error) {
        console.error("API Test Failed:", error);
        throw error;
    }
}

// Call this temporarily in your DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const testData = await testApiConnection();
        console.log("Test successful, data:", testData);
        // Rest of your initialization...
    } catch (error) {
        console.error("Initial test failed:", error);
        showMessage("Failed to connect to server. Please try again later.", "error");
    }
});
})();