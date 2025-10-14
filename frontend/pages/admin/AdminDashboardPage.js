const AdminDashboardPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Platform Dashboard</h2>
            
            <!-- Loading and Error States -->
            <div v-if="loading" class="alert alert-info">Loading dashboard data...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <!-- Main Content -->
            <div v-if="!loading && !error">
                <div class="row">
                    <div class="col-lg-3 col-md-6 mb-4">
                        <div class="card stat-card h-100">
                            <div class="card-body">
                                <h6 class="text-muted">TOTAL REVENUE</h6>
                                <strong>₹{{ (item.price * item.quantity).toLocaleString('en-IN') }}</strong>


                            </div>
                        </div>
                    </div>
                     <div class="col-lg-3 col-md-6 mb-4">
                        <div class="card stat-card h-100">
                            <div class="card-body">
                                <h6 class="text-muted">TOTAL ORDERS</h6>
                                <h3 class="stat-number">{{ stats.totalOrders.toLocaleString() }}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-4">
                        <div class="card stat-card h-100">
                            <div class="card-body">
                                <h6 class="text-muted">TOTAL CUSTOMERS</h6>
                                <h3 class="stat-number">{{ stats.totalCustomers.toLocaleString() }}</h3>
                            </div>
                        </div>
                    </div>
                     <div class="col-lg-3 col-md-6 mb-4">
                        <div class="card stat-card h-100">
                            <div class="card-body">
                                <h6 class="text-muted">TOTAL RESTAURANTS</h6>
                                <h3 class="stat-number">{{ stats.totalRestaurants.toLocaleString() }}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mt-4">
                    <div class="card-body">
                        <h4 class="card-title">Pending Restaurant Verifications</h4>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Restaurant Name</th>
                                        <th>Owner Email</th>
                                        <th>City</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="pendingRestaurants.length === 0">
                                        <td colspan="4" class="text-center text-muted">No pending verifications.</td>
                                    </tr>
                                    <tr v-for="resto in pendingRestaurants" :key="resto.id">
                                        <td>{{ resto.name }}</td>
                                        <td>{{ resto.ownerEmail }}</td>
                                        <td>{{ resto.city }}</td>
                                        <td>
                                            <button class="btn btn-sm btn-success mr-2" @click="approveRestaurant(resto.id)">Approve</button>
                                            <!-- <button class="btn btn-sm btn-secondary">View Details</button> -->
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            // Initialize with empty/default data
            loading: true,
            error: null,
            stats: {
                totalRevenue: 0,
                totalOrders: 0,
                totalCustomers: 0,
                totalRestaurants: 0
            },
            pendingRestaurants: []
        }
    },
    async mounted() {
        // This hook runs when the component is added to the page.
        // We fetch the data from our new backend endpoint.
        this.fetchDashboardData();
    },
    methods: {
        async fetchDashboardData() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                if (!token) {
                    throw new Error("Authentication token not found.");
                }

                const response = await fetch('/api/admin/dashboard', {
                    headers: {
                        'Authentication-Token': token,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch dashboard data.');
                }
                
                // Update the component's data with the live data from the API
                this.stats = data.stats;
                this.pendingRestaurants = data.pendingRestaurants;

            } catch (err) {
                this.error = err.message;
                console.error(err);
            } finally {
                this.loading = false;
            }
        },
        async approveRestaurant(restaurantId) {
            if (!confirm('Are you sure you want to approve this restaurant?')) {
                return;
            }
            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/admin/restaurants/${restaurantId}/verify`, {
                    method: 'PATCH',
                    headers: {
                        'Authentication-Token': token,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to approve restaurant.');
                }

                alert(data.message);
                
                // Refresh the dashboard data to remove the approved restaurant from the list
                this.fetchDashboardData();

            } catch (err) {
                alert('Error: ' + err.message);
                console.error(err);
            }
        }
    }
};

export default AdminDashboardPage;
