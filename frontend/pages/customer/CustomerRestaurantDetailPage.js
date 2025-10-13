import MenuItem from '../../components/MenuItem.js';

const CustomerRestaurantDetailPage = {
    components: {
        MenuItem,
    },
    template: `
        <div>
            <!-- (Your template is unchanged and correct) -->
            <div v-if="loading" class="text-center my-5">Loading restaurant details...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error && restaurant">
                <div class="restaurant-header text-center">
                    <div class="container">
                        <h1 class="restaurant-title">{{ restaurant.name }}</h1>
                        <p class="lead text-muted">{{ restaurant.cuisine }}</p>
                        <p><strong>Address:</strong> {{ restaurant.address }}</p>
                        <button class="btn btn-favorite" @click="toggleFavorite">
                            <i :class="isFavorite ? 'fas fa-heart text-danger' : 'far fa-heart'"></i>
                            {{ isFavorite ? 'Favorited' : 'Add to Favorites' }}
                        </button>
                    </div>
                </div>

                <div class="container my-5">
                    <div v-for="category in restaurant.categories" :key="category.id" class="mb-5">
                        <h2 class="category-title">{{ category.name }}</h2>
                        <hr>
                        <div class="row">
                            <div v-for="item in category.menu_items" :key="item.id" class="col-lg-4 col-md-6 mb-4">
                                <MenuItem :item="item" @add-to-cart="handleAddToCart" />
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
            restaurant: null,
            isFavorite: false,
        };
    },
    async mounted() {
        await this.fetchRestaurantDetails();
    },
    methods: {
        async fetchRestaurantDetails() {
            // ... (this method is unchanged and correct)
        },
        async toggleFavorite() {
            // ... (this method is unchanged and correct)
        },
        // --- THIS METHOD IS NOW FIXED ---
        handleAddToCart(item) {
            if (!this.$store.getters.isAuthenticated) {
                alert("Please log in to add items to your cart.");
                this.$router.push('/login');
                return;
            }
            // We now pass the payload in the correct shape: { item, restaurantId }
            this.$store.dispatch('addItemToCart', { 
                item: item, 
                restaurantId: this.restaurant.id 
            });
            alert(`${item.name} has been added to your cart!`);
        }
    }
};

export default CustomerRestaurantDetailPage;

