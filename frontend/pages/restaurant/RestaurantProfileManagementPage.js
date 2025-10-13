const RestaurantProfileManagementPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Restaurant Profile Management</h2>

            <div v-if="loading" class="alert alert-info">Loading your profile...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="card profile-management-card">
                <div class="card-body">
                    <form @submit.prevent="updateProfile">
                        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
                        
                        <div class="form-group d-flex justify-content-between align-items-center">
                            <div>
                                <h5>Accepting Orders</h5>
                                <p class="text-muted mb-0">Turn this off to temporarily stop receiving new orders.</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" v-model="restaurant.isActive">
                                <span class="slider round"></span>
                            </label>
                        </div>

                        <hr class="my-4">

                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="restaurantName">Restaurant Name</label>
                                <input type="text" class="form-control" id="restaurantName" v-model="restaurant.name">
                            </div>
                            <div class="form-group col-md-6">
                                <label for="openingHours">Opening Hours</label>
                                <input type="text" class="form-control" id="openingHours" v-model="restaurant.openingHours" placeholder="e.g., 9:00 AM - 10:00 PM">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="address">Address</label>
                            <input type="text" class="form-control" id="address" v-model="restaurant.address">
                        </div>
                         <div class="form-group">
                            <label for="city">City</label>
                            <input type="text" class="form-control" id="city" v-model="restaurant.city">
                        </div>
                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea class="form-control" id="description" v-model="restaurant.description" rows="4" placeholder="A brief description of your restaurant..."></textarea>
                        </div>
                        
                        <hr class="my-4">

                        <h5>Photo Gallery (Static Demo)</h5>
                        <div class="row gallery-thumbnails mt-3">
                            <div v-for="(image, index) in restaurant.gallery" :key="index" class="col-md-3 mb-3">
                                <img :src="image" class="img-fluid rounded">
                            </div>
                        </div>
                        <button type="button" class="btn btn-outline-secondary" disabled>Upload New Photo (Soon)</button>

                        <button type="submit" class="btn btn-brand float-right" :disabled="isSaving">
                            {{ isSaving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            isSaving: false,
            error: null,
            successMessage: null,
            restaurant: {
                isActive: true,
                name: '',
                openingHours: '',
                address: '',
                city: '',
                description: '',
                gallery: []
            }
        };
    },
    mounted() {
        this.fetchProfile();
    },
    methods: {
        async fetchProfile() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/restaurant/profile', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to load profile.");
                this.restaurant = data;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        async updateProfile() {
            this.isSaving = true;
            this.successMessage = null;
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/restaurant/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify(this.restaurant)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                this.successMessage = data.message;
            } catch (err) {
                this.error = "Error: " + err.message;
            } finally {
                this.isSaving = false;
            }
        }
    }
};

export default RestaurantProfileManagementPage;
