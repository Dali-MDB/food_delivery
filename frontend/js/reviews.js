// Reviews Page Specific JavaScript
let currentPage = 1;
let currentFilter = 'all';
let allReviews = [];
let reviewStats = {
    total: 0,
    average: 0,
    fiveStar: 0
};

document.addEventListener('DOMContentLoaded', function() {
    // Load reviews on page load
    loadReviewsPage();

    // Event listeners for filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            filterReviews();
        });
    });

    // Write review button
    document.getElementById('writeReviewBtn').addEventListener('click', () => {
        if (!currentUser) {
            showMessage('Please login to write a review', 'warning');
            openModal(document.getElementById('loginModal'));
            return;
        }
        openModal(document.getElementById('writeReviewModal'));
    });

    // Load more button
    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreReviews);

    // Review type change handler
    const reviewTypeSelect = document.getElementById('reviewType');
    if (reviewTypeSelect) {
        reviewTypeSelect.addEventListener('change', handleReviewTypeChange);
    }

    // Character count for review content
    const reviewContent = document.getElementById('reviewContent');
    if (reviewContent) {
        reviewContent.addEventListener('input', updateCharCount);
    }

    // Write review form submission
    const writeReviewForm = document.getElementById('writeReviewForm');
    if (writeReviewForm) {
        writeReviewForm.addEventListener('submit', submitReview);
    }
});

async function loadReviewsPage() {
    try {
        showLoading(document.getElementById('reviewsList'));
        const reviewsData = await apiCall('/reviews/get_all_reviews/');
        // The backend returns {general: [], item: [], order: []}
        allReviews = reviewsData.general || [];
        reviewStats = {
            total: allReviews.length,
            average: calculateAverageRating(allReviews),
            fiveStar: allReviews.filter(r => r.rating === 5).length
        };
        
        updateReviewStats();
        filterReviews();
    } catch (error) {
        console.error('Failed to load reviews:', error);
        showMessage('Failed to load reviews', 'error');
        document.getElementById('reviewsList').innerHTML = '<p>Failed to load reviews.</p>';
    }
}

function updateReviewStats() {
    document.getElementById('totalReviews').textContent = reviewStats.total;
    document.getElementById('avgRating').textContent = reviewStats.average.toFixed(1);
    document.getElementById('fiveStarReviews').textContent = reviewStats.fiveStar;
}

function calculateAverageRating(reviews) {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
}

function filterReviews() {
    const filteredReviews = currentFilter === 'all' 
        ? allReviews 
        : allReviews.filter(review => review.rating === parseInt(currentFilter));
    
    displayReviews(filteredReviews);
}

function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');

    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p>No reviews found.</p>';
        return;
    }

    reviewsList.innerHTML = reviews.map(review => `
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
            <div class="review-date">
                ${formatDate(review.created_at)}
            </div>
        </div>
    `).join('');
}

async function loadMoreReviews() {
    currentPage++;
    try {
        const moreReviewsData = await apiCall('/reviews/get_all_reviews/');
        const moreReviews = moreReviewsData.general || [];
        
        if (moreReviews.length > 0) {
            allReviews = [...allReviews, ...moreReviews];
            reviewStats.total = allReviews.length;
            reviewStats.average = calculateAverageRating(allReviews);
            reviewStats.fiveStar = allReviews.filter(r => r.rating === 5).length;
            
            updateReviewStats();
            filterReviews();
        } else {
            document.getElementById('loadMoreBtn').style.display = 'none';
        }
    } catch (error) {
        showMessage('Failed to load more reviews', 'error');
    }
}

function handleReviewTypeChange() {
    const reviewType = document.getElementById('reviewType').value;
    const orderSelectGroup = document.getElementById('orderSelectGroup');
    const itemSelectGroup = document.getElementById('itemSelectGroup');

    // Hide all select groups
    orderSelectGroup.style.display = 'none';
    itemSelectGroup.style.display = 'none';

    // Show relevant select group
    if (reviewType === 'order_review') {
        orderSelectGroup.style.display = 'block';
        loadUserOrders();
    } else if (reviewType === 'item_review') {
        itemSelectGroup.style.display = 'block';
        loadItems();
    }
}

async function loadUserOrders() {
    if (!currentUser) return;

    try {
        const orders = await apiCall(`/orders/view_orders/${currentUser.id}/`);
        const orderSelect = document.getElementById('orderSelect');
        
        orderSelect.innerHTML = '<option value="">Choose an order...</option>';
        
        if (orders && orders.length > 0) {
            orders.forEach(order => {
                const option = document.createElement('option');
                option.value = order.id;
                option.textContent = `Order #${order.id} - ${formatDate(order.ordered_at)}`;
                orderSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load user orders:', error);
    }
}

async function loadItems() {
    try {
        const categories = await apiCall('/category/all/');
        const itemSelect = document.getElementById('itemSelect');
        
        itemSelect.innerHTML = '<option value="">Choose an item...</option>';
        
        if (categories && categories.length > 0) {
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
        }
    } catch (error) {
        console.error('Failed to load items:', error);
    }
}

function updateCharCount() {
    const content = document.getElementById('reviewContent').value;
    const charCount = document.getElementById('charCount');
    charCount.textContent = content.length;
    
    if (content.length > 900) {
        charCount.style.color = 'var(--warning-color)';
    } else {
        charCount.style.color = 'var(--text-light)';
    }
}

async function submitReview(e) {
    e.preventDefault();

    if (!currentUser) {
        showMessage('Please login to submit a review', 'warning');
        return;
    }

    const reviewType = document.getElementById('reviewType').value;
    const rating = document.querySelector('input[name="rating"]:checked');
    const content = document.getElementById('reviewContent').value;

    if (!rating) {
        showMessage('Please select a rating', 'warning');
        return;
    }

    try {
        let endpoint = '';
        let reviewData = {
            content: content,
            rating: parseInt(rating.value)
        };

        switch (reviewType) {
            case 'general':
                endpoint = '/reviews/add_general_review/';
                break;
            case 'order_review':
                const orderId = document.getElementById('orderSelect').value;
                if (!orderId) {
                    showMessage('Please select an order', 'warning');
                    return;
                }
                endpoint = `/reviews/add_order_review/${orderId}/`;
                break;
            case 'item_review':
                const itemId = document.getElementById('itemSelect').value;
                if (!itemId) {
                    showMessage('Please select an item', 'warning');
                    return;
                }
                endpoint = `/reviews/add_item_review/${itemId}/`;
                break;
        }

        await apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });

        showMessage('Review submitted successfully!');
        closeModal(document.getElementById('writeReviewModal'));
        
        // Reset form
        document.getElementById('writeReviewForm').reset();
        document.getElementById('charCount').textContent = '0';
        document.getElementById('orderSelectGroup').style.display = 'none';
        document.getElementById('itemSelectGroup').style.display = 'none';
        
        // Reload reviews
        await loadReviewsPage();
    } catch (error) {
        showMessage('Failed to submit review', 'error');
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
} 