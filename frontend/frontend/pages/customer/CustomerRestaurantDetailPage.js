const CustomerRestaurantDetailPage = {
    template: `
        <div>
            <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-brand" role="status"><span class="sr-only">Loading...</span></div>
                <p class="mt-2">Loading restaurant details...</p>
            </div>
            <div v-if="error" class="container my-5"><div class="alert alert-danger">{{ error }}</div></div>

            <div v-if="!loading && !error && restaurant">
                <div class="restaurant-header text-center">
                    <div class="container">
                        <h1 class="restaurant-title">{{ restaurant.name }}</h1>
                        <div class="mb-2" v-if="restaurant.reviews > 0">
                            <span class="text-warning h5">★</span>
                            <strong class="h5">{{ restaurant.rating }}</strong>
                            <small class="text-muted">({{ restaurant.reviews }} reviews)</small>
                        </div>
                        <div v-else class="text-muted mb-2">No reviews yet</div>
                        <p class="lead text-muted">{{ restaurant.cuisine }}</p>
                        <p>{{ restaurant.description }}</p>
                        <p><strong>Address:</strong> {{ restaurant.address }}</p>
                        
                        <button v-if="isCustomer" class="btn btn-sm btn-outline-danger" @click="toggleFavorite">
                            <i :class="isFavorite ? 'fas fa-heart' : 'far fa-heart'"></i>
                            {{ isFavorite ? 'Favorited' : 'Add to Favorites' }}
                        </button>
                    </div>
                </div>

                <div class="container my-5">
                    <!-- Menu Items Section -->
                    <div v-for="category in restaurant.categories" :key="category.id" class="mb-5">
                        <h2 class="category-title">{{ category.name }}</h2>
                        <hr>
                        <div v-if="category.menu_items.length === 0" class="text-muted"><p>No items in this category yet.</p></div>
                        <div v-else class="row">
                            <div v-for="item in category.menu_items" :key="item.id" class="col-lg-4 col-md-6 mb-4">
                                <menu-item :item="item" @add-to-cart="handleAddToCart"></menu-item>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Reviews Section -->
                    <hr class="my-5">
                    <h2 class="category-title">What People Are Saying</h2>
                    <div v-if="reviewsLoading" class="text-muted">Loading reviews...</div>
                    <div v-if="!reviewsLoading && reviews.length === 0" class="alert alert-light">Be the first to review this restaurant!</div>
                    <div v-if="!reviewsLoading && reviews.length > 0" class="mt-4">
                        <div v-for="review in reviews" :key="review.id" class="card mb-3">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <h5 class="card-title">{{ review.customerName }}</h5>
                                    <span class="text-muted small">{{ review.date }}</span>
                                </div>
                                <div class="mb-2">
                                    <span class="text-warning">{{ '★'.repeat(review.rating) }}</span><span class="text-muted">{{ '☆'.repeat(5 - review.rating) }}</span>
                                </div>
                                <p class="card-text">{{ review.comment }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    components: {
        'menu-item': MenuItem
    },
    data() {
        return {
            loading: true, error: null, restaurant: null, isFavorite: false,
            reviewsLoading: true, reviews: []
        };
    },
    computed: {
        ...Vuex.mapGetters(['userRoles']),
        isCustomer() {
            return this.userRoles && this.userRoles.includes('customer');
        }
    },
    methods: {
        async fetchRestaurantDetails() {
            this.loading = true; this.error = null;
            try {
                const restaurantId = this.$route.params.id;
                this.restaurant = await apiService.get(`/api/restaurants/${restaurantId}`);
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        async fetchReviews() {
            this.reviewsLoading = true;
            try {
                this.reviews = await apiService.get(`/api/restaurants/${this.restaurant.id}/reviews`);
            } catch (err) {
                console.error("Could not fetch reviews:", err.message);
            } finally {
                this.reviewsLoading = false;
            }
        },
        async checkIfFavorite() {
            if (!this.$store.getters.isAuthenticated) return;
            try {
                const favorites = await apiService.get('/api/favorites');
                if (favorites.some(fav => fav.id === this.restaurant.id)) {
                    this.isFavorite = true;
                }
            } catch (err) {
                console.error(err);
            }
        },
        async toggleFavorite() {
            const method = this.isFavorite ? 'delete' : 'post';
            try {
                const data = await apiService[method](`/api/favorites/${this.restaurant.id}`);
                this.isFavorite = !this.isFavorite;
                alert(data.message);
            } catch (err) {
                alert('Error: ' + err.message);
            }
        },
        handleAddToCart(item) {
            if (!this.$store.getters.isAuthenticated) {
                alert("Please log in to add items to your cart.");
                this.$router.push('/login');
                return;
            }
            this.$store.dispatch('addItemToCart', { 
                item: item, 
                restaurantId: this.restaurant.id 
            });
            alert(`${item.name} has been added to your cart!`);
        }
    },
    async mounted() {
        await this.fetchRestaurantDetails();
        if (this.restaurant) {
            await this.fetchReviews();
            if (this.isCustomer) { 
                await this.checkIfFavorite();
            }
        }
    }
};
