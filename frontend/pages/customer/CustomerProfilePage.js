// NOTE: No imports needed. Assumes apiService and Vuex store are global.

const CustomerProfilePage = {
    template: `
        <div class="container my-5">
            <h2 class="text-center mb-5">Your <span class="text-brand">Profile</span></h2>

            <!-- Error/Loading states -->
            <div v-if="loading" class="text-center">Loading profile...</div>
            <div v-if="error" class="alert alert-danger mx-auto" style="max-width: 500px;">{{ error }}</div>

            <div class="card profile-card mx-auto" v-if="!loading && !error">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h4 class="mt-3">{{ user.name }}</h4>
                    </div>

                    <form @submit.prevent="updateProfile">
                        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

                        <div class="form-group">
                            <label for="profileName">Full Name</label>
                            <input type="text" class="form-control" id="profileName" v-model="user.name">
                        </div>
                        <div class="form-group">
                            <label for="profileEmail">Email Address</label>
                            <input type="email" class="form-control" id="profileEmail" v-model="user.email" disabled>
                            <small class="form-text text-muted">Email address cannot be changed.</small>
                        </div>
                        
                        <button type="submit" class="btn btn-brand btn-block mt-4" :disabled="isSaving">
                            {{ isSaving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: false, // Not really needed as we load from store, but good for future expansion
            isSaving: false,
            error: null,
            successMessage: null,
            // Initialize user as an object to prevent template errors
            user: {
                name: '',
                email: '',
            },
        };
    },
    computed: {
        // Get the initial user data from the Vuex store
        currentUser() {
            return this.$store.getters.currentUser;
        }
    },
    methods: {
        async updateProfile() {
            this.successMessage = null;
            this.error = null;
            this.isSaving = true;
            
            try {
                // ✅ UPDATED: Use apiService.put
                const data = await apiService.put('/api/profile', { name: this.user.name });

                // --- IMPORTANT ---
                // Commit the updated user object to the Vuex store
                // so the Navbar and other components update immediately.
                this.$store.commit('SET_USER', data.user);

                this.successMessage = data.message;

            } catch (err) {
                this.error = err.message;
                console.error("Error updating profile:", err);
            } finally {
                this.isSaving = false;
            }
        },
        loadUserFromStore() {
             // Load data from the Vuex store when the component is created
            if (this.currentUser) {
                this.user.name = this.currentUser.name;
                this.user.email = this.currentUser.email;
            } else {
                // This is a safeguard
                this.error = "Could not load user data. Please log in again.";
                console.error("CustomerProfilePage: currentUser is null in created() hook");
            }
        }
    },
    created() {
       this.loadUserFromStore();
    },
    watch: {
        // Watch for changes in the store's user (e.g., after login)
        currentUser(newUser) {
            if (newUser) {
                this.user.name = newUser.name;
                this.user.email = newUser.email;
                this.error = null; // Clear error if user data loads
            }
        }
    }
};
// NOTE: No export default needed

