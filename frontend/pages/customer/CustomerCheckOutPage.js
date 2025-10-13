const CustomerCheckoutPage = {
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-4">Finalize Your <span class="text-brand">Order</span></h2>
            <div class="row">
                <div class="col-lg-7">
                     <div class="card">
                        <div class="card-body">
                             <h4 class="card-title">Order Options</h4>
                             <form>
                                 <div class="form-group">
                                     <label>Order Type</label>
                                     <div class="btn-group btn-group-toggle d-flex" data-toggle="buttons">
                                         <label class="btn btn-outline-brand w-100" :class="{ active: orderType === 'takeaway' }">
                                             <input type="radio" v-model="orderType" value="takeaway"> Takeaway
                                         </label>
                                         <label class="btn btn-outline-brand w-100" :class="{ active: orderType === 'dine_in' }">
                                             <input type="radio" v-model="orderType" value="dine_in"> Dine-In
                                         </label>
                                     </div>
                                 </div>
                             </form>
                        </div>
                    </div>
                </div>
                <div class="col-lg-5">
                    <div class="card order-summary-card">
                        <div class="card-body">
                            <div v-if="error" class="alert alert-danger">{{ error }}</div>
                            <h4 class="card-title">Order Summary</h4>
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Subtotal</span><strong>\${{ subtotal.toFixed(2) }}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Delivery Fee</span><strong>\${{ deliveryFee.toFixed(2) }}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between total-row">
                                    <h5>Total</h5><h5>\${{ total.toFixed(2) }}</h5>
                                </li>
                            </ul>
                            <button class="btn btn-brand btn-block mt-4" @click="placeOrder" :disabled="isPlacing">
                                {{ isPlacing ? 'Placing Order...' : 'Place Order' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            isPlacing: false, error: null, deliveryFee: 5.00, orderType: 'takeaway',
        }
    },
    computed: {
        ...Vuex.mapGetters(['cartItems', 'cartTotal', 'cartRestaurantId', 'currentUser']),
        subtotal() { return this.cartTotal; },
        total() { return this.subtotal + this.deliveryFee; }
    },
    methods: {
        async placeOrder() {
            this.isPlacing = true; this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authentication-Token': token },
                    body: JSON.stringify({
                        restaurant_id: this.cartRestaurantId,
                        order_type: this.orderType,
                        items: this.cartItems.map(item => ({ menu_item_id: item.id, quantity: item.quantity })) 
                    })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                
                this.$store.dispatch('clearCart');
                alert(data.message);
                this.$router.push({ name: 'OrderDetail', params: { id: data.orderId } });

            } catch (err) { this.error = err.message; } finally { this.isPlacing = false; }
        }
    }
};
export default CustomerCheckoutPage;
