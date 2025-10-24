// NOTE: No imports needed. Assumes CartItem component and Vuex store are global.

const CustomerCartPage = {
    // Register the components it uses
    components: {
        'cart-item': CartItem
    },
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-4">Your Shopping <span class="text-brand">Cart</span></h2>
            
            <!-- Check if cart has items -->
            <div v-if="cartItems.length > 0" class="row">
                <!-- Column for cart items -->
                <div class="col-lg-8">
                    <div v-for="item in cartItems" :key="item.id">
                        <!-- Use the cart-item component -->
                        <cart-item 
                            :cartItem="item" 
                            @update-quantity="updateQuantity" 
                            @remove-item="removeItem">
                        </cart-item>
                    </div>
                </div>
                
                <!-- Column for order summary -->
                <div class="col-lg-4">
                    <div class="card order-summary-card">
                        <div class="card-body">
                            <h4 class="card-title">Order Summary</h4>
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Subtotal</span><strong>₹{{ subtotal.toLocaleString('en-IN') }}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Delivery Fee (Fixed)</span><strong>₹{{ deliveryFee.toLocaleString('en-IN') }}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between total-row">
                                    <h5>Total</h5><h5>₹{{ total.toLocaleString('en-IN') }}</h5>
                                </li>
                            </ul>
                            <button class="btn btn-brand btn-block mt-4" @click="$router.push('/checkout')">Proceed to Checkout</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Show this message if cart is empty -->
            <div v-else class="text-center empty-cart-container">
                <img src="/assets/images/empty-cart.png" alt="Empty Cart" class="empty-state-image" style="opacity: 0.5;">
                <h3 class="mt-4">Your Cart is Empty</h3>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <button class="btn btn-brand mt-2" @click="$router.push('/')">Continue Shopping</button>
            </div>
        </div>
    `,
    data() {
        return {
            deliveryFee: 50.00 // Example delivery fee
        };
    },
    computed: {
        // Get data directly from the Vuex store
        ...Vuex.mapGetters(['cartItems', 'cartTotal']),
        
        subtotal() {
            return this.cartTotal;
        },
        total() {
            return this.subtotal + this.deliveryFee;
        }
    },
    methods: {
        // Send commands to the Vuex store to update the state
        updateQuantity(payload) {
            this.$store.dispatch('updateCartQuantity', payload);
        },
        removeItem(itemId) {
            this.$store.dispatch('removeItemFromCart', itemId);
        }
    }
};
// NOTE: No export default needed

