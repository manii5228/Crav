// NOTE: No imports needed. Assumes ReviewForm, apiService, and Vuex store are global.

const CustomerOrderHistoryPage = {
    components: {
        'review-form': ReviewForm, // Assumes ReviewForm is globally available
    },
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-5">Order <span class="text-brand">History</span></h2>

            <div v-if="loading" class="text-center"><p>Loading your order history...</p></div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error && orders.length > 0">
                <div v-for="order in orders" :key="order.id" class="card order-history-card mb-3">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <h6 class="text-muted">ORDER #{{ order.id }}</h6>
                                <strong>{{ order.restaurantName }}</strong>
                            </div>
                            <div class="col-md-2">
                                <h6 class="text-muted">DATE</h6>
                                <strong>{{ order.date }}</strong>
                            </div>
                            <div class="col-md-2">
                                <h6 class="text-muted">TOTAL</h6>
                                <strong>₹{{ order.total.toLocaleString('en-IN') }}</strong>
                            </div>
                            <div class="col-md-2 text-center">
                                <span class="status-badge" :class="order.status.toLowerCase()">{{ order.status }}</span>
                            </div>
                            <div class="col-md-3 text-right">
                                <button class="btn btn-sm btn-outline-secondary mr-2" @click="viewOrderDetails(order.id)">View Details</button>
                                
                                <!-- Show 'Leave a Review' button if order is completed and has no review -->
                                <button v-if="order.status.toLowerCase() === 'completed' && !order.has_review" 
                                        class="btn btn-sm btn-brand" 
                                        @click="toggleReviewForm(order.id)">
                                    {{ activeReviewOrderId === order.id ? 'Cancel' : 'Leave a Review' }}
                                </button>
                                <!-- Show 'Reviewed' status if it has a review -->
                                <span v-if="order.has_review" class="text-success small" style="vertical-align: middle;">
                                    <i class="fas fa-check-circle mr-1"></i> Reviewed
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Review form appears inline when toggled -->
                    <div v-if="activeReviewOrderId === order.id" class="review-form-container border-top p-4">
                        <review-form @review-submitted="submitReviewForOrder(order.id, $event)"></review-form>
                    </div>
                </div>
            </div>
            
            <!-- Empty state if no orders are found -->
            <div v-if="!loading && !error && orders.length === 0" class="text-center empty-state-container">
                <img src="/assets/images/empty-cart.png" alt="No Orders" class="empty-state-image" style="opacity: 0.5;">
                <h3 class="mt-4">You Haven't Placed Any Orders Yet</h3>
                <p>Your past orders will appear here.</p>
                <button class="btn btn-brand mt-2" @click="$router.push('/')">Start Ordering</button>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            error: null,
            orders: [],
            activeReviewOrderId: null, // Tracks which order's review form is open
        };
    },
    methods: {
        async fetchOrderHistory() {
            this.loading = true;
            this.error = null;
            try {
                // ✅ UPDATED: Use apiService.get
                this.orders = await apiService.get('/api/orders');
            } catch (err) {
                this.error = err.message;
                console.error("Error fetching order history:", err);
            } finally {
                this.loading = false;
            }
        },
        viewOrderDetails(orderId) {
            // Navigate to the order detail page
            this.$router.push({ name: 'OrderDetail', params: { id: orderId } });
        },
        toggleReviewForm(orderId) {
            // Toggle the review form for the specific order
            this.activeReviewOrderId = this.activeReviewOrderId === orderId ? null : orderId;
        },
        async submitReviewForOrder(orderId, reviewData) {
            try {
                // ✅ UPDATED: Use apiService.post
                const data = await apiService.post(`/api/orders/${orderId}/review`, {
                    rating: reviewData.rating,
                    comment: reviewData.comment
                });
                
                alert("Thank you for your review!");
                this.activeReviewOrderId = null; // Close the form
                this.fetchOrderHistory(); // Refresh the order list to show "Reviewed" status
                
            } catch (err) {
                alert('Error submitting review: ' + err.message);
                console.error("Error submitting review:", err);
            }
        }
    },
    mounted() {
        // Fetch data when the component is loaded
        this.fetchOrderHistory();
    }
};
// NOTE: No export default needed

