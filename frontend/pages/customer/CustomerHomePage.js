// NOTE: No imports needed. Assumes RestaurantCard, MenuItem, apiService, and Vuex store are global.

const CustomerHomePage = {
    components: {
        'restaurant-card': RestaurantCard,
        'menu-item': MenuItem
    },
    template: `
        <div>
            <!-- HERO SECTION -->
            <section class="hero-section text-center">
                <div class="container">
                    <h1 class="hero-title">Delicious food, delivered.</h1>
                    <p class="lead text-muted">The best restaurants at your fingertips.</p>
                    <button class="btn btn-brand btn-lg mt-3" @click="scrollToFeatured">Browse Restaurants</button>
                </div>
            </section>
            
            <!-- RESTAURANTS SECTION -->
            <section class="container" id="nearby-restaurants">
                <h2>Restaurants Near You</h2>
                
                <!-- STATUS MESSAGES -->
                <div v-if="isLocating" class="alert alert-info">
                    <div class="spinner-border spinner-border-sm" role="status"></div>
                    Finding restaurants near your location...
                </div>
                <div v-if="locationError" class="alert alert-warning">
                    <strong>{{ locationError }}</strong><br>
                    Showing featured restaurants instead.
                </div>
                <div v-if="loading" class="alert alert-info">Loading...</div>

                <!-- RESTAURANT LIST -->
                <div v-if="!loading" class="row">
                    <div v-if="restaurants.length === 0" class="col-12 text-center">
                        <p class="text-muted">No restaurants found. Showing featured restaurants as a fallback.</p>
                    </div>
                    <div v-for="restaurant in restaurants" :key="restaurant.id" class="col-md-4 mb-4">
                        <restaurant-card :restaurant="restaurant"></restaurant-card>
                    </div>
                </div>
            </section>

            <!-- REGULAR MENU SECTION -->
            <section class="container">
                <h2>Our Regular Menu</h2>
                <p class="text-muted">These Are Our Regular Menus, You Can Order Anything You Like.</p>
                <div v-if="menuError" class="alert alert-danger">
                    Failed to load the menu: {{ menuError }}
                </div>
                <div v-if="menuLoading" class="alert alert-info">Loading menu...</div>
                <div v-if="!menuLoading" class="row">
                    <div v-for="item in menu" :key="item.id" class="col-md-4 mb-4">
                        <menu-item :item="item" @add-to-cart="addToCart"></menu-item>
                    </div>
                </div>
            </section>
        </div>
    `,
    data() {
        return {
            loading: true,
            restaurants: [],
            menuLoading: true,
            menu: [],
            locationError: null,
            menuError: null,
            isLocating: true,
        };
    },
    methods: {
        // --- GEOLOCATION AND DATA FETCHING LOGIC ---
        findNearbyRestaurants() {
            this.isLocating = true;
            this.locationError = null;

            if (!navigator.geolocation) {
                this.isLocating = false;
                this.locationError = "Geolocation is not supported by your browser.";
                this.fetchFeaturedRestaurants(); // Fallback
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        // ✅ UPDATED: Use apiService.get
                        const data = await apiService.get(`/api/restaurants/nearby?lat=${latitude}&lng=${longitude}`);
                        this.restaurants = data;
                        if (data.length === 0) {
                            this.locationError = "No restaurants found within 7km.";
                            this.fetchFeaturedRestaurants(); // Fallback if no nearby restaurants
                        }
                    } catch (err) {
                        this.locationError = err.message;
                        this.fetchFeaturedRestaurants(); // Fallback on API error
                    } finally {
                        this.isLocating = false;
                        this.loading = false;
                    }
                },
                (error) => {
                    this.isLocating = false;
                     // Handle different geolocation errors
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            this.locationError = "You denied the request for Geolocation.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            this.locationError = "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            this.locationError = "The request to get user location timed out.";
                            break;
                        default:
                            this.locationError = "An unknown error occurred while getting location.";
                            break;
                    }
                    this.fetchFeaturedRestaurants(); // Fallback if user denies permission or error occurs
                }
            );
        },
        async fetchFeaturedRestaurants() {
            this.loading = true;
            try {
                // ✅ UPDATED: Use apiService.get
                const data = await apiService.get('/api/restaurants/featured');
                // Only populate if nearby search hasn't already done so.
                if (this.restaurants.length === 0) {
                    this.restaurants = data;
                }
            } catch (err) {
                // Combine errors if location error already exists
                this.locationError = (this.locationError ? this.locationError + " " : "") + err.message;
                 console.error("Error fetching featured restaurants:", err);
            } finally {
                this.loading = false;
                this.isLocating = false; // Stop locating indicator
            }
        },
        async fetchRegularMenu() {
            this.menuLoading = true;
            this.menuError = null;
            try {
                // ✅ UPDATED: Use apiService.get
                this.menu = await apiService.get('/api/menu-items/regular');
            } catch (err) {
                this.menuError = err.message;
                 console.error("Error fetching regular menu:", err);
            } finally {
                this.menuLoading = false;
            }
        },
        addToCart(item) {
            // This method is correct, it uses the store
            if (!this.$store.getters.isAuthenticated) {
                alert("Please log in to add items to your cart.");
                this.$router.push('/login');
                return;
            }
            this.$store.dispatch('addItemToCart', { 
                item: item, 
                restaurantId: item.restaurantId 
            });
            alert(`${item.name} has been added to your cart!`);
        },
        scrollToFeatured() {
            const element = document.getElementById('nearby-restaurants');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        },
    },
    mounted() {
        // Fetch data when the component is loaded
        this.findNearbyRestaurants(); // This will handle finding nearby or falling back to featured
        this.fetchRegularMenu();
    }
};
// NOTE: No export default needed

