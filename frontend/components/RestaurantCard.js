const RestaurantCard = {
    props: ['restaurant'],
    template: `
        <div class="card restaurant-card h-100">
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

                    <button class="btn btn-sm btn-outline-brand" @click="viewMenu">
                        View Menu
                    </button>
                </div>
            </div>
        </div>
    `,
    methods: {
        viewMenu() {
            console.log('Navigating to restaurant:', this.restaurant.id);
            this.$router.push({ name: 'RestaurantDetail', params: { id: this.restaurant.id } });
        }
    }
};

export default RestaurantCard;
