const MenuItem = {
    props: ['item'],
    template: `
        <div class="card menu-card h-100">
            <img :src="item.image" class="card-img-top" :alt="item.name">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">{{ item.name }}</h5>
                <div v-if="item.reviews">
                    <span class="text-warning">★★★★★</span>
                    <small>({{ item.reviews }})</small>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-auto pt-3">
                    <h4>₹{{ item.price.toLocaleString('en-IN') }}</h4>
                    <button class="btn btn-brand" @click="addToCart">Buy Now</button>
                </div>
            </div>
        </div>
    `,
    methods: {
        addToCart() {
            this.$emit('add-to-cart', this.item);
            alert(this.item.name + ' added to cart!');
        }
    }
};

export default MenuItem;
