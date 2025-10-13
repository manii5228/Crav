const RestaurantRegisterPage = {
    template: `
        <div class="login-container">
            <div class="card login-card" style="max-width: 550px;">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h3 class="card-title">Register Your Restaurant</h3>
                        <p class="text-muted">Join our platform and reach more customers!</p>
                    </div>
                    
                    <form @submit.prevent="handleRegister">
                        <!-- Error and Success Messages -->
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
                        
                        <button type="submit" class="btn btn-brand btn-block mt-4" :disabled="loading">
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
                city: ''
            },
            error: null,
            success: null,
            loading: false,
        };
    },
    methods: {
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
                const response = await fetch('/api/restaurant/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.form)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'An unknown error occurred.');
                }
                
                // Show success message and redirect after a delay
                this.success = data.message + ' You will now be redirected to the login page.';
                setTimeout(() => {
                    this.$router.push('/restaurant/login');
                }, 3000); // 3-second delay

            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
    },
};

export default RestaurantRegisterPage;
