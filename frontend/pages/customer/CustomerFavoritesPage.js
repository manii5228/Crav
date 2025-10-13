import RestaurantCard from '../../components/RestaurantCard.js';

const CustomerFavoritesPage = {
    components: {
        RestaurantCard,
    },
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-5">Your Favorite <span class="text-brand">Restaurants</span></h2>
            
            <!-- Loading and Error States -->
            <div v-if="loading" class="text-center">
                <p>Loading your favorite restaurants...</p>
            </div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <!-- Content: Favorites List -->
            <div v-if="!loading && !error && favorites.length > 0" class="row">
                <div v-for="restaurant in favorites" :key="restaurant.id" class="col-lg-4 col-md-6 mb-4">
                    <RestaurantCard :restaurant="restaurant" />
                </div>
            </div>

            <!-- Content: Empty State -->
            <div v-if="!loading && !error && favorites.length === 0" class="text-center empty-state-container">
                <img src="https://i.imgur.com/giffiRD.png" alt="Empty Favorites" class="empty-state-image">
                <h3 class="mt-4">No Favorites Yet!</h3>
                <p>You can add a restaurant to your favorites from its menu page.</p>
                <button class="btn btn-brand mt-2" @click="$router.push('/')">Explore Restaurants</button>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            error: null,
            favorites: []
        };
    },
    mounted() {
        this.fetchFavorites();
    },
    methods: {
        async fetchFavorites() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                if (!token) {
                    throw new Error("You must be logged in to view your favorites.");
                }
                const response = await fetch('/api/favorites', {
                    headers: {
                        'Authentication-Token': token
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch favorite restaurants.");
                }
                this.favorites = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        }
    }
};

export default CustomerFavoritesPage;
