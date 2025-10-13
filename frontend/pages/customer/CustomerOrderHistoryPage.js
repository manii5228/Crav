const CustomerOrderHistoryPage = {
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-5">Order <span class="text-brand">History</span></h2>

            <!-- Loading State -->
            <div v-if="loading" class="text-center">
                <p>Loading your order history...</p>
            </div>

            <!-- Error State -->
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <!-- Content: Orders List -->
            <div v-if="!loading && !error && orders.length > 0">
                <div v-for="order in orders" :key="order.id" class="card order-history-card mb-3">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <h6 class="text-muted">ORDER ID</h6>
                                <strong>#{{ order.id }}</strong>
                            </div>
                            <div class="col-md-3">
                                <h6 class="text-muted">DATE</h6>
                                <strong>{{ order.date }}</strong>
                            </div>
                            <div class="col-md-2">
                                <h6 class="text-muted">TOTAL</h6>
                                <strong>\${{ order.total.toFixed(2) }}</strong>
                            </div>
                            <div class="col-md-2 text-center">
                                <span class="status-badge" :class="order.status.toLowerCase()">
                                    {{ order.status }}
                                </span>
                            </div>
                            <div class="col-md-2 text-right">
                                <button class="btn btn-sm btn-outline-brand" @click="viewOrderDetails(order.id)">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content: Empty State -->
            <div v-if="!loading && !error && orders.length === 0" class="text-center empty-state-container">
                <img src="https://i.imgur.com/giffiRD.png" alt="No Orders" class="empty-state-image">
                <h3 class="mt-4">You Haven't Placed Any Orders Yet</h3>
                <p>Let's get you started!</p>
                <button class="btn btn-brand mt-2" @click="$router.push('/')">Start Ordering</button>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            error: null,
            orders: []
        };
    },
    mounted() {
        this.fetchOrderHistory();
    },
    methods: {
        async fetchOrderHistory() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                if (!token) {
                    throw new Error("You must be logged in to view your order history.");
                }
                const response = await fetch('/api/orders', {
                    headers: {
                        'Authentication-Token': token
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch order history.");
                }
                this.orders = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        viewOrderDetails(orderId) {
            this.$router.push({ name: 'OrderDetail', params: { id: orderId } });
        }
    }
};

export default CustomerOrderHistoryPage;

