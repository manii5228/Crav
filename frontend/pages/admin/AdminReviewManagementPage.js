// NOTE: No imports needed. Assumes apiService is global.

const AdminReviewManagementPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Review Moderation</h2>

            <div v-if="loading" class="alert alert-info">Loading all reviews...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="card">
                <div class="card-body">
                    <p class="card-text text-muted">View and manage all customer reviews from across the platform.</p>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th>ID</th><th>Customer</th><th>Restaurant</th>
                                    <th class="text-center">Rating</th><th>Comment</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="reviews.length === 0">
                                    <td colspan="6" class="text-center text-muted">There are no reviews to display.</td>
                                </tr>
                                <tr v-for="review in reviews" :key="review.id">
                                    <td>{{ review.id }}</td>
                                    <td>{{ review.customerName }}</td>
                                    <td><strong>{{ review.restaurantName }}</strong></td>
                                    <td class="text-center">
                                        <span class="text-warning">{{ '★'.repeat(review.rating) }}</span><span class="text-muted">{{ '☆'.repeat(5 - review.rating) }}</span>
                                    </td>
                                    <td>
                                        <div class="comment-cell">{{ review.comment }}</div>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-danger" @click="deleteReview(review.id)">Delete</button>
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
            reviews: []
        };
    },
    methods: {
        async fetchReviews() {
            this.loading = true;
            this.error = null;
            try {
                // Use apiService.get
                this.reviews = await apiService.get('/api/admin/reviews');
            } catch (err) {
                this.error = err.message;
                 console.error("Error fetching reviews:", err);
            } finally {
                this.loading = false;
            }
        },
        async deleteReview(reviewId) {
            if (confirm('Are you sure you want to permanently delete this review?')) {
                try {
                    // Use apiService.delete
                    const data = await apiService.delete(`/api/admin/reviews/${reviewId}`);
                    // Handle potentially empty response for DELETE
                    alert(data ? data.message : 'Review deleted successfully.');
                    this.fetchReviews(); // Refresh list
                } catch (err) {
                     console.error("Error deleting review:", err);
                    alert('Error: ' + err.message);
                }
            }
        }
    },
    mounted() {
        this.fetchReviews();
    }
};
// NOTE: No export default needed

