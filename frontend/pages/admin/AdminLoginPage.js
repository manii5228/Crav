// NOTE: No imports needed. Assumes Vuex store and apiService are global.

const AdminLoginPage = {
    template: `
        <div class="login-container">
            <div class="card login-card">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h3 class="card-title">Admin Portal</h3>
                        <p class="text-muted">Sign in to manage the platform</p>
                    </div>

                    <form @submit.prevent="handleLogin">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>

                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email"
                                   class="form-control"
                                   id="email"
                                   v-model="email"
                                   placeholder="Enter admin email"
                                   required>
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password"
                                   class="form-control"
                                   id="password"
                                   v-model="password"
                                   placeholder="Enter password"
                                   required>
                        </div>

                        <button type="submit" class="btn btn-brand btn-block mt-4" :disabled="isLoading">
                             <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                             {{ isLoading ? 'Logging in...' : 'Login' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            email: 'admin@email.com', // Pre-fill for convenience, consider removing in production
            password: 'admin123', // Pre-fill for convenience, consider removing in production
            error: null,
            isLoading: false,
        };
    },
    methods: {
        async handleLogin() {
            this.isLoading = true;
            this.error = null;
            try {
                // Use the central login action from the Vuex store (already updated)
                const user = await this.$store.dispatch('login', {
                    email: this.email,
                    password: this.password,
                });

                // Check if the logged-in user is actually an admin
                if (user && user.roles.includes('admin')) {
                    // On success, redirect to the admin dashboard
                    this.$router.push('/admin/dashboard');
                } else {
                    // If a non-admin user tries to log in here, show an error
                     // Log them out first if the login somehow succeeded without the right role
                     if (this.$store.getters.isAuthenticated) {
                         await this.$store.dispatch('logout');
                     }
                    throw new Error('Access denied. Administrator credentials required.');
                }
            } catch (error) {
                // If the store action throws an error, display it
                this.error = error.message;
                 console.error("Admin login failed:", error);
            } finally {
                this.isLoading = false;
            }
        },
    },
};
// NOTE: No export default needed

