// NOTE: No imports needed. Assumes apiService, Vuex store are global.

const CustomerCheckoutPage = {
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-4">Finalize Your <span class="text-brand">Order</span></h2>
            <div class="row">
                <div class="col-lg-7">

                    <!-- Order Type Selection -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <h4 class="card-title">1. Choose Order Type</h4>
                            <div class="btn-group btn-group-toggle d-flex">
                                <label class="btn btn-outline-brand w-100" :class="{ active: orderType === 'takeaway' }" @click="selectOrderType('takeaway')">
                                    <input type="radio" name="orderTypeOptions" value="takeaway" autocomplete="off"> <i class="fas fa-shopping-bag mr-2"></i>Takeaway
                                </label>
                                <label class="btn btn-outline-brand w-100" :class="{ active: orderType === 'dine_in' }" @click="selectOrderType('dine_in')">
                                    <input type="radio" name="orderTypeOptions" value="dine_in" autocomplete="off"> <i class="fas fa-utensils mr-2"></i>Dine-In
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Scheduling Section -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <h4 class="card-title">2. Choose When</h4>
                            
                            <div v-if="orderType === 'takeaway'" class="form-group">
                                <div class="btn-group btn-group-toggle d-flex">
                                    <label class="btn btn-outline-secondary w-100" :class="{ active: scheduleChoice === 'now' }" @click="scheduleChoice = 'now'">
                                        <input type="radio" value="now"> Order Now
                                    </label>
                                    <label class="btn btn-outline-secondary w-100" :class="{ active: scheduleChoice === 'later' }" @click="scheduleChoice = 'later'">
                                        <input type="radio" value="later"> Schedule for Later
                                    </label>
                                </div>
                            </div>
                            
                            <div v-if="isScheduling">
                                <hr v-if="orderType === 'takeaway'">
                                <p v-if="orderType === 'dine_in'" class="text-muted small">Please select a date and time for your reservation.</p>

                                <div v-if="slotsLoading" class="text-muted">Loading available slots...</div>
                                <div v-if="slotsError" class="alert alert-warning">{{ slotsError }}</div>
                                
                                <div v-if="!slotsLoading && availableDays.length > 0" class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="scheduleDate">Select Date</label>
                                        <select id="scheduleDate" class="form-control" v-model="selectedDate">
                                            <option v-for="day in availableDays" :key="day.date_value" :value="day.date_value">
                                                {{ day.date_display }}
                                            </option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="scheduleTime">Select Time</label>
                                        <select id="scheduleTime" class="form-control" v-model="selectedTime" required>
                                            <option :value="null">-- Please select --</option>
                                            <option v-for="slot in slotsForSelectedDay" :key="slot.value" :value="slot.value">
                                                {{ slot.display }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                <div v-if="!slotsLoading && availableDays.length === 0 && !slotsError" class="alert alert-light text-muted">
                                    This restaurant has no scheduling slots available.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Coupon Section -->
                    <div class="card">
                         <div class="card-body">
                            <h4 class="card-title">3. Apply Coupon</h4>

                            <div v-if="couponsLoading" class="text-muted small my-3">Loading available coupons...</div>
                            <div v-if="!couponsLoading && availableCoupons.length > 0" class="mb-3">
                                <small class="text-muted d-block mb-2">Available for you:</small>
                                <div>
                                    <button v-for="coupon in availableCoupons" 
                                            :key="coupon.code" 
                                            class="btn btn-sm btn-outline-success mr-2 mb-2"
                                            @click="selectAndApplyCoupon(coupon)"
                                            :disabled="!!appliedCoupon">
                                        {{ coupon.code }}
                                    </button>
                                </div>
                            </div>

                            <div v-if="couponError" class="alert alert-danger">{{ couponError }}</div>
                            <div v-if="appliedCoupon" class="alert alert-success">
                                <strong>'{{ appliedCoupon }}' applied!</strong> You saved ₹{{ discountAmount.toLocaleString('en-IN') }}.
                            </div>
                            <div class="input-group">
                                <input type="text" class="form-control" v-model="couponCode" placeholder="Enter coupon code" :disabled="!!appliedCoupon">
                                <div class="input-group-append">
                                    <button class="btn btn-brand" @click="applyCoupon" :disabled="isApplyingCoupon || !!appliedCoupon">
                                        {{ isApplyingCoupon ? '...' : 'Apply' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Order Summary -->
                <div class="col-lg-5">
                    <div class="card order-summary-card">
                        <div class="card-body">
                            <div v-if="error" class="alert alert-danger">{{ error }}</div>
                            <h4 class="card-title">Order Summary</h4>
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Subtotal</span><strong>₹{{ subtotal.toLocaleString('en-IN') }}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Delivery Fee</span><strong>₹{{ deliveryFee.toLocaleString('en-IN') }}</strong>
                                </li>
                                <li v-if="appliedCoupon" class="list-group-item d-flex justify-content-between text-success">
                                    <span>Discount</span><strong>-₹{{ discountAmount.toLocaleString('en-IN') }}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between total-row">
                                    <h5>Total</h5><h5>₹{{ total.toLocaleString('en-IN') }}</h5>
                                </li>
                            </ul>
                            <button class="btn btn-brand btn-block mt-4" @click="placeOrder" :disabled="isPlacing || (isScheduling && !selectedTime) || cartItems.length === 0">
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
            isPlacing: false,
            error: null,
            deliveryFee: 50.00,
            orderType: 'takeaway',
            scheduleChoice: 'now',
            slotsLoading: true,
            slotsError: null,
            availableDays: [],
            selectedDate: null,
            selectedTime: null, // This should store the 24-hour time value, e.g., "14:30"
            isApplyingCoupon: false,
            couponCode: '',
            couponError: null,
            appliedCoupon: null,
            discountAmount: 0,
            availableCoupons: [],
            couponsLoading: true,
        };
    },
    computed: {
        ...Vuex.mapGetters(['cartItems', 'cartTotal', 'cartRestaurantId']),
        subtotal() {
            return this.cartTotal;
        },
        total() {
            return Math.max(0, this.subtotal + this.deliveryFee - this.discountAmount);
        },
        isScheduling() {
            // An order is "scheduling" if it's dine-in OR if it's takeaway for later
            return this.orderType === 'dine_in' || this.scheduleChoice === 'later';
        },
        slotsForSelectedDay() {
            if (!this.selectedDate) return [];
            const day = this.availableDays.find(d => d.date_value === this.selectedDate);
            return day ? day.slots : [];
        }
    },
    watch: {
        isScheduling(isScheduling) {
            // When scheduling is activated, pre-select the first available date
            if (isScheduling && this.availableDays.length > 0 && !this.selectedDate) {
                this.selectedDate = this.availableDays[0].date_value;
            } else if (!isScheduling) {
                // If not scheduling, clear selections
                this.selectedDate = null;
                this.selectedTime = null;
            }
        },
        selectedDate() {
            // When date changes, reset the selected time
            this.selectedTime = null;
        }
    },
    methods: {
        selectOrderType(type) {
            this.orderType = type;
            // If user selects dine-in, they must schedule.
            // If they select takeaway, default to 'now'.
            if (type === 'dine_in') {
                this.scheduleChoice = 'later';
            } else {
                this.scheduleChoice = 'now';
            }
        },
        async fetchAvailableSlots() {
            if (!this.cartRestaurantId) {
                this.slotsError = "Your cart is empty. Please add an item to see slots.";
                this.slotsLoading = false;
                return;
            }
            this.slotsLoading = true;
            this.slotsError = null;
            try {
                // ✅ UPDATED: Use apiService.get
                this.availableDays = await apiService.get(`/api/restaurant/${this.cartRestaurantId}/available-slots`);
                if (this.availableDays.length === 0) {
                    this.slotsError = "This restaurant has no scheduled time slots available for any day.";
                } else {
                    // Pre-select first date if scheduling is already active
                    if (this.isScheduling && !this.selectedDate) {
                        this.selectedDate = this.availableDays[0].date_value;
                    }
                }
            } catch (err) {
                this.slotsError = err.message;
                console.error("Error fetching slots:", err);
            } finally {
                this.slotsLoading = false;
            }
        },
        async fetchApplicableCoupons() {
            if (!this.cartRestaurantId) return;
            this.couponsLoading = true;
            try {
                // ✅ UPDATED: Use apiService.get
                this.availableCoupons = await apiService.get(`/api/coupons/applicable/${this.cartRestaurantId}`);
            } catch (err) {
                console.error("Error loading coupons:", err.message); // Log silently
            } finally {
                this.couponsLoading = false;
            }
        },
        selectAndApplyCoupon(coupon) {
            this.couponCode = coupon.code;
            this.applyCoupon();
        },
        async applyCoupon() {
            if (!this.couponCode) {
                this.couponError = "Please enter a code.";
                return;
            }
            this.isApplyingCoupon = true;
            this.couponError = null;
            try {
                // ✅ UPDATED: Use apiService.post
                const data = await apiService.post('/api/coupons/apply', {
                    code: this.couponCode,
                    subtotal: this.subtotal,
                    restaurant_id: this.cartRestaurantId
                });
                this.discountAmount = data.discount;
                this.appliedCoupon = this.couponCode;
            } catch (err) {
                this.couponError = err.message;
            } finally {
                this.isApplyingCoupon = false;
            }
        },
        async placeOrder() {
            this.isPlacing = true;
            this.error = null;
            if (this.isScheduling && !this.selectedTime) {
                this.error = "Please select a date and time slot for your scheduled order.";
                this.isPlacing = false;
                return;
            }
            
            // Construct the full ISO 8601-like string for the backend
            let fullScheduledTime = null;
            if(this.isScheduling && this.selectedDate && this.selectedTime) {
                // e.g., "2025-10-25" + "T" + "14:30:00"
                // Assuming selectedTime is "HH:MM" (like 14:30), we add ":00" for seconds.
                // If your backend is flexible, "YYYY-MM-DDTHH:MM" might also work.
                fullScheduledTime = `${this.selectedDate}T${this.selectedTime}:00`; 
            }

            const payload = {
                restaurant_id: this.cartRestaurantId,
                order_type: this.orderType,
                items: this.cartItems.map(item => ({ menu_item_id: item.id, quantity: item.quantity })),
                coupon_code: this.appliedCoupon,
                is_scheduled: this.isScheduling,
                // Send the full timestamp string, or null if not scheduling
                scheduled_time: fullScheduledTime 
            };

            try {
                // ✅ UPDATED: Use apiService.post
                const data = await apiService.post('/api/orders', payload);
                this.$store.dispatch('clearCart');
                alert(data.message || "Order placed successfully!");
                // Redirect to the order detail page for the new order
                this.$router.push({ name: 'OrderDetail', params: { id: data.order_id } });
            } catch (err) {
                this.error = err.message;
                console.error("Error placing order:", err);
            } finally {
                this.isPlacing = false;
            }
        }
    },
    async mounted() {
        // Fetch data on component load
        // Wait for cartRestaurantId to be available from Vuex
        if (this.cartRestaurantId) {
             await this.fetchAvailableSlots();
             await this.fetchApplicableCoupons();
        } else {
             this.slotsError = "Your cart is empty. Please add an item to start an order.";
             this.slotsLoading = false;
             this.couponsLoading = false;
        }
    }
};
// NOTE: No export default needed

