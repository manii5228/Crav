const RestaurantCard = {
    props: ['restaurant'], // Expects a 'restaurant' object with id, name, image, cuisine, etc.
    template: `
        <div class="card restaurant-card h-100" @click="viewMenu">
            <img :src="restaurant.image" class="card-img-top" :alt="restaurant.name">
            <div class="card-body">
                <h5 class="card-title">{{ restaurant.name }}</h5>
                <p class="card-text text-muted">{{ restaurant.cuisine }}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="text-warning">★</span>
                        <strong>{{ restaurant.rating }}</strong>
                        <small class="text-muted">({{ restaurant.reviews }}+)</small>
                    </div>
                    <a href="#" class="btn btn-sm btn-outline-brand">View Menu</a>
                </div>
            </div>
        </div>
    `,
    methods: {
        viewMenu() {
            // Navigates to the detailed page for this specific restaurant
            this.$router.push({ name: 'RestaurantDetail', params: { id: this.restaurant.id } });
        }
    }
};

export default RestaurantCard;