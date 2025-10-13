const CartItem = {
    props: ['cartItem'], // Expects an item from the cart, including quantity
    template: `
        <div class="card card-body mb-3 cart-item-card">
            <div class="row align-items-center">
                <div class="col-2">
                    <img :src="cartItem.image" class="img-fluid rounded" :alt="cartItem.name">
                </div>
                <div class="col-4">
                    <h5 class="mb-0">{{ cartItem.name }}</h5>
                    <small class="text-muted">\${{ cartItem.price.toFixed(2) }} each</small>
                </div>
                <div class="col-3 text-center">
                    <div class="d-flex justify-content-center align-items-center">
                        <button class="btn btn-sm btn-outline-secondary" @click="decreaseQuantity">-</button>
                        <span class="mx-3 font-weight-bold">{{ cartItem.quantity }}</span>
                        <button class="btn btn-sm btn-outline-secondary" @click="increaseQuantity">+</button>
                    </div>
                </div>
                <div class="col-3 text-right">
                    <h5 class="mb-0">\${{ itemTotal.toFixed(2) }}</h5>
                    <a href="#" class="text-danger" @click.prevent="removeItem">Remove</a>
                </div>
            </div>
        </div>
    `,
    computed: {
        // Calculates the total price for this line item
        itemTotal() {
            return this.cartItem.price * this.cartItem.quantity;
        }
    },
    methods: {
        increaseQuantity() {
            this.$emit('update-quantity', { id: this.cartItem.id, quantity: this.cartItem.quantity + 1 });
        },
        decreaseQuantity() {
            if (this.cartItem.quantity > 1) {
                this.$emit('update-quantity', { id: this.cartItem.id, quantity: this.cartItem.quantity - 1 });
            } else {
                // If quantity is 1, decreasing it further should remove it
                this.removeItem();
            }
        },
        removeItem() {
            this.$emit('remove-item', this.cartItem.id);
        }
    }
};

export default CartItem;