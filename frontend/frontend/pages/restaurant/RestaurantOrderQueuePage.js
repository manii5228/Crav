const RestaurantOrderQueuePage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Live Order Queue</h2>
            <p class="text-muted">This page automatically refreshes every 30 seconds with new and updated orders.</p>

            <div v-if="loading" class="text-center p-5">
                <div class="spinner-border text-brand" role="status"><span class="sr-only">Loading...</span></div>
                <p class="mt-2 text-muted">Loading incoming orders...</p>
            </div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="row">
                <div class="col-lg-4 mb-4">
                    <div class="order-column">
                        <h4 class="column-title" style="color: #007bff;">New ({{ newOrders.length }})</h4>
                        <div class="order-list">
                            <div v-if="newOrders.length === 0" class="text-center text-muted p-5"><i class="fas fa-inbox fa-2x mb-2"></i><p>No new orders.</p></div>
                            <div v-for="order in newOrders" :key="order.id" class="card order-card">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between">
                                        <h5 class="card-title font-weight-bold">Order #{{ order.id }}</h5>
                                        <span class="text-muted small">{{ order.createdAt }}</span>
                                    </div>
                                    <h6 class="card-subtitle mb-2 text-muted">For: {{ order.customerName }}</h6>
                                    <div v-if="order.is_scheduled && order.scheduled_date" class="alert alert-info small p-2 mt-2 mb-2">
                                        <i class="fas fa-calendar-alt mr-2"></i><strong>Scheduled: {{ order.scheduled_date }}, {{ order.scheduled_time }}</strong>
                                    </div>
                                    <ul class="item-list list-unstyled"><li v-for="item in order.items" :key="item.name">{{ item.quantity }} x {{ item.name }}</li></ul>
                                    <div class="mt-3">
                                        <button class="btn btn-success btn-sm mr-2" @click="updateStatus(order.id, 'preparing')">Accept</button>
                                        <button class="btn btn-danger btn-sm" @click="updateStatus(order.id, 'rejected')">Reject</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 mb-4">
                    <div class="order-column">
                        <h4 class="column-title" style="color: #ffc107;">Preparing ({{ preparingOrders.length }})</h4>
                        <div class="order-list">
                            <div v-if="preparingOrders.length === 0" class="text-center text-muted p-5"><i class="fas fa-fire-alt fa-2x mb-2"></i><p>No orders are being prepared.</p></div>
                            <div v-for="order in preparingOrders" :key="order.id" class="card order-card">
                                <div class="card-body">
                                     <h5 class="card-title font-weight-bold">Order #{{ order.id }}</h5>
                                     <h6 class="card-subtitle mb-2 text-muted">For: {{ order.customerName }}</h6>
                                     <ul class="item-list list-unstyled"><li v-for="item in order.items" :key="item.name">{{ item.quantity }} x {{ item.name }}</li></ul>
                                     <button class="btn btn-primary btn-block mt-3" @click="updateStatus(order.id, 'ready')">Mark as Ready</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 mb-4">
                    <div class="order-column">
                        <h4 class="column-title" style="color: #28a745;">Ready for Pickup ({{ readyForPickupOrders.length }})</h4>
                        <div class="order-list">
                            <div v-if="readyForPickupOrders.length === 0" class="text-center text-muted p-5"><i class="fas fa-check-circle fa-2x mb-2"></i><p>No orders are ready.</p></div>
                            <div v-for="order in readyForPickupOrders" :key="order.id" class="card order-card">
                                <div class="card-body">
                                    <h5 class="card-title font-weight-bold">Order #{{ order.id }}</h5>
                                    <h6 class="card-subtitle mb-2 text-muted">For: {{ order.customerName }}</h6>
                                    <ul class="item-list list-unstyled"><li v-for="item in order.items" :key="item.name">{{ item.quantity }} x {{ item.name }}</li></ul>
                                    <div class="verification-section mt-3 pt-3 border-top">
                                        <label class="font-weight-bold">Verify Customer OTP</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control" v-model="otpInputs[order.id]" placeholder="6-digit OTP" maxlength="6" @keyup.enter="verifyOrder(order.id)">
                                            <div class="input-group-append">
                                                <button class="btn btn-info" @click="verifyOrder(order.id)">Verify & Complete</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true, error: null, orders: [], intervalId: null,
            otpInputs: {}, 
        };
    },
    computed: {
        newOrders() { return this.orders.filter(o => o.status === 'placed'); },
        preparingOrders() { return this.orders.filter(o => o.status === 'preparing'); },
        readyForPickupOrders() { return this.orders.filter(o => o.status === 'ready'); }
    },
    methods: {
        async fetchOrders() {
            this.error = null;
            try {
                const data = await apiService.get('/api/restaurant/orders');
                this.orders = data;
                data.forEach(order => {
                    if (!this.otpInputs.hasOwnProperty(order.id)) {
                        this.$set(this.otpInputs, order.id, '');
                    }
                });
            } catch (err) {
                this.error = err.message;
                clearInterval(this.intervalId);
            } finally {
                this.loading = false;
            }
        },
        async updateStatus(orderId, newStatus) {
            const confirmMessage = newStatus === 'rejected' ? 'Are you sure you want to reject this order?' : null;
            if (confirmMessage && !confirm(confirmMessage)) return;
            try {
                await apiService.patch(`/api/restaurant/orders/${orderId}/status`, { status: newStatus });
                this.fetchOrders();
            } catch (err) {
                alert('Error: ' + err.message);
            }
        },
        async verifyOrder(orderId) {
            const otp = this.otpInputs[orderId];
            if (!otp || !/^\d{6}$/.test(otp)) {
                alert('Please enter a valid 6-digit OTP.');
                return;
            }
            try {
                const data = await apiService.post(`/api/restaurant/orders/${orderId}/verify`, { otp: otp });
                alert(data.message);
                this.otpInputs[orderId] = '';
                this.fetchOrders();
            } catch (err) {
                alert('Verification Failed: ' + err.message);
            }
        }
    },
    mounted() {
        this.fetchOrders();
        this.intervalId = setInterval(this.fetchOrders, 30000);
    },
    beforeDestroy() {
        clearInterval(this.intervalId);
    }
};
