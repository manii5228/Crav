// NOTE: No imports needed. Assumes $, apiService, and Vuex store are global.

const AdminUserManagementPage = {
    template: `
        <div class="admin-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="admin-page-title">User Management</h2>
                <button class="btn btn-outline-secondary" @click="exportData" :disabled="isExporting">
                    <span v-if="isExporting" class="spinner-border spinner-border-sm"></span>
                    {{ isExporting ? 'Exporting...' : 'Export to Excel' }}
                </button>
            </div>

            <div v-if="loading" class="alert alert-info">Loading user data...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div class="card" v-if="!loading && !error">
                <div class="card-header bg-white">
                     <div class="row align-items-center">
                         <div class="col-md-4">
                            <input type="text" v-model="searchQuery" @input="debouncedFetchUsers" class="form-control" placeholder="Search by name or email...">
                         </div>
                     </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th>ID</th><th>Name</th><th>Email</th>
                                    <th class="text-center">Total Orders</th><th>Total Spent</th>
                                    <th class="text-center">Status</th><th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="users.length === 0">
                                    <td colspan="7" class="text-center text-muted">No users found.</td>
                                </tr>
                                <tr v-for="user in users" :key="user.id">
                                    <td>{{ user.id }}</td>
                                    <td><strong>{{ user.name }}</strong></td>
                                    <td>{{ user.email }}</td>
                                    <td class="text-center">{{ user.totalOrders }}</td>
                                    <td>₹{{ user.totalSpent.toLocaleString('en-IN') }}</td>
                                    <td class="text-center">
                                        <span class="badge" :class="user.isBlocked ? 'badge-secondary' : 'badge-success'">
                                            {{ user.isBlocked ? 'Blocked' : 'Active' }}
                                        </span>
                                    </td>
                                    <td class="text-right">
                                        <button v-if="!user.isBlocked" class="btn btn-sm btn-warning" @click="blockUser(user)">Block</button>
                                        <button v-if="user.isBlocked" class="btn btn-sm btn-info" @click="unblockUser(user)">Unblock</button>
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
            users: [],
            isExporting: false,
             debounceTimer: null,
        };
    },
    methods: {
         debouncedFetchUsers() {
             clearTimeout(this.debounceTimer);
             this.debounceTimer = setTimeout(() => {
                 this.fetchUsers();
             }, 500); // 500ms delay
         },
        async fetchUsers() {
            this.error = null;
             // Only show main loading indicator on initial load
             if (this.users.length === 0) {
                 this.loading = true;
             }
            try {
                const params = new URLSearchParams();
                if (this.searchQuery) params.append('search', this.searchQuery);
                // Use apiService.get
                this.users = await apiService.get(`/api/admin/users?${params.toString()}`);
            } catch (err) {
                this.error = err.message;
                 console.error("Error fetching users:", err);
            } finally {
                this.loading = false;
            }
        },
        async blockUser(user) {
            if (!confirm(`Block ${user.name}? They will not be able to log in.`)) return;
            try {
                // Use apiService.patch
                const data = await apiService.patch(`/api/admin/users/${user.id}/block`);
                alert(data.message);
                this.fetchUsers(); // Refresh list
            } catch (err) {
                 console.error("Error blocking user:", err);
                 alert('Error: ' + err.message);
            }
        },
        async unblockUser(user) {
            if (!confirm(`Unblock ${user.name}?`)) return;
            try {
                // Use apiService.patch
                const data = await apiService.patch(`/api/admin/users/${user.id}/unblock`);
                alert(data.message);
                this.fetchUsers(); // Refresh list
            } catch (err) {
                 console.error("Error unblocking user:", err);
                 alert('Error: ' + err.message);
            }
        },
        async exportData() {
            this.isExporting = true;
            try {
                 // Use apiService.download
                 const blob = await apiService.download('/api/admin/users/export');
                 if (!blob) throw new Error("Received empty export file.");

                // Create a link and click it to trigger download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'users_export.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (err) {
                 console.error("Error exporting user data:", err);
                alert('Error exporting data: ' + err.message);
            } finally {
                this.isExporting = false;
            }
        }
    },
    mounted() {
        this.fetchUsers();
    },
     beforeDestroy() {
         // Clear the timer when the component is destroyed
         clearTimeout(this.debounceTimer);
     }
};
// NOTE: No export default needed

