const AdminRestaurantManagementPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Restaurant Management</h2>

            <div v-if="loading" class="alert alert-info">Loading restaurant data...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div class="card" v-if="!loading && !error">
                <div class="card-header bg-white">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <input type="text" v-model="searchQuery" class="form-control" placeholder="Search by name, owner, or city...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-control" v-model="filterStatus">
                                <option value="All">All Statuses</option>
                                <option value="Verified">Verified</option>
                                <option value="Pending">Pending</option>
                                <option value="Blocked">Blocked</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Restaurant Name</th>
                                    <th>Owner</th>
                                    <th>City</th>
                                    <th>Status</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="filteredRestaurants.length === 0">
                                    <td colspan="6" class="text-center text-muted">No restaurants match the current criteria.</td>
                                </tr>
                                <tr v-for="restaurant in filteredRestaurants" :key="restaurant.id">
                                    <td>{{ restaurant.id }}</td>
                                    <td><strong>{{ restaurant.name }}</strong></td>
                                    <td>{{ restaurant.ownerEmail }}</td>
                                    <td>{{ restaurant.city }}</td>
                                    <td>
                                        <span class="badge" :class="statusBadgeClass(restaurant.status)">
                                            {{ restaurant.status }}
                                        </span>
                                    </td>
                                    <td class="table-actions text-right">
                                        <button v-if="restaurant.status === 'Pending'" class="btn btn-sm btn-success mr-2" @click="approveRestaurant(restaurant)">Approve</button>
                                        <button v-if="restaurant.status === 'Verified'" class="btn btn-sm btn-warning mr-2" @click="blockRestaurant(restaurant)">Block</button>
                                        <button v-if="restaurant.status === 'Blocked'" class="btn btn-sm btn-info mr-2" @click="unblockRestaurant(restaurant)">Unblock</button>
                                        <button class="btn btn-sm btn-danger" @click="deleteRestaurant(restaurant)">Delete</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            error: null,
            searchQuery: '',
            filterStatus: 'All',
            restaurants: [] // This will be populated from the API
        };
    },
    computed: {
        filteredRestaurants() {
            let result = this.restaurants;

            if (this.filterStatus !== 'All') {
                result = result.filter(r => r.status === this.filterStatus);
            }

            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                result = result.filter(r =>
                    r.name.toLowerCase().includes(query) ||
                    r.city.toLowerCase().includes(query) ||
                    r.ownerEmail.toLowerCase().includes(query)
                );
            }

            return result;
        }
    },
    mounted() {
        this.fetchRestaurants();
    },
    methods: {
        async fetchRestaurants() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/admin/restaurants', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch restaurants.");
                this.restaurants = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        statusBadgeClass(status) {
            const statusMap = {
                'Verified': 'badge-success',
                'Pending': 'badge-warning',
                'Blocked': 'badge-secondary'
            };
            return statusMap[status] || 'badge-light';
        },
        async handleAction(url, method, confirmMessage) {
            if (confirmMessage && !confirm(confirmMessage)) return;
            
            try {
                const token = this.$store.state.token;
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                alert(data.message);
                this.fetchRestaurants(); // Refresh the list after any action
            } catch (err) {
                alert('Error: ' + err.message);
            }
        },
        approveRestaurant(restaurant) {
            this.handleAction(
                `/api/admin/restaurants/${restaurant.id}/verify`, 'PATCH',
                `Are you sure you want to approve ${restaurant.name}?`
            );
        },
        blockRestaurant(restaurant) {
            this.handleAction(
                `/api/admin/restaurants/${restaurant.id}/block`, 'PATCH',
                `Are you sure you want to block ${restaurant.name}? The owner will not be able to log in.`
            );
        },
        unblockRestaurant(restaurant) {
            this.handleAction(
                `/api/admin/restaurants/${restaurant.id}/unblock`, 'PATCH',
                `Are you sure you want to unblock ${restaurant.name}?`
            );
        },
        deleteRestaurant(restaurant) {
            this.handleAction(
                `/api/admin/restaurants/${restaurant.id}`, 'DELETE',
                `This will PERMANENTLY delete ${restaurant.name} and all its data. Are you sure?`
            );
        }
    }
};

export default AdminRestaurantManagementPage;

