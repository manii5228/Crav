// NOTE: No imports needed. Assumes $, apiService, and Vuex store are global.

const RestaurantOrderQueuePage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Live Order Queue</h2>
            <p class="text-muted">This page automatically refreshes every 30 seconds with new and updated orders.</p>

            <div v-if="loading" class="text-center p-5">
                <div class="spinner-border text-brand" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading incoming orders...</p>
            </div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="row">

                <!-- New Orders Column -->
                <div class="col-lg-4 mb-4">
                    <div class="order-column">
                        <h4 class="column-title" style="color: #007bff;">New ({{ newOrders.length }})</h4>
                        <div class="order-list">
                            <div v-if="newOrders.length === 0" class="text-center text-muted p-5">
                                <i class="fas fa-inbox fa-2x mb-2"></i>
                                <p>No new orders.</p>
                            </div>
                            <div v-for="order in newOrders" :key="order.id" class="card order-card">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between">
                                        <h5 class="card-title font-weight-bold">Order #{{ order.id }}</h5>
                                        <span class="text-muted small">{{ order.createdAt }}</span>
                                    </div>
                                    <h6 class="card-subtitle mb-2 text-muted">For: {{ order.customerName }}</h6>
                                    
                                    <div v-if="order.is_scheduled && order.scheduled_date" class="alert alert-info small p-2 mt-2 mb-2">
                                        <i class="fas fa-calendar-alt mr-2"></i>
                                        <strong>Scheduled: {{ order.scheduled_date }}, {{ order.scheduled_time }}</strong>
                                    </div>
                                    <div class="mb-2">
                                        <span class="badge" :class="order.order_type === 'dine_in' ? 'badge-info' : 'badge-primary'">
                                            <i :class="order.order_type === 'dine_in' ? 'fas fa-utensils' : 'fas fa-shopping-bag'"></i>
                                            {{ order.order_type === 'dine_in' ? 'Dine-In' : 'Takeaway' }}
                                        </span>
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

                <!-- Preparing Column -->
                <div class="col-lg-4 mb-4">
                    <div class="order-column">
                        <h4 class="column-title" style="color: #ffc107;">Preparing ({{ preparingOrders.length }})</h4>
                        <div class="order-list">
                            <div v-if="preparingOrders.length === 0" class="text-center text-muted p-5">
                                <i class="fas fa-fire-alt fa-2x mb-2"></i>
                                <p>No orders are being prepared.</p>
                            </div>
                            <div v-for="order in preparingOrders" :key="order.id" class="card order-card">
                                <div class="card-body">
                                     <div class="d-flex justify-content-between">
                                        <h5 class="card-title font-weight-bold">Order #{{ order.id }}</h5>
                                        <span class="text-muted small">{{ order.createdAt }}</span>
                                    </div>
                                    <h6 class="card-subtitle mb-2 text-muted">For: {{ order.customerName }}</h6>
                                    
                                    <div v-if="order.is_scheduled && order.scheduled_date" class="alert alert-info small p-2 mt-2 mb-2">
                                        <i class="fas fa-calendar-alt mr-2"></i>
                                        <strong>Scheduled: {{ order.scheduled_date }}, {{ order.scheduled_time }}</strong>
                                    </div>
                                    <div class="mb-2">
                                        <span class="badge" :class="order.order_type === 'dine_in' ? 'badge-info' : 'badge-primary'">
                                            <i :class="order.order_type === 'dine_in' ? 'fas fa-utensils' : 'fas fa-shopping-bag'"></i>
                                            {{ order.order_type === 'dine_in' ? 'Dine-In' : 'Takeaway' }}
                                        </span>
                                    </div>
                                    <ul class="item-list list-unstyled"><li v-for="item in order.items" :key="item.name">{{ item.quantity }} x {{ item.name }}</li></ul>
                                    <button class="btn btn-primary btn-block mt-3" @click="updateStatus(order.id, 'ready')">Mark as Ready</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Ready for Pickup Column -->
                <div class="col-lg-4 mb-4">
                    <div class="order-column">
                        <h4 class="column-title" style="color: #28a745;">Ready for Pickup ({{ readyForPickupOrders.length }})</h4>
                        <div class="order-list">
                            <div v-if="readyForPickupOrders.length === 0" class="text-center text-muted p-5">
                                <i class="fas fa-check-circle fa-2x mb-2"></i>
                                <p>No orders are ready.</p>
                            </div>
                            <div v-for="order in readyForPickupOrders" :key="order.id" class="card order-card">
                                <div class="card-body">
                                    <h5 class="card-title font-weight-bold">Order #{{ order.id }}</h5>
                                    <h6 class="card-subtitle mb-2 text-muted">For: {{ order.customerName }}</h6>
                                    
                                    <div v-if="order.is_scheduled && order.scheduled_date" class="alert alert-info small p-2 mt-2 mb-2">
                                        <i class="fas fa-calendar-alt mr-2"></i>
                                        <strong>Scheduled: {{ order.scheduled_date }}, {{ order.scheduled_time }}</strong>
                                    </div>
                                    <div class="mb-2">
                                        <span class="badge" :class="order.order_type === 'dine_in' ? 'badge-info' : 'badge-primary'">
                                            <i :class="order.order_type === 'dine_in' ? 'fas fa-utensils' : 'fas fa-shopping-bag'"></i>
                                            {{ order.order_type === 'dine_in' ? 'Dine-In' : 'Takeaway' }}
                                        </span>
                                    </div>
                                    <ul class="item-list list-unstyled"><li v-for="item in order.items" :key="item.name">{{ item.quantity }} x {{ item.name }}</li></ul>
                                    
                                    <div class="verification-section mt-3 pt-3 border-top">
                                        <label class="font-weight-bold">Verify Customer OTP</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control" v-model="otpInputs[order.id]" placeholder="Enter 6-digit OTP" maxlength="6" @keyup.enter="verifyOrder(order.id)">
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
            loading: true,
            error: null,
            orders: [],
            intervalId: null, // To store the timer for auto-refresh
            otpInputs: {}, // Object to hold OTP input for each order
        };
    },
    computed: {
        // Filter orders into columns
        newOrders() { return this.orders.filter(o => o.status === 'placed'); },
        preparingOrders() { return this.orders.filter(o => o.status === 'preparing'); },
        readyForPickupOrders() { return this.orders.filter(o => o.status === 'ready'); }
    },
    methods: {
        async fetchOrders() {
            this.error = null;
            try {
                // ✅ UPDATED: Use apiService.get
                const data = await apiService.get('/api/restaurant/orders');
                this.orders = data;
                
                // Initialize otpInputs for new orders that aren't in the object yet
                data.forEach(order => {
                    if (!this.otpInputs.hasOwnProperty(order.id)) {
                        // Use Vue.set to make the new property reactive
                        this.$set(this.otpInputs, order.id, '');
                    }
                });
            } catch (err) {
                this.error = "Failed to load orders: " + err.message;
                console.error("Error fetching orders:", err);
                clearInterval(this.intervalId); // Stop polling on error
            } finally {
                this.loading = false;
            }
        },
        async updateStatus(orderId, newStatus) {
            const confirmMessage = newStatus === 'rejected' ? 'Are you sure you want to reject this order?' : null;
            if (confirmMessage && !confirm(confirmMessage)) return;
            
            try {
                // ✅ UPDATED: Use apiService.patch
                await apiService.patch(`/api/restaurant/orders/${orderId}/status`, { status: newStatus });
                this.fetchOrders(); // Refresh list after status update
            } catch (err) {
                alert('Error: ' + err.message);
                console.error("Error updating status:", err);
            }
        },
        async verifyOrder(orderId) {
            const otp = this.otpInputs[orderId];
            if (!otp || !/^\d{6}$/.test(otp)) {
                alert('Please enter a valid 6-digit OTP.');
                return;
            }
            try {
                // ✅ UPDATED: Use apiService.post
                const data = await apiService.post(`/api/restaurant/orders/${orderId}/verify`, { otp: otp });
                alert(data.message || "Order verified!");
                this.otpInputs[orderId] = ''; // Clear input
                this.fetchOrders(); // Refresh list after verification
            } catch (err) {
                alert('Verification Failed: ' + err.message);
                console.error("Error verifying OTP:", err);
            }
        }
    },
    mounted() {
        this.fetchOrders(); // Fetch immediately
        // Set up auto-refresh
        this.intervalId = setInterval(this.fetchOrders, 30000); // 30 seconds
    },
    beforeDestroy() {
        // Important: Clear the interval when the component is destroyed
        // to prevent memory leaks.
        clearInterval(this.intervalId);
    }
};
// NOTE: No export default needed

