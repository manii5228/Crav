import RestaurantCard from '../../components/RestaurantCard.js';

const CustomerHomePage = {
    components: {
        RestaurantCard
    },
    template: `
        <div>
            <!-- HERO SECTION -->
            <section class="hero-section">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-lg-6 text-center text-lg-left">
                            <h1 class="hero-title">All Fast Food is Available at <span class="text-brand">Foodle</span></h1>
                            <p class="my-4">We Are Just A Click Away When You Crave For Delicious Fast Food</p>
                            <button class="btn btn-brand btn-lg" @click="scrollToFeatured">Order Now</button>
                            <button class="btn btn-link btn-lg text-dark" @click="showHowToOrder">How To Order</button>
                        </div>
                        <div class="col-lg-6 mt-5 mt-lg-0">
                            <img src="homepage.jpg" class="img-fluid" alt="Hero Food Image">
                        </div>
                    </div>
                </div>
            </section>

            <!-- FEATURES SECTION -->
            <section class="features-section">
                 <div class="container">
                     <div class="row">
                         <div class="col-md-4 text-center">
                             <div class="feature-box">
                                 <h5>Fast Delivery</h5>
                                 <p>The Food Will Be Delivered To Your Home Within 1-2 Hours Of Your Ordering.</p>
                             </div>
                         </div>
                         <div class="col-md-4 text-center">
                             <div class="feature-box">
                                 <h5>Fresh Food</h5>
                                 <p>Your Food Will Be Delivered 100% Fresh To Your Home, We Do Not Deliver Stale Food.</p>
                             </div>
                         </div>
                         <div class="col-md-4 text-center">
                             <div class="feature-box">
                                 <h5>Free Delivery</h5>
                                 <p>Your Food Delivery Is Absolutely Free, No Cost Just Order And Enjoy.</p>
                             </div>
                         </div>
                     </div>
                 </div>
             </section>

            <!-- FEATURED RESTAURANTS SECTION -->
            <section class="restaurants-section text-center" id="featured-restaurants">
                <div class="container">
                    <h2>Featured <span class="text-brand">Restaurants</span></h2>
                    <p>Order from your favorite local restaurants.</p>
                    
                    <div v-if="loading" class="mt-5">Loading restaurants...</div>
                    <div v-if="error" class="alert alert-danger mt-5">{{ error }}</div>

                    <div v-if="!loading && !error" class="row mt-5">
                        <div v-if="restaurants.length === 0" class="col-12">
                            <p class="text-muted">No featured restaurants available at the moment. Please check back later!</p>
                        </div>
                        <div v-for="restaurant in restaurants" :key="restaurant.id" class="col-lg-4 col-md-6 mb-4">
                            <RestaurantCard :restaurant="restaurant" />
                        </div>
                    </div>
                </div>
            </section>

            <!-- REGULAR MENU SECTION -->
            <section class="menu-section text-center">
                <div class="container">
                    <h2>Our Regular <span class="text-brand">Menu</span></h2>
                    <p>These Are Our Regular Menus, You Can Order Anything You Like.</p>

                    <div v-if="menuLoading" class="mt-5">Loading menu...</div>
                    <div v-if="menuError" class="alert alert-danger mt-5">{{ menuError }}</div>

                    <div v-if="!menuLoading && !menuError" class="row mt-5">
                         <div v-if="menu.length === 0" class="col-12">
                            <p class="text-muted">No menu items to display at the moment.</p>
                        </div>
                        <div v-for="item in menu" :key="item.id" class="col-lg-4 col-md-6 mb-4">
                            <div class="card menu-card h-100">
                                <div class="menu-img-container"><img :src="item.image" class="card-img-top" :alt="item.name"></div>
                                <div class="card-body d-flex flex-column">
                                    <h5 class="card-title">{{ item.name }}</h5>
                                    <div><span class="text-warning">★★★★★</span> <small>({{ item.reviews }})</small></div>
                                    <div class="d-flex justify-content-between align-items-center mt-auto pt-3">
                                        <h4>\${{ item.price.toFixed(2) }}</h4>
                                        <button class="btn btn-brand" @click="addToCart(item)">Buy Now</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- FOOTER AND MODAL -->
            <footer class="footer-section"> ... </footer>
            <div class="modal fade" id="howToOrderModal"> ... </div>
        </div>
    `,
    data() {
        return {
            loading: true, error: null, restaurants: [],
            menuLoading: true, menuError: null, menu: [],
        }
    },
    mounted() {
        this.fetchRestaurants();
        this.fetchRegularMenu();
    },
    methods: {
        async fetchRestaurants() {
            this.loading = true; this.error = null;
            try {
                const response = await fetch('/api/restaurants/featured');
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to load restaurants.");
                this.restaurants = data;
            } catch (err) { this.error = err.message; } finally { this.loading = false; }
        },
        async fetchRegularMenu() {
            this.menuLoading = true; this.menuError = null;
            try {
                const response = await fetch('/api/menu-items/regular');
                const data = await response.json();
                if (!response.ok) throw new Error("Failed to load the menu.");
                this.menu = data;
            } catch (err) { this.menuError = err.message; } finally { this.menuLoading = false; }
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
            const element = document.getElementById('featured-restaurants');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        },
        showHowToOrder() {
            $('#howToOrderModal').modal('show');
        }
    }
};

export default CustomerHomePage;

