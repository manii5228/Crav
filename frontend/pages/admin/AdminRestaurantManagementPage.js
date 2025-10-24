// NOTE: No imports needed. Assumes $, apiService, and Vuex store are global.

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
                            <input type="text" v-model="searchQuery" @input="debouncedFetchRestaurants" class="form-control" placeholder="Search by name, owner, or city...">
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
                                    <th>ID</th><th>Restaurant Name</th><th>Owner</th><th>City</th><th>Status</th>
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

            <!-- Modal for Add/Edit Restaurant -->
            <div class="modal fade" id="restaurantModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
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
                id: null, name: '', ownerEmail: '', address: '', city: '',
                latitude: null, longitude: null
            },
            isExporting: false,
            isGeocoding: false,
            modalError: null,
            debounceTimer: null,
        };
    },
    methods: {
        debouncedFetchRestaurants() {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.fetchRestaurants();
            }, 500);
        },
        async fetchRestaurants() {
            this.error = null;
            // Only set loading on initial load
            if (this.restaurants.length === 0) {
                 this.loading = true;
            }
            try {
                const params = new URLSearchParams();
                if (this.searchQuery) params.append('search', this.searchQuery);
                if (this.filterStatus && this.filterStatus !== 'All') params.append('status', this.filterStatus);

                // Use apiService.get
                this.restaurants = await apiService.get(`/api/admin/restaurants?${params.toString()}`);
            } catch (err) {
                this.error = err.message;
                 console.error("Error fetching restaurants:", err);
            } finally {
                this.loading = false;
            }
        },
        statusBadgeClass(status) {
            const statusMap = { 'Verified': 'badge-success', 'Pending': 'badge-warning', 'Blocked': 'badge-secondary' };
            return statusMap[status] || 'badge-light';
        },
        // Centralized action handler using apiService
        async handleAction(method, endpoint, confirmMessage, successMessage) {
            if (confirmMessage && !confirm(confirmMessage)) return;
            try {
                 let data;
                 // Pass empty body for PATCH/DELETE if backend doesn't expect one
                 if (method === 'patch' || method === 'delete') {
                     data = await apiService[method](endpoint, {}); // Use lowercase method name
                 } else {
                      // Handle other methods if needed (e.g., PUT with body)
                      throw new Error(`Unsupported method ${method} in handleAction`);
                 }
                 alert(data ? data.message : successMessage); // Use provided success message if data is null/empty
                this.fetchRestaurants(); // Refresh list
            } catch (err) {
                 console.error(`Error performing action ${method} ${endpoint}:`, err);
                alert('Error: ' + err.message);
            }
        },
        approveRestaurant(restaurant) {
            this.handleAction('patch', `/api/admin/restaurants/${restaurant.id}/verify`, `Approve ${restaurant.name}?`, 'Restaurant approved.');
        },
        blockRestaurant(restaurant) {
            this.handleAction('patch', `/api/admin/restaurants/${restaurant.id}/block`, `Block ${restaurant.name}?`, 'Restaurant blocked.');
        },
        unblockRestaurant(restaurant) {
            this.handleAction('patch', `/api/admin/restaurants/${restaurant.id}/unblock`, `Unblock ${restaurant.name}?`, 'Restaurant unblocked.');
        },
        deleteRestaurant(restaurant) {
            this.handleAction('delete', `/api/admin/restaurants/${restaurant.id}`, `PERMANENTLY delete ${restaurant.name}?`, 'Restaurant deleted.');
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
            // Ensure all expected fields are present, even if null
            this.currentRestaurant = {
                 id: restaurant.id,
                 name: restaurant.name || '',
                 ownerEmail: restaurant.ownerEmail || '',
                 address: restaurant.address || '',
                 city: restaurant.city || '',
                 latitude: restaurant.latitude !== undefined ? restaurant.latitude : null,
                 longitude: restaurant.longitude !== undefined ? restaurant.longitude : null,
            };
            $('#restaurantModal').modal('show');
        },
        async saveRestaurant() {
             // Basic validation
             if (!this.currentRestaurant.name || !this.currentRestaurant.ownerEmail || !this.currentRestaurant.address || !this.currentRestaurant.city) {
                  this.modalError = "Please fill in all required fields (Name, Owner Email, Address, City).";
                  return;
             }
             this.modalError = null; // Clear previous error
            try {
                let data;
                if (this.isEditMode) {
                    // Use apiService.put
                    data = await apiService.put(`/api/admin/restaurants/${this.currentRestaurant.id}`, this.currentRestaurant);
                } else {
                    // Use apiService.post
                    data = await apiService.post('/api/admin/restaurants', this.currentRestaurant);
                }
                 alert(data.message);
                $('#restaurantModal').modal('hide');
                this.fetchRestaurants();
            } catch (err) {
                 console.error("Error saving restaurant:", err);
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
                // Use apiService.post for consistency
                const data = await apiService.post(`/api/geocode`, { address: fullAddress });

                this.currentRestaurant.latitude = data.latitude;
                this.currentRestaurant.longitude = data.longitude;
            } catch (err) {
                 console.error("Error geocoding:", err);
                this.modalError = err.message;
            } finally {
                this.isGeocoding = false;
            }
        },
        async exportData() {
            this.isExporting = true;
            try {
                 // Use apiService.download
                 const blob = await apiService.download('/api/admin/restaurants/export');
                 if (!blob) throw new Error("Received empty export file.");

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
                 console.error('Error exporting restaurant data:', err);
                alert('Error exporting data: ' + err.message);
            } finally {
                this.isExporting = false;
            }
        }
    },
    mounted() {
        this.fetchRestaurants();
    },
     beforeDestroy() {
         clearTimeout(this.debounceTimer);
     }
};
// NOTE: No export default needed

