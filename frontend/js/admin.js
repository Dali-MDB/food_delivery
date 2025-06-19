// Admin Dashboard JS

async function checkAdminAccess() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
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
            window.location.href = '../html/index.html';
            return;
        }
        const isAdmin = await response.json();
        if (isAdmin !== true) {
            window.location.href = '../html/index.html';
            return;
        }
    } catch {
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
        });
    });
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