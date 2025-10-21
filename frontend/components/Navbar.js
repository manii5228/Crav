const Navbar = {
    template: `
        <nav class="navbar navbar-expand-lg navbar-light bg-light py-3 shadow-sm sticky-top">
            <div class="container">
                <router-link class="navbar-brand font-weight-bold" to="/">Crav</router-link>
                
                <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav mr-auto">
                        <li class="nav-item">
                            <router-link to="/" class="nav-link" exact>Home</router-link>
                        </li>
                    </ul>

                    <div class="navbar-nav">
                        <div v-if="!isAuthenticated" class="d-flex">
                            <router-link to="/restaurant/login" class="btn btn-outline-secondary mx-2">For Business</router-link>
                            <router-link to="/login" class="btn btn-outline-primary mx-2">Login</router-link>
                            <router-link to="/register" class="btn btn-primary">Sign Up</router-link>
                        </div>

                        <div v-else class="d-flex align-items-center">
                            
                            <router-link v-if="isCustomer" to="/cart" class="nav-link cart-icon">
                                <i class="fas fa-shopping-cart"></i>
                                <span v-if="cartItemCount > 0" class="badge badge-danger cart-badge">{{ cartItemCount }}</span>
                            </router-link>

                            <div class="dropdown">
                                <button class="btn btn-secondary dropdown-toggle" type="button" id="profileDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Hello, {{ userName }}
                                </button>
                                <div class="dropdown-menu dropdown-menu-right" aria-labelledby="profileDropdown">
                                    
                                    <template v-if="isCustomer">
                                        <router-link to="/profile" class="dropdown-item">My Profile</router-link>
                                        <router-link to="/orders" class="dropdown-item">My Orders</router-link>
                                        <router-link to="/favorites" class="dropdown-item">My Favorites</router-link>
                                        <router-link to="/rewards" class="dropdown-item">My Rewards</router-link>
                                    </template>
                                    
                                    <template v-if="isOwner">
                                        <router-link to="/restaurant/dashboard" class="dropdown-item">Dashboard</router-link>
                                        <router-link to="/restaurant/orders" class="dropdown-item">Order Queue</router-link>
                                        <router-link to="/restaurant/menu" class="dropdown-item">Menu Management</router-link>
                                        <router-link to="/restaurant/profile" class="dropdown-item">Restaurant Profile</router-link>
                                        <router-link to="/restaurant/promotions" class="dropdown-item">Promotions</router-link>
                                        <router-link to="/restaurant/analytics" class="dropdown-item">Analytics</router-link>
                                        <router-link to="/restaurant/timeslots" class="dropdown-item">Time Slots</router-link>
                                    </template>
                                    
                                    <template v-if="isAdmin">
                                        <router-link to="/admin/dashboard" class="dropdown-item">Dashboard</router-link>
                                        <router-link to="/admin/restaurants" class="dropdown-item">Restaurant Mgmt</router-link>
                                        <router-link to="/admin/users" class="dropdown-item">User Mgmt</router-link>
                                        <router-link to="/admin/orders" class="dropdown-item">All Orders</router-link>
                                        <router-link to="/admin/coupons" class="dropdown-item">Platform Coupons</router-link>
                                        <router-link to="/admin/reviews" class="dropdown-item">Review Moderation</router-link>
                                        <router-link to="/admin/reports" class="dropdown-item">Reports</router-link>
                                    </template>
                                    
                                    <div class="dropdown-divider"></div>
                                    <a class="dropdown-item" href="#" @click.prevent="handleLogout">Logout</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    `,
    computed: {
        ...Vuex.mapGetters(['isAuthenticated', 'currentUser', 'cartItemCount']),
        userName() {
            // A more robust way to get the user's name that handles the user object not being set yet.
            return this.currentUser ? this.currentUser.name || this.currentUser.email : 'User';
        },
        userRoles() {
            // A safer way to access roles to prevent errors if currentUser is null.
            return this.currentUser ? this.currentUser.roles : [];
        },
        isCustomer() { return this.userRoles.includes('customer'); },
        isOwner() { return this.userRoles.includes('owner'); },
        isAdmin() { return this.userRoles.includes('admin'); }
    },
    methods: {
        handleLogout() {
            this.$store.dispatch('logout');
            if (this.$route.path !== '/') {
                this.$router.push('/');
            }
        }
    }
};

