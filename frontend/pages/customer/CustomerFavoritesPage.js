const CustomerFavoritesPage = {
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-5">Your Favorite <span class="text-brand">Restaurants</span></h2>
            
            <div v-if="loading" class="text-center">
                <div class="spinner-border text-brand" role="status"></div>
                <p class="mt-2 text-muted">Loading your favorites...</p>
            </div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error && favorites.length > 0" class="row">
                <div v-for="restaurant in favorites" :key="restaurant.id" class="col-lg-4 col-md-6 mb-4">
                    <restaurant-card :restaurant="restaurant"></restaurant-card>
                </div>
            </div>

            <div v-if="!loading && !error && favorites.length === 0" class="text-center empty-state-container">
                <img src="/assets/images/empty-cart.png" alt="No Favorites" class="empty-state-image" style="opacity: 0.5;">
                <h3 class="mt-4">No Favorites Yet!</h3>
                <p>You can add a restaurant to your favorites from its menu page.</p>
                <router-link to="/" class="btn btn-brand mt-2">Explore Restaurants</router-link>
            </div>
        </div>
    `,
    components: {
        'restaurant-card': RestaurantCard
    },
    data() {
        return {
            loading: true,
            error: null,
            favorites: []
        };
    },
    async mounted() {
        this.loading = true;
        this.error = null;
        try {
            this.favorites = await apiService.get('/api/favorites');
        } catch (err) {
            this.error = err.message;
        } finally {
            this.loading = false;
        }
    }
};

