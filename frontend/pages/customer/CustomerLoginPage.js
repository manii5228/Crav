const CustomerLoginPage = {
    template: `
        <div class="login-container">
            <div class="card login-card">
                <div class="card-body p-5">
                    <div class="text-center mb-4">
                        <h2 class="card-title">Welcome Back!</h2>
                        <p class="text-muted">Sign in to continue to Crav</p>
                    </div>
                    
                    <div v-if="error" class="alert alert-danger">
                        {{ error }}
                    </div>

                    <form @submit.prevent="handleLogin">
                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" class="form-control" id="email" v-model="email" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" class="form-control" id="password" v-model="password" required>
                        </div>
                        <div class="text-right mb-4">
                            <a href="#" class="small">Forgot Password?</a>
                        </div>
                        <button type="submit" class="btn btn-brand btn-block" :disabled="isLoading">
                            <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            {{ isLoading ? 'Logging in...' : 'Login' }}
                        </button>
                    </form>
                    <p class="text-center mt-4 text-muted">
                        Don't have an account? <router-link to="/register">Sign Up</router-link>
                    </p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            email: 'admin@email.com',
            password: 'admin123',
            error: null,
            isLoading: false,
        };
    },
    methods: {
        async handleLogin() {
            this.isLoading = true;
            this.error = null;
            try {
                // 1. Dispatch the login action and WAIT for it to complete.
                // The action now returns the user object on success.
                const user = await this.$store.dispatch('login', {
                    email: this.email,
                    password: this.password
                });

                // 2. Check the user's roles from the returned data and redirect.
                if (user && user.roles.includes('admin')) {
                    this.$router.push('/admin/dashboard');
                } else if (user && user.roles.includes('owner')) {
                    this.$router.push('/restaurant/dashboard');
                } else {
                    this.$router.push('/');
                }

            } catch (err) {
                // If the action throws an error (handled by apiService), it will be caught here.
                this.error = err.message;
            } finally {
                this.isLoading = false;
            }
        }
    }
};

