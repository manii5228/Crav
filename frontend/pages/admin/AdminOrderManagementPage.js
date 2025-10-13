const AdminOrderManagementPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Global Order Management</h2>

            <div v-if="loading" class="alert alert-info">Loading all orders...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="card">
                <div class="card-header bg-white">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <input type="text" v-model="searchQuery" class="form-control" placeholder="Search by Order ID, Customer, or Restaurant...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-control" v-model="filterStatus">
                                <option value="All">All Statuses</option>
                                <option value="Placed">Placed</option>
                                <option value="Preparing">Preparing</option>
                                <option value="Ready">Ready</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th>Order ID</th><th>Customer</th><th>Restaurant</th>
                                    <th>Date</th><th>Total</th><th>Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="filteredOrders.length === 0">
                                    <td colspan="7" class="text-center text-muted">No orders match the current filters.</td>
                                </tr>
                                <tr v-for="order in filteredOrders" :key="order.id">
                                    <td><strong>#{{ order.id }}</strong></td>
                                    <td>{{ order.customerName }}</td>
                                    <td>{{ order.restaurantName }}</td>
                                    <td>{{ order.date }}</td>
                                    <td>\${{ order.total.toFixed(2) }}</td>
                                    <td>
                                        <span class="status-badge" :class="order.status.toLowerCase()">
                                            {{ order.status }}
                                        </span>
                                    </td>
                                    <td class="table-actions">
                                        <button class="btn btn-sm btn-outline-secondary mr-2" @click="viewDetails(order.id)">View</button>
                                        <button class="btn btn-sm btn-outline-warning" @click="initiateRefund(order.id)">Refund</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            error: null,
            searchQuery: '',
            filterStatus: 'All',
            orders: []
        };
    },
    computed: {
        filteredOrders() {
            let result = this.orders;

            if (this.filterStatus !== 'All') {
                result = result.filter(order => order.status === this.filterStatus);
            }

            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                result = result.filter(order =>
                    order.id.toString().includes(query) ||
                    order.customerName.toLowerCase().includes(query) ||
                    order.restaurantName.toLowerCase().includes(query)
                );
            }
            return result;
        }
    },
    mounted() {
        this.fetchOrders();
    },
    methods: {
        async fetchOrders() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/admin/orders', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch orders.");
                this.orders = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        viewDetails(orderId) {
            // This can navigate to a more detailed admin view of an order in the future
            alert(`Viewing details for order #${orderId}. (Feature coming soon)`);
        },
        async initiateRefund(orderId) {
            if (confirm(`Are you sure you want to initiate a refund for order #${orderId}? This action cannot be undone.`)) {
                try {
                    const token = this.$store.state.token;
                    const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
                        method: 'POST',
                        headers: { 'Authentication-Token': token }
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message);
                    alert(data.message);
                    // Optionally, you might want to refresh the orders list or update the status locally
                    this.fetchOrders();
                } catch (err) {
                    alert('Error: ' + err.message);
                }
            }
        }
    }
};

export default AdminOrderManagementPage;
