// Admin Dashboard JS

// Prevent all form submissions from reloading the page
// and all anchor clicks from navigating away

document.addEventListener('submit', function(e) {
    e.preventDefault();
}, true);

async function checkAdminAccess() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        alert('No authToken in localStorage');
        window.location.href = '../html/index.html';
        return;
    }
    try {
        const response = await fetch('http://localhost:8000/profile/is_admin/', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (response.status === 401) {
            alert('is_admin endpoint returned 401');
            window.location.href = '../html/index.html';
            return;
        }
        const isAdmin = await response.json();
        if (isAdmin !== true) {
            alert('isAdmin is not true: ' + JSON.stringify(isAdmin));
            window.location.href = '../html/index.html';
            return;
        }
    } catch (err) {
        alert('checkAdminAccess error: ' + err);
        window.location.href = '../html/index.html';
        return;
    }
}

const ORDER_STATUSES = ["RECEIVED", "PREPARING", "DELIVERING", "DELIVERED", "CANCELLED"];
let allAdminOrdersByStatus = { RECEIVED: [], PREPARING: [], DELIVERING: [], DELIVERED: [], CANCELLED: [] };
let adminActiveOrderTab = 'RECEIVED';

document.addEventListener('DOMContentLoaded', async function() {
    // Access restriction using backend endpoint
    await checkAdminAccess();
    // Sidebar navigation logic
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            const section = this.dataset.section;
            const targetSection = document.getElementById(section);
            if (targetSection) targetSection.classList.add('active');
            this.classList.add('active');
            // Store the section in localStorage
            localStorage.setItem('adminActiveSection', section);
            // Fetch data for the section
            if (section === 'categories') fetchCategories();
            if (section === 'items') { fetchAllCategoriesForItems(); fetchAllItems(); }
            if (section === 'add-admin') fetchAndDisplayAdmins();
            if (section === 'users') fetchAndDisplayUsers();
            if (section === 'reviews') fetchAndDisplayReviews();
            if (section === 'orders') fetchAndDisplayOrders();
        });
    });
    // Restore last active section on page load
    const lastSection = localStorage.getItem('adminActiveSection');
    if (lastSection) {
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        const targetSection = document.getElementById(lastSection);
        const targetLink = document.querySelector(`.sidebar-link[data-section="${lastSection}"]`);
        if (targetSection) targetSection.classList.add('active');
        if (targetLink) targetLink.classList.add('active');
        // Fetch data for the restored section
        if (lastSection === 'categories') fetchCategories();
        if (lastSection === 'items') { fetchAllCategoriesForItems(); fetchAllItems(); }
        if (lastSection === 'add-admin') fetchAndDisplayAdmins();
        if (lastSection === 'users') fetchAndDisplayUsers();
        if (lastSection === 'reviews') fetchAndDisplayReviews();
        if (lastSection === 'orders') fetchAndDisplayOrders();
    }
    // Set admin info in sidebar (if available)
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
            document.getElementById('sidebarAdminUsername').textContent = user.username || 'Admin';
            document.getElementById('sidebarAdminEmail').textContent = user.email || '';
        }
    } catch {}
    // TODO: Add admin features for each section
    // Orders Management logic
    const ordersSection = document.getElementById('orders');
    const ordersTableBody = document.getElementById('adminOrdersTableBody');
    const statusFilter = document.getElementById('adminOrderStatusFilter');
    let ordersLoaded = false;

    async function fetchAndDisplayOrders() {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return;
        renderAdminOrdersSection();
        const container = document.querySelector('.admin-orders-container');
        container.innerHTML = '<div style="color:#2563eb;">Loading orders...</div>';
        try {
            const res = await fetch('http://localhost:8000/orders/view_all_orders/', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!res.ok) throw new Error('Failed to fetch orders');
            const ordersByStatus = await res.json();
            allAdminOrdersByStatus = ordersByStatus;
            renderAdminOrders(container);
        } catch {
            container.innerHTML = '<div style="color:#e74c3c;">Failed to load orders.</div>';
        }
    }

    function displayOrders() {
        const filter = statusFilter.value;
        let filtered = allAdminOrdersByStatus[filter] || [];
        if (filter !== 'all') {
            filtered = allAdminOrdersByStatus[filter];
        }
        if (!filtered.length) {
            ordersTableBody.innerHTML = `<tr><td colspan="6">No orders found</td></tr>`;
            return;
        }
        ordersTableBody.innerHTML = filtered.map(order => `
            <tr>
                <td>${new Date(order.ordered_at).toLocaleString()}</td>
                <td>${order.id}</td>
                <td>${order.user_id || ''}</td>
                <td>
                    <select class="admin-order-status-select" data-order-id="${order.id}">
                        ${ORDER_STATUSES.map(s => `<option value="${s}"${order.status === s ? ' selected' : ''}>${s.charAt(0) + s.slice(1).toLowerCase()}</option>`).join('')}
                    </select>
                </td>
                <td>${order.calculate_total ? `$${parseFloat(order.calculate_total).toFixed(2)}` : ''}</td>
                <td><!-- Actions can go here --></td>
            </tr>
        `).join('');
        // Add event listeners for status change
        document.querySelectorAll('.admin-order-status-select').forEach(select => {
            select.addEventListener('change', async function() {
                const orderId = this.getAttribute('data-order-id');
                const newStatus = this.value;
                await changeOrderStatus(orderId, newStatus);
            });
        });
    }

    async function changeOrderStatus(orderId, newStatus) {
        const authToken = localStorage.getItem('authToken');
        try {
            const response = await fetch(`http://localhost:8000/orders/change_order_status/${orderId}/?new_status=${newStatus}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error('Failed to update status');
            await fetchAndDisplayOrders();
        } catch {
            alert('Failed to update order status');
        }
    }

    if (ordersSection) {
        // Load orders when Orders section is shown
        document.querySelector('[data-section="orders"]').addEventListener('click', () => {
            if (!ordersLoaded) {
                fetchAndDisplayOrders();
                ordersLoaded = true;
            }
        });
        // Filter orders by status
        statusFilter.addEventListener('change', displayOrders);
    }
});

// === Categories Management ===
const categoriesSection = document.getElementById('categories');
const categoriesList = document.getElementById('categoriesList');
const addCategoryContainer = document.getElementById('addCategoryContainer');
const showAddCategoryBtn = document.getElementById('showAddCategoryBtn');
const cancelAddCategoryBtn = document.getElementById('cancelAddCategory');
const editCategoryContainer = document.getElementById('editCategoryContainer');
const categoriesTableBody = undefined; // No longer used

let categories = [];

// Ensure fetchCategories is called on page load for debugging
async function fetchCategories() {
    const authToken = localStorage.getItem('authToken');
    try {
        const response = await fetch('http://localhost:8000/category/all/', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch categories');
        categories = await response.json();
        displayCategories();
    } catch (err) {
        if (categoriesList) {
            categoriesList.innerHTML = `<div class=\"admin-empty-message\">Failed to load categories.<br>Try refreshing the page or checking your internet connection.</div>`;
        } else {
            document.body.insertAdjacentHTML('beforeend', '<div style="color:red">categoriesList element not found</div>');
        }
    }
}

function displayCategories() {
    if (!categories.length) {
        categoriesList.innerHTML = `<div class=\"admin-empty-message\">No categories found.<br>Start by adding a new category.</div>`;
        return;
    }
    categoriesList.innerHTML = categories.map(cat => `
        <div class=\"admin-card\" style=\"justify-content: space-between; gap: 0.75em;\">\n            <div>\n                <div style=\"font-weight: 600; font-size: 1.1rem;\">${cat.name}</div>\n            </div>\n            <div style=\"display: flex; gap: 0.5em; align-items: center; margin-left: auto;\">\n                <button class=\"btn btn-icon\" title=\"Edit\" data-edit-category=\"${cat.id}\"><i class=\"fas fa-edit\"></i></button>\n                <button class=\"btn btn-icon\" title=\"Delete\" data-delete-category=\"${cat.id}\"><i class=\"fas fa-trash\"></i></button>\n                <button class=\"btn btn-icon\" title=\"View Items\" data-view-items=\"${cat.id}\"><i class=\"fas fa-list\"></i></button>\n            </div>\n        </div>
    `).join('');
    // Add event listeners for edit/delete/view
    document.querySelectorAll('[data-edit-category]').forEach(btn => {
        btn.onclick = () => showEditCategoryForm(btn.getAttribute('data-edit-category'));
    });
    document.querySelectorAll('[data-delete-category]').forEach(btn => {
        btn.onclick = () => deleteCategory(btn.getAttribute('data-delete-category'));
    });
    document.querySelectorAll('[data-view-items]').forEach(btn => {
        btn.onclick = () => fetchAndDisplayItems(btn.getAttribute('data-view-items'));
    });
}

// Modal logic for add/edit category
const adminCategoryModal = document.getElementById('adminCategoryModal');
const addCategoryContainerModal = document.getElementById('addCategoryContainerModal');
const editCategoryContainerModal = document.getElementById('editCategoryContainerModal');
const closeAdminCategoryModal = document.getElementById('closeAdminCategoryModal');
const cancelAddCategoryModal = document.getElementById('cancelAddCategoryModal');
const cancelEditCategoryModal = document.getElementById('cancelEditCategoryModal');

function showAddCategoryModal() {
    addCategoryContainerModal.style.display = 'block';
    editCategoryContainerModal.style.display = 'none';
    adminCategoryModal.style.display = 'block';
}
function showEditCategoryModal(categoryId) {
    addCategoryContainerModal.style.display = 'none';
    editCategoryContainerModal.style.display = 'block';
    adminCategoryModal.style.display = 'block';
    const cat = categories.find(c => c.id == categoryId);
    if (!cat) return;
    document.getElementById('editCategoryId').value = cat.id;
    document.getElementById('editCategoryName').value = cat.name;
}
function hideAdminCategoryModal() {
    adminCategoryModal.style.display = 'none';
}
if (closeAdminCategoryModal) closeAdminCategoryModal.onclick = hideAdminCategoryModal;
if (cancelAddCategoryModal) cancelAddCategoryModal.onclick = hideAdminCategoryModal;
if (cancelEditCategoryModal) cancelEditCategoryModal.onclick = hideAdminCategoryModal;
if (showAddCategoryBtn) {
    showAddCategoryBtn.onclick = function() {
        showAddCategoryModal();
    };
}
// Replace showEditCategoryForm with modal version
function showEditCategoryForm(categoryId) {
    showEditCategoryModal(categoryId);
}
// Hide old inline containers
if (addCategoryContainer) addCategoryContainer.style.display = 'none';
if (editCategoryContainer) editCategoryContainer.style.display = 'none';

addCategoryForm.onsubmit = async function(e) {
    e.preventDefault();
    const name = document.getElementById('categoryName').value.trim();
    if (!name) return;
    const authToken = localStorage.getItem('authToken');
    let addError = false;
    try {
        const response = await fetch('http://localhost:8000/category/add/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        let data = null;
        try {
            data = await response.json();
        } catch (err) {
            console.warn('Could not parse add category response as JSON:', err);
        }
        console.log('Add category response:', response, data);
        if (!response.ok) {
            addError = true;
            console.warn('Add category returned non-OK status:', response.status, data);
        }
    } catch (err) {
        addError = true;
        console.error('Add category fetch error:', err);
    }
    addCategoryForm.reset();
    hideAdminCategoryModal();
    await fetchCategories();
    // Check if the category appears in the refreshed list
    const found = Array.isArray(categories) && categories.some(cat => cat.name === name);
    if (addError && !found) {
        alert('Failed to add category. Please try again.');
    } else if (addError && found) {
        showMessage('Category was added, but there was a server error.', 'warning');
    } else if (found) {
        showMessage('Category added successfully!', 'success');
    }
};

editCategoryForm.onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editCategoryId').value;
    const name = document.getElementById('editCategoryName').value.trim();
    const authToken = localStorage.getItem('authToken');
    try {
        const response = await fetch(`http://localhost:8000/category/${id}/update/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        if (!response.ok) throw new Error('Failed to update category');
        editCategoryForm.reset();
        editCategoryContainer.style.display = 'none';
        addCategoryContainer.style.display = 'flex';
        setActiveSection('categories');
        fetchCategories();
    } catch {
        alert('Failed to update category');
    }
};

function setActiveSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');
    const sidebarLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
    if (sidebarLink) sidebarLink.classList.add('active');
}

async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    const authToken = localStorage.getItem('authToken');
    try {
        const response = await fetch(`http://localhost:8000/category/${categoryId}/delete/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to delete category');
        setActiveSection('categories');
        fetchCategories();
    } catch {
        alert('Failed to delete category');
    }
}

// Load categories when Categories section is shown
if (categoriesSection) {
    document.querySelector('[data-section="categories"]').addEventListener('click', fetchCategories);
}

// === Items Management ===
const itemsSection = document.getElementById('items');
const itemsList = document.getElementById('itemsList');
const addItemContainer = document.getElementById('addItemContainer');
const showAddItemBtn = document.getElementById('showAddItemBtn');
const cancelAddItemBtn = document.getElementById('cancelAddItem');
const addItemForm = document.getElementById('addItemForm');
const itemCategorySelect = document.getElementById('itemCategory');
const editItemContainer = document.getElementById('editItemContainer');
const editItemForm = document.getElementById('editItemForm');
const editItemCategorySelect = document.getElementById('editItemCategory');
const cancelEditItemBtn = document.getElementById('cancelEditItem');
const itemsSortSelect = document.getElementById('itemsSortSelect');
const itemsCategoryFilter = document.getElementById('itemsCategoryFilter');

let allItems = [];
let allCategories = [];

// Fetch all categories for dropdowns
async function fetchAllCategoriesForItems() {
    const authToken = localStorage.getItem('authToken');
    try {
        const response = await fetch('http://localhost:8000/category/all/', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch categories');
        allCategories = await response.json();
        populateCategoryDropdowns();
    } catch (err) {
        allCategories = [];
        populateCategoryDropdowns();
    }
}

function populateCategoryDropdowns() {
    const options = allCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    if (itemCategorySelect) itemCategorySelect.innerHTML = options;
    if (itemsCategoryFilter) {
        itemsCategoryFilter.innerHTML = '<option value="all">All Categories</option>' + options;
    }
}

// Fetch all items
async function fetchAllItems(categoryId = null) {
    const authToken = localStorage.getItem('authToken');
    try {
        let url;
        if (categoryId && categoryId !== 'all') {
            url = `http://localhost:8000/category/${categoryId}/all_items/`;
        } else {
            url = 'http://localhost:8000/items/all/';
        }
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch items');
        allItems = await response.json();
        displayItemsList();
    } catch (err) {
        itemsList.innerHTML = `<div class=\"admin-empty-message\">Failed to load items.<br>Try refreshing the page or checking your internet connection.</div>`;
    }
}

function displayItemsList() {
    if (!allItems.length) {
        itemsList.innerHTML = `<div class=\"admin-empty-message\">No items found.<br>Try adding a new item or changing the filter above.</div>`;
        return;
    }
    // Sort items
    let sortedItems = [...allItems];
    const sortBy = itemsSortSelect ? itemsSortSelect.value : 'name';
    if (sortBy === 'name') {
        sortedItems.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price') {
        sortedItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === 'category') {
        sortedItems.sort((a, b) => {
            const catA = a.category_name || (allCategories.find(c => c.id === a.category_id)?.name || '');
            const catB = b.category_name || (allCategories.find(c => c.id === b.category_id)?.name || '');
            return catA.localeCompare(catB);
        });
    }
    const filterCat = itemsCategoryFilter ? itemsCategoryFilter.value : 'all';
    let html = '';
    if (filterCat !== 'all') {
        html += sortedItems.map(item => {
            let catName = item.category_name || 'Uncategorized';
            if (!item.category_name && allCategories && allCategories.length) {
                const cat = allCategories.find(c => c.id === item.category_id);
                if (cat) catName = cat.name;
            }
            return `
            <div class=\"admin-card\" style=\"justify-content: space-between; gap: 0.75em;\">\n                <div>\n                    <div style=\"font-weight: 600; font-size: 1.1rem;\">${item.name}</div>\n                    <div style=\"color: #2563eb; font-size: 0.97em; margin-bottom: 0.2em;\">${catName}</div>\n                    <div style=\"color: #888; font-size: 0.95rem; margin-bottom: 0.5em;\">${item.description || ''}</div>\n                    <div style=\"color: #059669; font-size: 1rem; font-weight: 600; margin-top: 1em;\">$${parseFloat(item.price).toFixed(2)}</div>\n                </div>\n                <div style=\"display: flex; gap: 0.5em; align-items: center; margin-left: auto;\">\n                    <button class=\"btn btn-icon\" title=\"Edit\" data-edit-item=\"${item.id}\"><i class=\"fas fa-edit\"></i></button>\n                    <button class=\"btn btn-icon\" title=\"Delete\" data-delete-item=\"${item.id}\"><i class=\"fas fa-trash\"></i></button>\n                </div>\n            </div>
            `;
        }).join('');
        html += '</div></div>';
    } else {
        // Group by category as before
        // Group items by category
        const itemsByCategory = {};
        for (const cat of allCategories) {
            itemsByCategory[String(cat.id)] = [];
        }
        for (const item of sortedItems) {
            if (itemsByCategory[String(item.category_id)]) {
                itemsByCategory[String(item.category_id)].push(item);
            } else {
                if (!itemsByCategory['uncategorized']) itemsByCategory['uncategorized'] = [];
                itemsByCategory['uncategorized'].push(item);
            }
        }
        let filteredCategories = allCategories;
        for (const cat of filteredCategories) {
            const group = itemsByCategory[String(cat.id)];
            if (!group || !group.length) continue;
            html += `<div><h3 style=\"margin-bottom: 1em; color: #2563eb;\">${cat.name}</h3><div style=\"display: flex; flex-direction: column; gap: 0.75em;\">`;
            html += group.map(item => {
                let catName = item.category_name || cat.name;
                return `
                <div class=\"admin-card\" style=\"justify-content: space-between; gap: 0.75em;\">\n                    <div>\n                        <div style=\"font-weight: 600; font-size: 1.1rem;\">${item.name}</div>\n                        <div style=\"color: #2563eb; font-size: 0.97em; margin-bottom: 0.2em;\">${catName}</div>\n                        <div style=\"color: #888; font-size: 0.95rem; margin-bottom: 0.5em;\">${item.description || ''}</div>\n                        <div style=\"color: #059669; font-size: 1rem; font-weight: 600; margin-top: 1em;\">$${parseFloat(item.price).toFixed(2)}</div>\n                    </div>\n                    <div style=\"display: flex; gap: 0.5em; align-items: center; margin-left: auto;\">\n                        <button class=\"btn btn-icon\" title=\"Edit\" data-edit-item=\"${item.id}\"><i class=\"fas fa-edit\"></i></button>\n                        <button class=\"btn btn-icon\" title=\"Delete\" data-delete-item=\"${item.id}\"><i class=\"fas fa-trash\"></i></button>\n                    </div>\n                </div>
                `;
            }).join('');
            html += '</div></div>';
        }
        if (itemsByCategory['uncategorized'] && itemsByCategory['uncategorized'].length) {
            html += `<div><h3 style=\"margin-bottom: 1em; color: #2563eb;\">Uncategorized</h3><div style=\"display: flex; flex-direction: column; gap: 0.75em;\">`;
            html += itemsByCategory['uncategorized'].map(item => {
                let catName = item.category_name || 'Uncategorized';
                return `
                <div class=\"admin-card\" style=\"justify-content: space-between; gap: 0.75em;\">\n                    <div>\n                        <div style=\"font-weight: 600; font-size: 1.1rem;\">${item.name}</div>\n                        <div style=\"color: #2563eb; font-size: 0.97em; margin-bottom: 0.2em;\">${catName}</div>\n                        <div style=\"color: #888; font-size: 0.95rem; margin-bottom: 0.5em;\">${item.description || ''}</div>\n                        <div style=\"color: #059669; font-size: 1rem; font-weight: 600; margin-top: 1em;\">$${parseFloat(item.price).toFixed(2)}</div>\n                    </div>\n                    <div style=\"display: flex; gap: 0.5em; align-items: center; margin-left: auto;\">\n                        <button class=\"btn btn-icon\" title=\"Edit\" data-edit-item=\"${item.id}\"><i class=\"fas fa-edit\"></i></button>\n                        <button class=\"btn btn-icon\" title=\"Delete\" data-delete-item=\"${item.id}\"><i class=\"fas fa-trash\"></i></button>\n                    </div>\n                </div>
                `;
            }).join('');
            html += '</div></div>';
        }
    }
    if (!html) {
        html = `<div class=\"admin-empty-message\">No items found${filterCat !== 'all' ? ' in this category' : ''}.<br>Try adding a new item or changing the filter above.</div>`;
    }
    itemsList.innerHTML = html;
    document.querySelectorAll('[data-edit-item]').forEach(btn => {
        btn.onclick = () => showEditItemForm(btn.getAttribute('data-edit-item'));
    });
    document.querySelectorAll('[data-delete-item]').forEach(btn => {
        btn.onclick = () => deleteItem(btn.getAttribute('data-delete-item'));
    });
}

if (itemsSortSelect) {
    itemsSortSelect.addEventListener('change', displayItemsList);
}
if (itemsCategoryFilter) {
    itemsCategoryFilter.addEventListener('change', function() {
        const filterCat = itemsCategoryFilter.value;
        fetchAllItems(filterCat);
    });
}

// Modal logic for add/edit item
const adminItemModal = document.getElementById('adminItemModal');
const addItemContainerModal = document.getElementById('addItemContainerModal');
const editItemContainerModal = document.getElementById('editItemContainerModal');
const closeAdminItemModal = document.getElementById('closeAdminItemModal');
const cancelAddItemModal = document.getElementById('cancelAddItemModal');
const cancelEditItemModal = document.getElementById('cancelEditItemModal');

function showAddItemModal() {
    addItemContainerModal.style.display = 'block';
    editItemContainerModal.style.display = 'none';
    adminItemModal.style.display = 'block';
    fetchAllCategoriesForItems();
}
function showEditItemModal(itemId) {
    // If categories are not loaded, fetch them first, then call this function again
    if (!allCategories || allCategories.length === 0) {
        fetchAllCategoriesForItems().then(() => showEditItemModal(itemId));
        return;
    }
    addItemContainerModal.style.display = 'none';
    editItemContainerModal.style.display = 'block';
    adminItemModal.style.display = 'block';
    const item = allItems.find(i => i.id == itemId);
    if (!item) return;
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemDescription').value = item.description || '';
    document.getElementById('editItemPrice').value = item.price;
    // Find the category name
    const cat = allCategories.find(c => c.id == item.category_id);
    const catName = cat ? cat.name : '';
    document.getElementById('editItemCategoryName').textContent = catName ? `Current: ${catName}` : '';
    // Populate dropdown with all categories
    let options = allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const select = document.getElementById('editItemCategory');
    select.innerHTML = options;
    // Try to set the value directly
    select.value = String(item.category_id);
    // Fallback: if not set, loop and set selected/index
    if (select.value !== String(item.category_id)) {
        for (let i = 0; i < select.options.length; i++) {
            if (String(select.options[i].value) === String(item.category_id)) {
                select.selectedIndex = i;
                break;
            }
        }
    }
}
function hideAdminItemModal() {
    adminItemModal.style.display = 'none';
}
if (closeAdminItemModal) closeAdminItemModal.onclick = hideAdminItemModal;
if (cancelAddItemModal) cancelAddItemModal.onclick = hideAdminItemModal;
if (cancelEditItemModal) cancelEditItemModal.onclick = hideAdminItemModal;
if (showAddItemBtn) {
    showAddItemBtn.onclick = function() {
        showAddItemModal();
    };
}
// Replace showEditItemForm with modal version
function showEditItemForm(itemId) {
    showEditItemModal(itemId);
}
// Hide old inline containers
if (addItemContainer) addItemContainer.style.display = 'none';
if (editItemContainer) editItemContainer.style.display = 'none';

addItemForm.onsubmit = async function(e) {
    e.preventDefault();
    const name = document.getElementById('itemName').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value);
    const category_id = parseInt(document.getElementById('itemCategory').value);
    if (!name || isNaN(price) || isNaN(category_id)) return;
    const authToken = localStorage.getItem('authToken');
    let addError = false;
    try {
        const response = await fetch('http://localhost:8000/items/add/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description, price, category_id })
        });
        let data = null;
        try {
            data = await response.json();
        } catch (err) {
            console.warn('Could not parse add item response as JSON:', err);
        }
        console.log('Add item response:', response, data);
        if (!response.ok) {
            addError = true;
            console.warn('Add item returned non-OK status:', response.status, data);
        }
    } catch (err) {
        addError = true;
        console.error('Add item fetch error:', err);
    }
    addItemForm.reset();
    hideAdminItemModal();
    await fetchAllItems();
    // Check if the item appears in the refreshed list
    const found = Array.isArray(allItems) && allItems.some(item => item.name === name);
    if (addError && !found) {
        alert('Failed to add item. Please try again.');
    } else if (addError && found) {
        showMessage('Item was added, but there was a server error.', 'warning');
    } else if (found) {
        showMessage('Item added successfully!', 'success');
    }
};

// Add success and error message containers if not present
if (!document.getElementById('editItemSuccess')) {
    const msgDiv = document.createElement('div');
    msgDiv.id = 'editItemSuccess';
    msgDiv.style = 'display:none; color:#2ecc40; font-weight:600; margin-bottom:1em;';
    editItemContainerModal.parentNode.insertBefore(msgDiv, editItemContainerModal);
}
if (!document.getElementById('editItemError')) {
    const msgDiv = document.createElement('div');
    msgDiv.id = 'editItemError';
    msgDiv.style = 'display:none; color:#e74c3c; font-weight:600; margin-bottom:1em;';
    editItemContainerModal.parentNode.insertBefore(msgDiv, editItemContainerModal);
}
const editItemSuccess = document.getElementById('editItemSuccess');
const editItemError = document.getElementById('editItemError');

editItemForm.onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('editItemName').value.trim();
    const description = document.getElementById('editItemDescription').value.trim();
    const price = parseFloat(document.getElementById('editItemPrice').value);
    const category_id = parseInt(document.getElementById('editItemCategory').value);
    if (!name || isNaN(price) || isNaN(category_id)) return;
    const authToken = localStorage.getItem('authToken');
    try {
        const response = await fetch(`http://localhost:8000/items/${id}/update/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description, price, category_id })
        });
        if (response.ok) {
            await fetchAllItems();
            editItemForm.reset();
            editItemContainer.style.display = 'none';
            addItemContainer.style.display = 'flex';
            setActiveSection('items');
        }
        // No messages shown regardless of result
    } catch {
        // No messages shown on error
    }
};

if (cancelEditItemBtn) {
    cancelEditItemBtn.onclick = function() {
        editItemContainer.style.display = 'none';
        addItemContainer.style.display = 'flex';
    };
}

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const authToken = localStorage.getItem('authToken');
    try {
        const response = await fetch(`http://localhost:8000/items/${itemId}/delete/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to delete item');
        setActiveSection('items');
        fetchAllItems();
    } catch {
        alert('Failed to delete item');
    }
}

// Load items when Items section is shown
if (itemsSection) {
    document.querySelector('[data-section="items"]').addEventListener('click', () => {
        fetchAllCategoriesForItems();
        fetchAllItems();
    });
}

// On initial load, fetch all items
fetchAllItems();

// === Add Admin Modal Logic ===
const showAddAdminBtn = document.getElementById('showAddAdminBtn');
const adminAddAdminModal = document.getElementById('adminAddAdminModal');
const closeAdminAddAdminModal = document.getElementById('closeAdminAddAdminModal');
const cancelAddAdminModal = document.getElementById('cancelAddAdminModal');
const addAdminForm = document.getElementById('addAdminForm');
const addAdminSuccess = document.getElementById('addAdminSuccess');
const addAdminError = document.getElementById('addAdminError');

function showAddAdminModal() {
    adminAddAdminModal.style.display = 'block';
    addAdminError.style.display = 'none';
    addAdminForm.reset();
}
function hideAddAdminModal() {
    adminAddAdminModal.style.display = 'none';
}
if (showAddAdminBtn) showAddAdminBtn.onclick = showAddAdminModal;
if (closeAdminAddAdminModal) closeAdminAddAdminModal.onclick = hideAddAdminModal;
if (cancelAddAdminModal) cancelAddAdminModal.onclick = hideAddAdminModal;

if (addAdminForm) {
    addAdminForm.onsubmit = async function(e) {
        e.preventDefault();
        addAdminError.style.display = 'none';
        const username = document.getElementById('adminUsername').value.trim();
        const email = document.getElementById('adminEmail').value.trim();
        const phone = document.getElementById('adminPhone').value.trim();
        const password = document.getElementById('adminPassword').value;
        const authToken = localStorage.getItem('authToken');
        try {
            const response = await fetch('http://localhost:8000/add_admin/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ username, email, phone, password })
            });
            if (response.ok) {
                addAdminSuccess.textContent = 'Admin added successfully!';
                addAdminSuccess.style.display = 'block';
                hideAddAdminModal();
                setTimeout(() => { addAdminSuccess.style.display = 'none'; }, 3000);
            } else {
                const data = await response.json();
                addAdminError.textContent = data.detail || 'Failed to add admin.';
                addAdminError.style.display = 'block';
            }
        } catch (err) {
            addAdminError.textContent = 'Network error. Please try again.';
            addAdminError.style.display = 'block';
        }
    };
}

// === Admins List Logic ===
const adminListContainer = document.getElementById('adminListContainer');

async function fetchAndDisplayAdmins() {
    if (!adminListContainer) return;
    const authToken = localStorage.getItem('authToken');
    adminListContainer.innerHTML = '<div class="admin-empty-message">Loading admins...</div>';
    try {
        const response = await fetch('http://localhost:8000/profile/all_admins/', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch admins');
        const admins = await response.json();
        if (!admins.length) {
            adminListContainer.innerHTML = '<div class="admin-empty-message">No admins found.</div>';
            return;
        }
        adminListContainer.innerHTML = admins.map(admin => `
            <div class="admin-card" style="display: flex; align-items: center; gap: 1.5em; padding: 1em 1.5em; margin-bottom: 0.5em;">
                <div style="font-size: 1.7em; color: #2d7d46;"><i class="fas fa-user-shield"></i></div>
                <div style="flex:1;">
                    <div style="font-weight: 600; font-size: 1.1rem;">${admin.username}</div>
                    <div style="color: #555; font-size: 0.98em;">${admin.email}</div>
                    <div style="color: #888; font-size: 0.95em;">${admin.phone || ''}</div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        adminListContainer.innerHTML = '<div class="admin-empty-message">Failed to load admins.<br>Try refreshing the page.</div>';
    }
}

// Fetch admins when Add Admin section is shown
const addAdminSectionLink = document.querySelector('.sidebar-link[data-section="add-admin"]');
if (addAdminSectionLink) {
    addAdminSectionLink.addEventListener('click', fetchAndDisplayAdmins);
}
// Also fetch on page load if Add Admin is the active section
if (document.getElementById('add-admin')?.classList.contains('active')) {
    fetchAndDisplayAdmins();
}
// Refresh admins list after adding a new admin
if (addAdminForm) {
    const origSubmit = addAdminForm.onsubmit;
    addAdminForm.onsubmit = async function(e) {
        await origSubmit.call(this, e);
        fetchAndDisplayAdmins();
    };
}

// === Users List Logic ===
const adminUsersList = document.getElementById('adminUsersList');
const adminUserSearchInput = document.getElementById('adminUserSearchInput');
const adminUserSearchBtn = document.getElementById('adminUserSearchBtn');
let userSearchTimeout = null;

async function searchAndDisplayUsers(query) {
    if (!adminUsersList) return;
    const authToken = localStorage.getItem('authToken');
    adminUsersList.innerHTML = '<div class="admin-empty-message">Searching users...</div>';
    try {
        const response = await fetch(`http://localhost:8000/profile/search_user/?query=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to search users');
        const users = await response.json();
        if (!users.length) {
            adminUsersList.innerHTML = '<div class="admin-empty-message">No users found.</div>';
            return;
        }
        adminUsersList.innerHTML = users.map(user => `
            <div class="admin-card" style="display: flex; align-items: center; gap: 1.5em; padding: 1em 1.5em; margin-bottom: 0.5em;">
                <div style="font-size: 1.7em; color: #2563eb;"><i class="fas fa-user"></i></div>
                <div style="flex:1;">
                    <div style="font-weight: 600; font-size: 1.1rem;">${user.username}</div>
                    <div style="color: #555; font-size: 0.98em;">${user.email}</div>
                </div>
                <button class="btn btn-icon view-user-profile-btn" data-user-id="${user.id}" title="View Profile" style="margin-left:auto; font-size:1.3em; color:#2563eb; background:none; border:none; cursor:pointer;">
                    <i class="fas fa-id-card"></i>
                </button>
            </div>
        `).join('');
        // Add event listeners to view profile buttons
        document.querySelectorAll('.view-user-profile-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                window.location.href = `user.html?id=${userId}`;
            });
        });
    } catch (err) {
        adminUsersList.innerHTML = '<div class="admin-empty-message">Failed to search users.<br>Try again.</div>';
    }
}

if (adminUserSearchBtn && adminUserSearchInput) {
    adminUserSearchBtn.addEventListener('click', function() {
        const query = adminUserSearchInput.value.trim();
        if (query) {
            searchAndDisplayUsers(query);
        } else {
            fetchAndDisplayUsers();
        }
    });
}

async function fetchAndDisplayUsers() {
    if (!adminUsersList) return;
    const authToken = localStorage.getItem('authToken');
    adminUsersList.innerHTML = '<div class="admin-empty-message">Loading users...</div>';
    try {
        const response = await fetch('http://localhost:8000/profile/all_users/', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const users = await response.json();
        if (!users.length) {
            adminUsersList.innerHTML = '<div class="admin-empty-message">No users found.</div>';
            return;
        }
        adminUsersList.innerHTML = users.map(user => `
            <div class="admin-card" style="display: flex; align-items: center; gap: 1.5em; padding: 1em 1.5em; margin-bottom: 0.5em;">
                <div style="font-size: 1.7em; color: #2563eb;"><i class="fas fa-user"></i></div>
                <div style="flex:1;">
                    <div style="font-weight: 600; font-size: 1.1rem;">${user.username}</div>
                    <div style="color: #555; font-size: 0.98em;">${user.email}</div>
                </div>
                <button class="btn btn-icon view-user-profile-btn" data-user-id="${user.id}" title="View Profile" style="margin-left:auto; font-size:1.3em; color:#2563eb; background:none; border:none; cursor:pointer;">
                    <i class="fas fa-id-card"></i>
                </button>
            </div>
        `).join('');
        // Add event listeners to view profile buttons
        document.querySelectorAll('.view-user-profile-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                window.location.href = `user.html?id=${userId}`;
            });
        });
    } catch (err) {
        adminUsersList.innerHTML = '<div class="admin-empty-message">Failed to load users.<br>Try refreshing the page.</div>';
    }
}

// Fetch users when Users section is shown
const usersSectionLink = document.querySelector('.sidebar-link[data-section="users"]');
if (usersSectionLink) {
    usersSectionLink.addEventListener('click', fetchAndDisplayUsers);
}
// Also fetch on page load if Users is the active section
if (document.getElementById('users')?.classList.contains('active')) {
    fetchAndDisplayUsers();
}

// === Reviews Management ===
const reviewsSection = document.getElementById('reviews');
let allAdminReviews = { general: [], item_review: [], order_review: [] };
let adminActiveReviewTab = 'general';

function renderAdminReviewsSection() {
    if (!reviewsSection) return;
    reviewsSection.innerHTML = `
        <div class="section-header">
            <h2>Reviews Management</h2>
            <p>View and manage reviews</p>
        </div>
        <div class="admin-reviews-tabs" style="display:flex;gap:1.5em;margin-bottom:2em;">
            <button id="adminTabGeneralReviews" class="admin-reviews-tab${adminActiveReviewTab === 'general' ? ' active' : ''}" style="background:none;border:none;font-size:1.1em;font-weight:600;color:${adminActiveReviewTab === 'general' ? '#2563eb' : '#888'};padding:0.7em 0.5em;border-bottom:2.5px solid ${adminActiveReviewTab === 'general' ? '#2563eb' : 'transparent'};cursor:pointer;">General</button>
            <button id="adminTabItemReviews" class="admin-reviews-tab${adminActiveReviewTab === 'item' ? ' active' : ''}" style="background:none;border:none;font-size:1.1em;font-weight:600;color:${adminActiveReviewTab === 'item' ? '#2563eb' : '#888'};padding:0.7em 0.5em;border-bottom:2.5px solid ${adminActiveReviewTab === 'item' ? '#2563eb' : 'transparent'};cursor:pointer;">Item</button>
            <button id="adminTabOrderReviews" class="admin-reviews-tab${adminActiveReviewTab === 'order' ? ' active' : ''}" style="background:none;border:none;font-size:1.1em;font-weight:600;color:${adminActiveReviewTab === 'order' ? '#2563eb' : '#888'};padding:0.7em 0.5em;border-bottom:2.5px solid ${adminActiveReviewTab === 'order' ? '#2563eb' : 'transparent'};cursor:pointer;">Order</button>
        </div>
        <div class="admin-reviews-container"></div>
    `;
    setupAdminReviewsTabs();
}

async function fetchAndDisplayReviews() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    if (!reviewsSection) return;
    renderAdminReviewsSection();
    const container = document.querySelector('.admin-reviews-container');
    container.innerHTML = '<div style="color:#2563eb;">Loading reviews...</div>';
    try {
        const res = await fetch('http://localhost:8000/reviews/get_all_reviews/', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch reviews');
        allAdminReviews = await res.json();
        renderAdminReviews(container);
    } catch {
        container.innerHTML = '<div style="color:#e74c3c;">Failed to load reviews.</div>';
    }
}

let adminUserCache = {};

async function getUserInfo(userId) {
    if (adminUserCache[userId]) return adminUserCache[userId];
    const authToken = localStorage.getItem('authToken');
    try {
        const res = await fetch(`http://localhost:8000/profile/user/${userId}/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch user info');
        const user = await res.json();
        adminUserCache[userId] = user;
        return user;
    } catch {
        return null;
    }
}

async function renderAdminReviews(container) {
    let html = '';
    function reviewCard(review, type, user) {
        let itemBtn = '';
        if (type === 'item_review' && review.item_id) {
            itemBtn = `<button class=\"item-info-btn\" onclick=\"adminShowItemInfo(${review.item_id})\" title=\"View Item Info\"><i class='fas fa-info-circle'></i> <span style=\"font-size:0.98em; font-weight:500; color:#2563eb; margin-left:0.3em;\">View Item</span></button>`;
        }
        let userInfo = '';
        if (user) {
            userInfo = `<div class=\"review-user\" style=\"color:#888; font-size:0.97em; margin-left:0.7em;\">Name: ${user.name || user.username || '-'}<br>Username: ${user.username || '-'}<br>Phone: ${user.phone || '-'}</div>`;
        } else {
            userInfo = `<div class=\"review-user\" style=\"color:#888; font-size:0.97em; margin-left:0.7em;\">User: ${review.user_id}</div>`;
        }
        return `<div class=\"review-card\">
            <div class=\"review-content\">
                <span class=\"review-rating\">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                <span class=\"review-text\">${review.content}</span>
                ${userInfo}
            </div>
            <div style=\"display:flex;align-items:center;gap:0.5em;\">${itemBtn}<button class=\"delete-review-btn\" title=\"Delete Review\" onclick=\"adminDeleteReview(${review.id})\"><i class='fas fa-trash'></i></button></div>
        </div>`;
    }
    let hasAny = false;
    let tabType = adminActiveReviewTab;
    let reviewsArr = [];
    let tabTitle = '';
    if (tabType === 'general') {
        reviewsArr = allAdminReviews.general || [];
        tabTitle = 'General Reviews';
    } else if (tabType === 'item') {
        reviewsArr = allAdminReviews.item_review || [];
        tabTitle = 'Item Reviews';
    } else if (tabType === 'order') {
        reviewsArr = allAdminReviews.order_review || [];
        tabTitle = 'Order Reviews';
    }
    if (reviewsArr.length) {
        hasAny = true;
        html += `<div class=\"review-section\"><h4 style=\"color:#2563eb; margin-top:1em;\">${tabTitle}</h4>`;
        html += reviewsArr.map(r => '<div class="admin-review-loading">Loading user info...</div>').join('');
    }
    if (!hasAny) {
        html += '<div style="color:#888;">No reviews found.</div>';
    }
    container.innerHTML = html;
    // Now fetch user info and update each review card
    if (reviewsArr.length) {
        reviewsArr.forEach(async (review, idx) => {
            const user = await getUserInfo(review.user_id);
            const reviewHtml = reviewCard(review, tabType === 'item' ? 'item_review' : tabType === 'order' ? 'order_review' : 'general', user);
            const reviewEls = container.getElementsByClassName('admin-review-loading');
            if (reviewEls[idx]) reviewEls[idx].outerHTML = reviewHtml;
        });
    }
}

// Tab switching logic
function setupAdminReviewsTabs() {
    const tabGeneral = document.getElementById('adminTabGeneralReviews');
    const tabItem = document.getElementById('adminTabItemReviews');
    const tabOrder = document.getElementById('adminTabOrderReviews');
    if (!tabGeneral || !tabItem || !tabOrder) return;
    tabGeneral.onclick = () => switchAdminReviewTab('general');
    tabItem.onclick = () => switchAdminReviewTab('item');
    tabOrder.onclick = () => switchAdminReviewTab('order');
}
function switchAdminReviewTab(tab) {
    adminActiveReviewTab = tab;
    renderAdminReviewsSection();
    const container = document.querySelector('.admin-reviews-container');
    renderAdminReviews(container);
}

window.adminDeleteReview = async function(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    const authToken = localStorage.getItem('authToken');
    try {
        const res = await fetch(`http://localhost:8000/reviews/delete_review/${reviewId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            fetchAndDisplayReviews();
        } else {
            alert('Failed to delete review.');
        }
    } catch {
        alert('Failed to delete review.');
    }
}

window.adminShowItemInfo = async function(itemId) {
    let modal = document.getElementById('itemInfoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'itemInfoModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class='modal-content' id='itemInfoModalContent'></div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) adminHideItemInfo();
        });
    }
    const content = document.getElementById('itemInfoModalContent');
    content.innerHTML = '<div style="padding:2em;text-align:center;color:#2563eb;">Loading item info...</div>';
    modal.style.display = 'block';
    const authToken = localStorage.getItem('authToken');
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
            <button onclick='adminHideItemInfo()' class='btn btn-outline' style='margin-top:1.5em;'>Close</button>
        </div>`;
    } catch {
        content.innerHTML = `<div style='padding:2em;text-align:center;color:#e74c3c;'>Failed to load item info.</div><button onclick='adminHideItemInfo()' class='btn btn-outline' style='margin-top:1.5em;'>Close</button>`;
    }
}
window.adminHideItemInfo = function() {
    const modal = document.getElementById('itemInfoModal');
    if (modal) modal.style.display = 'none';
}
// Bind reviews section to sidebar
const reviewsSidebarLink = document.querySelector('.sidebar-link[data-section="reviews"]');
if (reviewsSidebarLink) {
    reviewsSidebarLink.addEventListener('click', fetchAndDisplayReviews);
}

function renderAdminOrdersSection() {
    const ordersSection = document.getElementById('orders');
    if (!ordersSection) return;
    ordersSection.innerHTML = `
        <div class="section-header">
            <h2>Orders Management</h2>
            <p>View and manage all orders</p>
        </div>
        <div class="admin-orders-tabs" style="display:flex;gap:1.5em;margin-bottom:2em;">
            ${ORDER_STATUSES.map(status =>
                `<button id="adminTabOrders${status}" class="admin-orders-tab${adminActiveOrderTab === status ? ' active' : ''}" style="background:none;border:none;font-size:1.1em;font-weight:600;color:${adminActiveOrderTab === status ? '#2563eb' : '#888'};padding:0.7em 0.5em;border-bottom:2.5px solid ${adminActiveOrderTab === status ? '#2563eb' : 'transparent'};cursor:pointer;">${status.charAt(0) + status.slice(1).toLowerCase()}</button>`
            ).join('')}
        </div>
        <div class="admin-orders-container"></div>
    `;
    setupAdminOrdersTabs();
}

async function fetchAndDisplayOrders() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    renderAdminOrdersSection();
    const container = document.querySelector('.admin-orders-container');
    container.innerHTML = '<div style="color:#2563eb;">Loading orders...</div>';
    try {
        const res = await fetch('http://localhost:8000/orders/view_all_orders/', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const ordersByStatus = await res.json();
        allAdminOrdersByStatus = ordersByStatus;
        renderAdminOrders(container);
    } catch {
        container.innerHTML = '<div style="color:#e74c3c;">Failed to load orders.</div>';
    }
}

function renderAdminOrders(container) {
    let html = '';
    const status = adminActiveOrderTab;
    const orders = allAdminOrdersByStatus[status] || [];
    
    if (orders.length) {
        html += `
            <div class="admin-orders-table">
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
                                    <td style="padding:12px;text-align:left;">
                                        <div style="font-weight:600;color:#1f2937;">${order.username || 'N/A'}</div>
                                        <div style="font-size:0.875rem;color:#6b7280;">${order.email || 'N/A'}</div>
                                        <div style="font-size:0.875rem;color:#6b7280;">${order.phone || 'N/A'}</div>
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
                                            <button class="btn btn-primary btn-xs" onclick="showStatusChangeModal(${order.id}, '${order.status}')" title="Change Status">
                                                <i class="fas fa-edit"></i>
                                            </button>
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
    } else {
        html += '<div style="color:#888;text-align:center;padding:2em;">No orders found for this status.</div>';
    }
    container.innerHTML = html;
}

function setupAdminOrdersTabs() {
    ORDER_STATUSES.forEach(status => {
        const btn = document.getElementById(`adminTabOrders${status}`);
        if (btn) {
            btn.onclick = () => switchAdminOrderTab(status);
        }
    });
}
function switchAdminOrderTab(status) {
    adminActiveOrderTab = status;
    renderAdminOrdersSection();
    const container = document.querySelector('.admin-orders-container');
    renderAdminOrders(container);
}
// Bind orders section to sidebar
const ordersSidebarLink = document.querySelector('.sidebar-link[data-section="orders"]');
if (ordersSidebarLink) {
    ordersSidebarLink.addEventListener('click', fetchAndDisplayOrders);
}
// On page load, if orders is active, load orders
if (document.getElementById('orders')?.classList.contains('active')) {
    fetchAndDisplayOrders();
}

// === Order Management Functions ===

// View order details with item orders
window.viewOrderDetails = async function(orderId) {
    let modal = document.getElementById('orderDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'orderDetailsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <button class="btn btn-secondary" onclick="hideOrderDetailsModal()" style="position: absolute; top: 12px; right: 18px; z-index: 2;">&times;</button>
                <div id="orderDetailsContent"></div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) hideOrderDetailsModal();
        });
    }
    
    const content = document.getElementById('orderDetailsContent');
    content.innerHTML = '<div style="padding:2em;text-align:center;color:#2563eb;">Loading order details...</div>';
    modal.style.display = 'block';
    
    const authToken = localStorage.getItem('authToken');
    try {
        const res = await fetch(`http://localhost:8000/orders/view_order/${orderId}/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch order details');
        const order = await res.json();
        
        let itemsHtml = '';
        if (order.item_orders && order.item_orders.length > 0) {
            itemsHtml = `
                <div class="order-items-section">
                    <h3 style="color:#2563eb;margin-bottom:1em;">Order Items</h3>
                    <div class="order-items-table">
                        <table style="width:100%;border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f8f9fa;border-bottom:2px solid #dee2e6;">
                                    <th style="padding:12px;text-align:left;border-bottom:1px solid #dee2e6;">Item</th>
                                    <th style="padding:12px;text-align:center;border-bottom:1px solid #dee2e6;">Quantity</th>
                                    <th style="padding:12px;text-align:right;border-bottom:1px solid #dee2e6;">Unit Price</th>
                                    <th style="padding:12px;text-align:right;border-bottom:1px solid #dee2e6;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.item_orders.map(item => `
                                    <tr style="border-bottom:1px solid #f1f3f4;">
                                        <td style="padding:12px;text-align:left;">
                                            <div style="font-weight:600;">${item.item_name}</div>
                                        </td>
                                        <td style="padding:12px;text-align:center;">${item.quantity}</td>
                                        <td style="padding:12px;text-align:right;">$${(item.total_price / item.quantity).toFixed(2)}</td>
                                        <td style="padding:12px;text-align:right;font-weight:600;">$${parseFloat(item.total_price).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            itemsHtml = '<div style="color:#888;text-align:center;padding:1em;">No items found in this order.</div>';
        }
        
        content.innerHTML = `
            <div style="padding:1.5em;">
                <h2 style="color:#2563eb;margin-bottom:1em;">Order #${order.id} Details</h2>
                
                <div class="order-info-section" style="margin-bottom:2em;">
                    <h3 style="color:#2563eb;margin-bottom:0.5em;">Order Information</h3>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1em;background:#f8f9fa;padding:1em;border-radius:8px;">
                        <div><strong>Status:</strong> <span class="badge badge-${order.status.toLowerCase()}">${order.status}</span></div>
                        <div><strong>Order Date:</strong> ${order.ordered_at ? new Date(order.ordered_at).toLocaleString() : 'N/A'}</div>
                        <div><strong>Delivery Address:</strong> ${order.address || 'N/A'}</div>
                        <div><strong>Total Amount:</strong> <span style="font-weight:600;color:#059669;">$${parseFloat(order.calculate_total).toFixed(2)}</span></div>
                    </div>
                </div>
                
                ${itemsHtml}
                
                <div style="display:flex;justify-content:flex-end;margin-top:2em;">
                    <button onclick="hideOrderDetailsModal()" class="btn btn-outline">Close</button>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `
            <div style="padding:2em;text-align:center;color:#e74c3c;">
                Failed to load order details: ${error.message}
            </div>
            <div style="display:flex;justify-content:center;margin-top:1em;">
                <button onclick="hideOrderDetailsModal()" class="btn btn-outline">Close</button>
            </div>
        `;
    }
}

window.hideOrderDetailsModal = function() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) modal.style.display = 'none';
}

// Show status change modal
window.showStatusChangeModal = function(orderId, currentStatus) {
    let modal = document.getElementById('statusChangeModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'statusChangeModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <button class="btn btn-secondary" onclick="hideStatusChangeModal()" style="position: absolute; top: 12px; right: 18px; z-index: 2;">&times;</button>
                <div id="statusChangeContent"></div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) hideStatusChangeModal();
        });
    }
    
    const content = document.getElementById('statusChangeContent');
    const availableStatuses = ORDER_STATUSES.filter(status => status !== 'PENDING' && status !== currentStatus);
    
    content.innerHTML = `
        <div style="padding:1.5em;">
            <h3 style="color:#2563eb;margin-bottom:1em;">Change Order Status</h3>
            <p style="margin-bottom:1em;">Current Status: <span class="badge badge-${currentStatus.toLowerCase()}">${currentStatus}</span></p>
            
            <form id="statusChangeForm" style="display:flex;flex-direction:column;gap:1em;">
                <div>
                    <label for="newStatus" style="display:block;margin-bottom:0.5em;font-weight:600;">New Status:</label>
                    <select id="newStatus" required class="form-control">
                        <option value="">Select new status...</option>
                        ${availableStatuses.map(status => 
                            `<option value="${status}">${status.charAt(0) + status.slice(1).toLowerCase()}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div style="display:flex;gap:1em;justify-content:flex-end;margin-top:1em;">
                    <button type="button" onclick="hideStatusChangeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Status</button>
                </div>
            </form>
        </div>
    `;
    
    modal.style.display = 'block';
    
    // Handle form submission
    document.getElementById('statusChangeForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const newStatus = document.getElementById('newStatus').value;
        if (!newStatus) return;
        
        await changeOrderStatus(orderId, newStatus);
        hideStatusChangeModal();
    });
}

window.hideStatusChangeModal = function() {
    const modal = document.getElementById('statusChangeModal');
    if (modal) modal.style.display = 'none';
}

// Cancel order function
window.cancelOrder = async function(orderId) {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
        return;
    }
    
    const authToken = localStorage.getItem('authToken');
    try {
        const response = await fetch(`http://localhost:8000/orders/cancel_order/${orderId}/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to cancel order');
        }
        
        alert('Order cancelled successfully!');
        await fetchAndDisplayOrders(); // Refresh the orders list
    } catch (error) {
        alert(`Failed to cancel order: ${error.message}`);
    }
}

// Update the existing changeOrderStatus function to show better feedback
async function changeOrderStatus(orderId, newStatus) {
    const authToken = localStorage.getItem('authToken');
    try {
        const response = await fetch(`http://localhost:8000/orders/change_order_status/${orderId}/?new_status=${newStatus}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update status');
        }
        
        alert('Order status updated successfully!');
        await fetchAndDisplayOrders(); // Refresh the orders list
    } catch (error) {
        alert(`Failed to update order status: ${error.message}`);
    }
} 