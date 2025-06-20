// Admin Dashboard JS

// Prevent all form submissions from reloading the page
// and all anchor clicks from navigating away

document.addEventListener('submit', function(e) {
    e.preventDefault();
}, true);

document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
        e.preventDefault();
    }
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
let allAdminOrders = [];

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
        try {
            const response = await fetch('http://localhost:8000/orders/view_all_orders/', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error('Failed to fetch orders');
            const ordersByStatus = await response.json();
            // Flatten and sort by date (newest first)
            allAdminOrders = [];
            for (const status of ORDER_STATUSES) {
                if (ordersByStatus[status]) {
                    allAdminOrders = allAdminOrders.concat(ordersByStatus[status]);
                }
            }
            allAdminOrders.sort((a, b) => new Date(b.ordered_at) - new Date(a.ordered_at));
            displayOrders();
        } catch (err) {
            ordersTableBody.innerHTML = `<tr><td colspan="6">Failed to load orders</td></tr>`;
        }
    }

    function displayOrders() {
        const filter = statusFilter.value;
        let filtered = allAdminOrders;
        if (filter !== 'all') {
            filtered = allAdminOrders.filter(order => order.status === filter);
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
    if (editItemCategorySelect) editItemCategorySelect.innerHTML = options;
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
        html += sortedItems.map(item => `
            <div class=\"admin-card\" style=\"justify-content: space-between; gap: 0.75em;\">\n                <div>\n                    <div style=\"font-weight: 600; font-size: 1.1rem;\">${item.name}</div>\n                    <div style=\"color: #888; font-size: 0.95rem; margin-bottom: 0.5em;\">${item.description || ''}</div>\n                    <div style=\"color: #059669; font-size: 1rem; font-weight: 600; margin-top: 1em;\">$${parseFloat(item.price).toFixed(2)}</div>\n                </div>\n                <div style=\"display: flex; gap: 0.5em; align-items: center; margin-left: auto;\">\n                    <button class=\"btn btn-icon\" title=\"Edit\" data-edit-item=\"${item.id}\"><i class=\"fas fa-edit\"></i></button>\n                    <button class=\"btn btn-icon\" title=\"Delete\" data-delete-item=\"${item.id}\"><i class=\"fas fa-trash\"></i></button>\n                </div>\n            </div>
        `).join('');
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
            html += group.map(item => `
                <div class=\"admin-card\" style=\"justify-content: space-between; gap: 0.75em;\">\n                    <div>\n                        <div style=\"font-weight: 600; font-size: 1.1rem;\">${item.name}</div>\n                        <div style=\"color: #888; font-size: 0.95rem; margin-bottom: 0.5em;\">${item.description || ''}</div>\n                        <div style=\"color: #059669; font-size: 1rem; font-weight: 600; margin-top: 1em;\">$${parseFloat(item.price).toFixed(2)}</div>\n                    </div>\n                    <div style=\"display: flex; gap: 0.5em; align-items: center; margin-left: auto;\">\n                        <button class=\"btn btn-icon\" title=\"Edit\" data-edit-item=\"${item.id}\"><i class=\"fas fa-edit\"></i></button>\n                        <button class=\"btn btn-icon\" title=\"Delete\" data-delete-item=\"${item.id}\"><i class=\"fas fa-trash\"></i></button>\n                    </div>\n                </div>
            `).join('');
            html += '</div></div>';
        }
        if (itemsByCategory['uncategorized'] && itemsByCategory['uncategorized'].length) {
            html += `<div><h3 style=\"margin-bottom: 1em; color: #2563eb;\">Uncategorized</h3><div style=\"display: flex; flex-direction: column; gap: 0.75em;\">`;
            html += itemsByCategory['uncategorized'].map(item => `
                <div class=\"admin-card\" style=\"justify-content: space-between; gap: 0.75em;\">\n                    <div>\n                        <div style=\"font-weight: 600; font-size: 1.1rem;\">${item.name}</div>\n                        <div style=\"color: #888; font-size: 0.95rem; margin-bottom: 0.5em;\">${item.description || ''}</div>\n                        <div style=\"color: #059669; font-size: 1rem; font-weight: 600; margin-top: 1em;\">$${parseFloat(item.price).toFixed(2)}</div>\n                    </div>\n                    <div style=\"display: flex; gap: 0.5em; align-items: center; margin-left: auto;\">\n                        <button class=\"btn btn-icon\" title=\"Edit\" data-edit-item=\"${item.id}\"><i class=\"fas fa-edit\"></i></button>\n                        <button class=\"btn btn-icon\" title=\"Delete\" data-delete-item=\"${item.id}\"><i class=\"fas fa-trash\"></i></button>\n                    </div>\n                </div>
            `).join('');
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
    addItemContainerModal.style.display = 'none';
    editItemContainerModal.style.display = 'block';
    adminItemModal.style.display = 'block';
    const item = allItems.find(i => i.id == itemId);
    if (!item) return;
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemDescription').value = item.description || '';
    document.getElementById('editItemPrice').value = item.price;
    fetchAllCategoriesForItems();
    setTimeout(() => {
        document.getElementById('editItemCategory').value = item.category_id;
    }, 100);
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
    const found = allItems.some(item => item.name === name && parseFloat(item.price) === price);
    if (addError && !found) {
        alert('Failed to add item. Please try again.');
    } else if (addError && found) {
        showMessage('Item was added, but there was a server error.', 'warning');
    } else if (found) {
        showMessage('Item added successfully!', 'success');
    }
};

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
        if (!response.ok) throw new Error('Failed to update item');
        editItemForm.reset();
        editItemContainer.style.display = 'none';
        addItemContainer.style.display = 'flex';
        setActiveSection('items');
        fetchAllItems();
    } catch {
        alert('Failed to update item');
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