const CustomerLoginPage = {
    template: `
        <div class="login-container">
            <div class="card login-card">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h3 class="card-title">Welcome Back!</h3>
                        <p class="text-muted">Sign in to continue to Foodle</p>
                    </div>
                    
                    <form @submit.prevent="handleLogin">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>

                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" 
                                   class="form-control" 
                                   id="email" 
                                   v-model="email"
                                   placeholder="Enter your email" 
                                   required>
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" 
                                   class="form-control" 
                                   id="password" 
                                   v-model="password"
                                   placeholder="Enter your password" 
                                   required>
                        </div>
                        
                        <div class="text-right mb-4">
                            <a href="#" class="small">Forgot Password?</a>
                        </div>

                        <button type="submit" class="btn btn-brand btn-block">Login</button>
                    </form>

                    <p class="text-center small mt-4">
                        Don't have an account? 
                        <router-link to="/register">Sign Up</router-link>
                    </p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            email: '',
            password: '',
            error: null,
        };
    },
    methods: {
        async handleLogin() {
            this.error = null;
            try {
                // Call the central login action from the Vuex store
                await this.$store.dispatch('login', {
                    email: this.email,
                    password: this.password,
                });

                // --- THIS IS THE FIX ---
                // After successful login, check the user's roles and redirect accordingly.
                const userRoles = this.$store.getters.userRoles;

                if (userRoles.includes('admin')) {
                    this.$router.push('/admin/dashboard');
                } else if (userRoles.includes('owner')) {
                    this.$router.push('/restaurant/dashboard');
                } else {
                    // Default redirect for customers or if no specific role matches
                    this.$router.push('/');
                }

            } catch (error) {
                // If the store action throws an error, display it
                this.error = error.message;
            }
        },
    },
};

export default CustomerLoginPage;
