const CustomerOrderDetailPage = {
    template: `
        <div class="container my-5">
            <div v-if="loading" class="text-center">Loading order details...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <div v-if="order && !loading" >
                <h2 class="text-center mb-4">Order Details</h2>
                <p class="text-center text-muted">Order #{{ order.id }}</p>
                <div class="row mt-5">
                    <div class="col-lg-7">
                        <div class="card mb-4"><div class="card-body">
                            <h4 class="card-title">Order Summary</h4>
                            <ul class="list-unstyled">
                                <li class="d-flex justify-content-between py-2"><span class="text-muted">Order Date:</span><strong>{{ order.date }}</strong></li>
                                <li class="d-flex justify-content-between py-2"><span class="text-muted">Restaurant:</span><strong>{{ order.restaurantName }}</strong></li>
                                <li class="d-flex justify-content-between py-2"><span class="text-muted">Total Amount:</span><strong class="text-brand">\${{ order.total.toFixed(2) }}</strong></li>
                                <li class="d-flex justify-content-between py-2"><span class="text-muted">Status:</span><strong class="status-badge" :class="order.status.toLowerCase()">{{ order.status }}</strong></li>
                            </ul>
                        </div></div>
                        <div class="card"><div class="card-body">
                            <h4 class="card-title">Items Ordered</h4>
                            <ul class="list-group list-group-flush">
                                <li v-for="item in order.items" :key="item.id" class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>{{ item.quantity }} x {{ item.name }}</span>
                                    <strong>\${{ (item.price * item.quantity).toFixed(2) }}</strong>
                                </li>
                            </ul>
                        </div></div>
                    </div>
                    <div class="col-lg-5">
                        <div class="card verification-card text-center">
                            <div class="card-body">
                                <h4 class="card-title">Verification</h4>
                                <p class="text-muted">Show this at the restaurant for pickup</p>
                                <div class="my-4">
                                    <h6 class="text-muted">ONE-TIME PASSWORD (OTP)</h6>
                                    <h1 class="otp-code">{{ order.otp }}</h1>
                                </div>
                                <img :src="'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + order.qr_payload" class="img-fluid rounded" alt="Order QR Code">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() { return { loading: true, error: null, order: null }; },
    async mounted() {
        this.loading = true; this.error = null;
        try {
            const token = this.$store.state.token;
            const orderId = this.$route.params.id;
            const response = await fetch(`/api/orders/${orderId}`, { headers: { 'Authentication-Token': token } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to fetch order details.");
            this.order = data;
        } catch (err) { this.error = err.message; } finally { this.loading = false; }
    }
};
export default CustomerOrderDetailPage;
