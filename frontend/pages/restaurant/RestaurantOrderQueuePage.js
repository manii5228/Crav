const RestaurantOrderQueuePage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Live Order Queue</h2>

            <div v-if="loading" class="alert alert-info">Loading incoming orders...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="row">
                <!-- New Orders Column -->
                <div class="col-md-6">
                    <h4>New Orders</h4>
                    <div v-if="newOrders.length === 0" class="card card-body text-center text-muted">No new orders.</div>
                    <div v-for="order in newOrders" :key="order.id" class="card order-ticket-card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <h5 class="card-title">Order #{{ order.id }}</h5>
                                <span class="text-muted">{{ order.createdAt }}</span>
                            </div>
                            <h6 class="card-subtitle mb-2 text-muted">For: {{ order.customerName }}</h6>
                            <ul class="list-unstyled">
                                <li v-for="(item, index) in order.items" :key="index">
                                    {{ item.quantity }} x {{ item.name }}
                                </li>
                            </ul>
                            <button class="btn btn-success mr-2" @click="updateStatus(order.id, 'preparing')">Accept</button>
                            <button class="btn btn-danger" @click="updateStatus(order.id, 'rejected')">Reject</button>
                        </div>
                    </div>
                </div>

                <!-- In Progress Column -->
                <div class="col-md-6">
                    <h4>In Progress</h4>
                    <div v-if="inProgressOrders.length === 0" class="card card-body text-center text-muted">No orders in progress.</div>
                    <div v-for="order in inProgressOrders" :key="order.id" class="card order-ticket-card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <h5 class="card-title">Order #{{ order.id }}</h5>
                                <span class="badge" :class="statusBadgeClass(order.status)">{{ order.status }}</span>
                            </div>
                            <h6 class="card-subtitle mb-2 text-muted">For: {{ order.customerName }}</h6>
                             <ul class="list-unstyled">
                                <li v-for="(item, index) in order.items" :key="index">
                                    {{ item.quantity }} x {{ item.name }}
                                </li>
                            </ul>
                            <button v-if="order.status === 'preparing'" class="btn btn-primary" @click="updateStatus(order.id, 'ready')">Mark as Ready</button>
                            <button v-if="order.status === 'ready'" class="btn btn-info" @click="updateStatus(order.id, 'completed')">Mark as Completed</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            error: null,
            orders: [],
            // Auto-refresh interval
            intervalId: null,
        };
    },
    computed: {
        newOrders() {
            return this.orders.filter(o => o.status === 'placed');
        },
        inProgressOrders() {
            return this.orders.filter(o => o.status === 'preparing' || o.status === 'ready');
        }
    },
    mounted() {
        this.fetchOrders();
        // Auto-refresh the order list every 30 seconds
        this.intervalId = setInterval(this.fetchOrders, 30000);
    },
    beforeDestroy() {
        // Clear the interval when the component is destroyed to prevent memory leaks
        clearInterval(this.intervalId);
    },
    methods: {
        async fetchOrders() {
            // No need to set loading to true for background refreshes
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/restaurant/orders', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch orders.");
                this.orders = data;
            } catch (err) {
                this.error = err.message;
                // Stop auto-refreshing if there's an error
                clearInterval(this.intervalId);
            } finally {
                this.loading = false;
            }
        },
        async updateStatus(orderId, newStatus) {
            const confirmMessage = newStatus === 'rejected' ? 'Are you sure you want to reject this order?' : null;
            if (confirmMessage && !confirm(confirmMessage)) {
                return;
            }

            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/restaurant/orders/${orderId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                
                // Refresh the list immediately after an update
                this.fetchOrders();

            } catch (err) {
                alert('Error: ' + err.message);
            }
        },
        statusBadgeClass(status) {
            if (status === 'preparing') return 'badge-warning';
            if (status === 'ready') return 'badge-info';
            return 'badge-secondary';
        }
    }
};

export default RestaurantOrderQueuePage;

