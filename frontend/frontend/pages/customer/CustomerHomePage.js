const CustomerHomePage = {
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
    components: {
        'restaurant-card': RestaurantCard,
        'menu-item': MenuItem
    },
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
        findNearbyRestaurants() {
            this.isLocating = true;
            this.locationError = null;

            if (!navigator.geolocation) {
                this.isLocating = false;
                this.locationError = "Geolocation is not supported by your browser.";
                this.fetchFeaturedRestaurants();
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const data = await apiService.get(`/api/restaurants/nearby?lat=${latitude}&lng=${longitude}`);
                        this.restaurants = data;
                        if (data.length === 0) {
                            this.locationError = "No restaurants found within 7km.";
                            this.fetchFeaturedRestaurants();
                        }
                    } catch (err) {
                        this.locationError = err.message;
                        this.fetchFeaturedRestaurants();
                    } finally {
                        this.isLocating = false;
                        this.loading = false;
                    }
                },
                (error) => {
                    this.isLocating = false;
                    this.locationError = "You denied the request for Geolocation.";
                    this.fetchFeaturedRestaurants();
                }
            );
        },
        async fetchFeaturedRestaurants() {
            this.loading = true;
            try {
                const data = await apiService.get('/api/restaurants/featured');
                if (this.restaurants.length === 0) {
                    this.restaurants = data;
                }
            } catch (err) {
                this.locationError = (this.locationError || "") + " " + err.message;
            } finally {
                this.loading = false;
                this.isLocating = false;
            }
        },
        async fetchRegularMenu() {
            this.menuLoading = true;
            this.menuError = null;
            try {
                this.menu = await apiService.get('/api/menu-items/regular');
            } catch (err) {
                this.menuError = err.message;
            } finally {
                this.menuLoading = false;
            }
        },
        addToCart(item) {
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
        this.findNearbyRestaurants();
        this.fetchRegularMenu();
    }
};

