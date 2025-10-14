const AdminRestaurantManagementPage = {
    template: `
        <div class="admin-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="admin-page-title">Restaurant Management</h2>
                <div>
                    <button class="btn btn-outline-secondary mr-2" @click="exportData" :disabled="isExporting">
                        <span v-if="isExporting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        {{ isExporting ? 'Exporting...' : 'Export to Excel' }}
                    </button>
                    <button class="btn btn-brand" @click="openAddModal">Add Restaurant</button>
                </div>
            </div>

            <div v-if="loading" class="alert alert-info">Loading restaurant data...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div class="card" v-if="!loading && !error">
                <div class="card-header bg-white">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <input type="text" v-model="searchQuery" @input="fetchRestaurants" class="form-control" placeholder="Search by name, owner, or city...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-control" v-model="filterStatus" @change="fetchRestaurants">
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
                                <tr v-if="restaurants.length === 0">
                                    <td colspan="6" class="text-center text-muted">No restaurants match the current criteria.</td>
                                </tr>
                                <tr v-for="restaurant in restaurants" :key="restaurant.id">
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
                                        <button class="btn btn-sm btn-outline-secondary mr-2" @click="openEditModal(restaurant)">Edit</button>
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

            <!-- ✅ MODIFIED: Modal for Add/Edit Restaurant -->
            <div class="modal fade" id="restaurantModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document"> <!-- Made modal larger -->
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ isEditMode ? 'Edit' : 'Add' }} Restaurant</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="saveRestaurant">
                                <div v-if="modalError" class="alert alert-danger">{{ modalError }}</div>
                                <div class="form-group">
                                    <label>Restaurant Name</label>
                                    <input type="text" class="form-control" v-model="currentRestaurant.name" required>
                                </div>
                                <div class="form-group">
                                    <label>Owner's Email</label>
                                    <input type="email" class="form-control" v-model="currentRestaurant.ownerEmail" required>
                                    <small class="form-text text-muted">The user must already exist with the 'owner' role.</small>
                                </div>
                                <hr>
                                <h6 class="form-section-title">Restaurant Location</h6>
                                <div class="form-group">
                                    <label>Address</label>
                                    <input type="text" class="form-control" v-model="currentRestaurant.address" required>
                                </div>
                                <div class="form-group">
                                    <label>City</label>
                                    <input type="text" class="form-control" v-model="currentRestaurant.city" required>
                                </div>
                                
                                <div class="form-group">
                                    <button type="button" class="btn btn-sm btn-outline-secondary" @click="geocodeAddress" :disabled="isGeocoding">
                                        <span v-if="isGeocoding" class="spinner-border spinner-border-sm"></span>
                                        {{ isGeocoding ? 'Finding...' : 'Find on Map' }}
                                    </button>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label>Latitude</label>
                                        <input type="number" step="any" class="form-control" v-model.number="currentRestaurant.latitude" placeholder="e.g., 40.7128">
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label>Longitude</label>
                                        <input type="number" step="any" class="form-control" v-model.number="currentRestaurant.longitude" placeholder="e.g., -74.0060">
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-brand" @click="saveRestaurant">{{ isEditMode ? 'Save Changes' : 'Create Restaurant' }}</button>
                        </div>
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
            restaurants: [],
            isEditMode: false,
            currentRestaurant: {
                id: null,
                name: '',
                ownerEmail: '',
                address: '',
                city: '',
                latitude: null,
                longitude: null
            },
            isExporting: false,
            isGeocoding: false, // For the modal's geocoding button
            modalError: null, // For errors inside the modal
        };
    },
    mounted() {
        this.fetchRestaurants();
    },
    methods: {
        async fetchRestaurants() {
            this.error = null;
            try {
                const token = this.$store.state.token;
                const url = new URL('/api/admin/restaurants', window.location.origin);
                if (this.searchQuery) url.searchParams.append('search', this.searchQuery);
                if (this.filterStatus) url.searchParams.append('status', this.filterStatus);

                const response = await fetch(url, { headers: { 'Authentication-Token': token } });
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
            const statusMap = { 'Verified': 'badge-success', 'Pending': 'badge-warning', 'Blocked': 'badge-secondary' };
            return statusMap[status] || 'badge-light';
        },
        async handleAction(url, method, confirmMessage) {
            if (confirmMessage && !confirm(confirmMessage)) return;
            try {
                const token = this.$store.state.token;
                const response = await fetch(url, { method, headers: { 'Authentication-Token': token } });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                alert(data.message);
                this.fetchRestaurants();
            } catch (err) {
                alert('Error: ' + err.message);
            }
        },
        approveRestaurant(restaurant) {
            this.handleAction(`/api/admin/restaurants/${restaurant.id}/verify`, 'PATCH', `Are you sure you want to approve ${restaurant.name}?`);
        },
        blockRestaurant(restaurant) {
            this.handleAction(`/api/admin/restaurants/${restaurant.id}/block`, 'PATCH', `Are you sure you want to block ${restaurant.name}?`);
        },
        unblockRestaurant(restaurant) {
            this.handleAction(`/api/admin/restaurants/${restaurant.id}/unblock`, 'PATCH', `Are you sure you want to unblock ${restaurant.name}?`);
        },
        deleteRestaurant(restaurant) {
            this.handleAction(`/api/admin/restaurants/${restaurant.id}`, 'DELETE', `This will PERMANENTLY delete ${restaurant.name}. Are you sure?`);
        },
        openAddModal() {
            this.isEditMode = false;
            this.modalError = null;
            this.currentRestaurant = { id: null, name: '', ownerEmail: '', address: '', city: '', latitude: null, longitude: null };
            $('#restaurantModal').modal('show');
        },
        openEditModal(restaurant) {
            this.isEditMode = true;
            this.modalError = null;
            this.currentRestaurant = { ...restaurant }; // Use spread to copy all properties
            $('#restaurantModal').modal('show');
        },
        async saveRestaurant() {
            const token = this.$store.state.token;
            const url = this.isEditMode ? `/api/admin/restaurants/${this.currentRestaurant.id}` : '/api/admin/restaurants';
            const method = this.isEditMode ? 'PUT' : 'POST';
            try {
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json', 'Authentication-Token': token },
                    body: JSON.stringify(this.currentRestaurant)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                alert(data.message);
                $('#restaurantModal').modal('hide');
                this.fetchRestaurants();
            } catch (err) {
                this.modalError = 'Error: ' + err.message; // Show error inside the modal
            }
        },
        async geocodeAddress() {
            if (!this.currentRestaurant.address || !this.currentRestaurant.city) {
                this.modalError = "Please enter an address and city first.";
                return;
            }
            this.isGeocoding = true;
            this.modalError = null;
            try {
                const fullAddress = `${this.currentRestaurant.address}, ${this.currentRestaurant.city}`;
                const token = this.$store.state.token;
                const response = await fetch('/api/geocode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authentication-Token': token },
                    body: JSON.stringify({ address: fullAddress })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                this.currentRestaurant.latitude = data.latitude;
                this.currentRestaurant.longitude = data.longitude;
            } catch (err) {
                this.modalError = err.message;
            } finally {
                this.isGeocoding = false;
            }
        },
        async exportData() {
            this.isExporting = true;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/admin/restaurants/export', { headers: { 'Authentication-Token': token } });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to download file.');
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'restaurants_export.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (err) {
                alert('Error exporting data: ' + err.message);
            } finally {
                this.isExporting = false;
            }
        }
    }
};

export default AdminRestaurantManagementPage;

