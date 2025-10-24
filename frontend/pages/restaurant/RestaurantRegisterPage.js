// NOTE: No imports needed. Assumes $, apiService, and router are global.

const RestaurantRegisterPage = {
    template: `
        <div class="login-container">
            <div class="card login-card" style="max-width: 600px;">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h3 class="card-title">Register Your Restaurant</h3>
                        <p class="text-muted">Join our platform and reach more customers!</p>
                    </div>
                    
                    <form @submit.prevent="handleRegister">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>
                        <div v-if="success" class="alert alert-success">{{ success }}</div>

                        <h5 class="form-section-title">Owner's Details</h5>
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="ownerName">Your Full Name</label>
                                <input type="text" class="form-control" id="ownerName" v-model="form.ownerName" required>
                            </div>
                            <div class="form-group col-md-6">
                                <label for="ownerEmail">Your Email</label>
                                <input type="email" class="form-control" id="ownerEmail" v-model="form.ownerEmail" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="password">Create a Password</label>
                            <input type="password" class="form-control" id="password" v-model="form.password" required>
                        </div>

                        <hr class="my-4">
                        
                        <h5 class="form-section-title">Restaurant Details</h5>
                        <div class="form-group">
                            <label for="restaurantName">Restaurant Name</label>
                            <input type="text" class="form-control" id="restaurantName" v-model="form.restaurantName" required>
                        </div>
                        <div class="form-group">
                            <label for="address">Address</label>
                            <input type="text" class="form-control" id="address" v-model="form.address" required>
                        </div>
                        <div class="form-group">
                            <label for="city">City</label>
                            <input type="text" class="form-control" id="city" v-model="form.city" required>
                        </div>

                        <div class="form-group">
                             <button type="button" class="btn btn-sm btn-outline-secondary" @click="geocodeAddress" :disabled="isGeocoding">
                                 <span v-if="isGeocoding" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                 {{ isGeocoding ? 'Finding...' : 'Find on Map' }}
                             </button>
                            <small class="form-text text-muted">Click this after entering your address and city to automatically find your coordinates.</small>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="latitude">Latitude</label>
                                <input type="number" step="any" class="form-control" id="latitude" v-model.number="form.latitude" placeholder="e.g., 40.7128">
                            </div>
                            <div class="form-group col-md-6">
                                <label for="longitude">Longitude</label>
                                <input type="number" step="any" class="form-control" id="longitude" v-model.number="form.longitude" placeholder="e.g., -74.0060">
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-brand btn-block mt-4" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            {{ loading ? 'Submitting...' : 'Submit for Verification' }}
                        </button>
                    </form>

                    <p class="text-center small mt-4">
                        Already have an account? 
                        <router-link to="/restaurant/login">Login Here</router-link>
                    </p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                ownerName: '',
                ownerEmail: '',
                password: '',
                restaurantName: '',
                address: '',
                city: '',
                latitude: null,
                longitude: null
            },
            error: null,
            success: null,
            loading: false, // For the main submit button
            isGeocoding: false, // For the geocode button
        };
    },
    methods: {
        async geocodeAddress() {
            if (!this.form.address || !this.form.city) {
                this.error = "Please enter an address and city first.";
                return;
            }
            this.isGeocoding = true;
            this.error = null;
            try {
                const fullAddress = `${this.form.address}, ${this.form.city}`;
                // ✅ UPDATED: Use apiService.post
                // Note: Geocode is a public-facing helper, so it doesn't need auth
                const data = await apiService.post('/api/geocode', { address: fullAddress });
                this.form.latitude = data.latitude;
                this.form.longitude = data.longitude;
            } catch (err) {
                this.error = err.message;
                console.error("Error geocoding:", err);
            } finally {
                this.isGeocoding = false;
            }
        },
        async handleRegister() {
            this.error = null;
            this.success = null;
            this.loading = true;

            if (this.form.password.length < 6) {
                this.error = 'Password must be at least 6 characters long.';
                this.loading = false;
                return;
            }

            try {
                // ✅ UPDATED: Use apiService.post
                const data = await apiService.post('/api/restaurant/register', this.form);
                this.success = data.message + ' You will be redirected to login.';
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    this.$router.push('/restaurant/login');
                }, 3000);

            } catch (err) {
                this.error = err.message;
                console.error("Error registering restaurant:", err);
            } finally {
                this.loading = false;
            }
        },
    },
};
// NOTE: No export default needed

