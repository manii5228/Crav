const MenuItem = {
    props: ['item'], // Expects an 'item' object with name, price, image, etc.
    template: `
        <div class="card menu-card h-100">
            <div class="menu-img-container">
                <img :src="item.image" class="card-img-top" :alt="item.name">
            </div>
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">{{ item.name }}</h5>
                <div v-if="item.reviews">
                    <span class="text-warning">★★★★★</span>
                    <small>({{ item.reviews }})</small>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-auto pt-3">
                    <h4>\${{ item.price.toFixed(2) }}</h4>
                    <button class="btn btn-brand" @click="addToCart">Buy Now</button>
                </div>
            </div>
        </div>
    `,
    methods: {
        addToCart() {
            // Emits an event to the parent page, sending this item's data
            this.$emit('add-to-cart', this.item);
            alert(this.item.name + ' added to cart!');
        }
    }
};

export default MenuItem;