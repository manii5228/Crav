// NOTE: No imports needed. Assumes $, apiService, and Vuex store are global.

const AdminCouponManagementPage = {
    template: `
        <div class="admin-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="admin-page-title">Platform Coupon Management</h2>
                <button class="btn btn-brand" @click="openAddModal">Add New Coupon</button>
            </div>

            <div v-if="loading" class="alert alert-info">Loading coupons...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Code</th><th>Type</th><th>Value</th><th>Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="coupons.length === 0"><td colspan="5" class="text-center text-muted">No platform-wide coupons found.</td></tr>
                                <tr v-for="coupon in coupons" :key="coupon.id">
                                    <td><strong>{{ coupon.code }}</strong></td>
                                    <td>{{ coupon.type }}</td>
                                    <td>{{ coupon.type === 'Percentage' ? coupon.value + '%' : '₹' + coupon.value.toFixed(2) }}</td>
                                    <td>
                                        <span class="badge" :class="coupon.isActive ? 'badge-success' : 'badge-secondary'">
                                            {{ coupon.isActive ? 'Active' : 'Inactive' }}
                                        </span>
                                    </td>
                                    <td class="table-actions">
                                        <button class="btn btn-sm mr-2"
                                                :class="coupon.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                                                @click="toggleStatus(coupon)">
                                            {{ coupon.isActive ? 'Deactivate' : 'Activate' }}
                                        </button>
                                        <button class="btn btn-sm btn-outline-secondary mr-2" @click="openEditModal(coupon)">Edit</button>
                                        <button class="btn btn-sm btn-outline-danger" @click="deleteCoupon(coupon.id)">Delete</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Modal for Add/Edit Coupon -->
            <div class="modal fade" id="couponModal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ isEditMode ? 'Edit' : 'Add' }} Coupon</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="saveCoupon">
                                <div class="form-group"><label>Coupon Code</label><input type="text" class="form-control" v-model="currentCoupon.code" required></div>
                                <div class="form-group"><label>Discount Type</label><select class="form-control" v-model="currentCoupon.type" required><option>Percentage</option><option>Fixed</option></select></div>
                                <div class="form-group"><label>Discount Value</label><input type="number" step="0.01" class="form-control" v-model.number="currentCoupon.value" required></div>
                                <div class="form-check"><input type="checkbox" class="form-check-input" id="isActiveCheck" v-model="currentCoupon.isActive"><label class="form-check-label" for="isActiveCheck">Active</label></div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-brand" @click="saveCoupon">{{ isEditMode ? 'Save Changes' : 'Create Coupon' }}</button>
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
            coupons: [],
            isEditMode: false,
            // Ensure value is initialized appropriately (e.g., null or 0)
            currentCoupon: { id: null, code: '', type: 'Percentage', value: 0, isActive: true }
        };
    },
    methods: {
        async fetchCoupons() {
            this.loading = true;
            this.error = null;
            try {
                // Use apiService.get
                this.coupons = await apiService.get('/api/admin/coupons');
            } catch (err) {
                this.error = err.message;
                 console.error("Error fetching coupons:", err); // Log details
            } finally {
                this.loading = false;
            }
        },
        openAddModal() {
            this.isEditMode = false;
            // Ensure value is reset correctly
            this.currentCoupon = { id: null, code: '', type: 'Percentage', value: 0, isActive: true };
            $('#couponModal').modal('show');
        },
        openEditModal(coupon) {
            this.isEditMode = true;
            this.currentCoupon = JSON.parse(JSON.stringify(coupon)); // Deep copy
            $('#couponModal').modal('show');
        },
        async saveCoupon() {
            // Basic validation
             if (!this.currentCoupon.code || this.currentCoupon.value === null || this.currentCoupon.value < 0) {
                 alert('Please provide a valid code and non-negative value.');
                 return;
             }
            try {
                let data;
                if (this.isEditMode) {
                    // Use apiService.put
                    data = await apiService.put(`/api/admin/coupons/${this.currentCoupon.id}`, this.currentCoupon);
                } else {
                    // Use apiService.post
                    data = await apiService.post('/api/admin/coupons', this.currentCoupon);
                }
                // Check if data has a message, otherwise show generic success
                 alert(data ? data.message : (this.isEditMode ? 'Coupon updated successfully.' : 'Coupon created successfully.'));
                $('#couponModal').modal('hide');
                this.fetchCoupons(); // Refresh the list
            } catch (err) {
                 console.error("Error saving coupon:", err); // Log details
                alert('Error: ' + err.message);
            }
        },
        async deleteCoupon(couponId) {
            if (!confirm('Are you sure you want to delete this coupon?')) return;
            try {
                // Use apiService.delete
                const data = await apiService.delete(`/api/admin/coupons/${couponId}`);
                 alert(data ? data.message : 'Coupon deleted successfully.'); // Handle potentially empty response
                this.fetchCoupons(); // Refresh the list
            } catch (err) {
                 console.error("Error deleting coupon:", err); // Log details
                alert('Error: ' + err.message);
            }
        },
        async toggleStatus(coupon) {
            const action = coupon.isActive ? 'deactivate' : 'activate';
            if (!confirm(`Are you sure you want to ${action} the coupon '${coupon.code}'?`)) {
                return;
            }
            try {
                // Use apiService.patch - assumes backend expects PATCH for toggle
                // Send empty body if backend doesn't require one for toggle
                const data = await apiService.patch(`/api/admin/coupons/${coupon.id}/toggle`, {});
                 alert(data ? data.message : `Coupon ${action}d successfully.`); // Handle potentially empty response
                this.fetchCoupons(); // Refresh the list
            } catch (err) {
                 console.error(`Error ${action}ing coupon:`, err); // Log details
                alert('Error: ' + err.message);
            }
        }
    },
    mounted() {
        this.fetchCoupons();
    }
};
// NOTE: No export default needed

