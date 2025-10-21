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
                    <input type="text" v-model="searchQuery" @input="fetchUsers" class="form-control" placeholder="Search by name or email...">
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
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
            loading: true, error: null, searchQuery: '', users: [], isExporting: false,
        };
    },
    methods: {
        async fetchUsers() {
            this.error = null;
            try {
                const params = new URLSearchParams();
                if (this.searchQuery) params.append('search', this.searchQuery);
                this.users = await apiService.get(`/api/admin/users?${params.toString()}`);
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },
        async blockUser(user) {
            if (!confirm(`Block ${user.name}? They will not be able to log in.`)) return;
            try {
                const data = await apiService.patch(`/api/admin/users/${user.id}/block`);
                alert(data.message);
                this.fetchUsers();
            } catch (err) { alert('Error: ' + err.message); }
        },
        async unblockUser(user) {
            if (!confirm(`Unblock ${user.name}?`)) return;
            try {
                const data = await apiService.patch(`/api/admin/users/${user.id}/unblock`);
                alert(data.message);
                this.fetchUsers();
            } catch (err) { alert('Error: ' + err.message); }
        },
        async exportData() {
            this.isExporting = true;
            try {
                const token = this.$store.state.token;
                const response = await fetch(`${window.API_URL}/api/admin/users/export`, { headers: { 'Authentication-Token': token } });
                if (!response.ok) throw new Error('Failed to download file.');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'users_export.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                this.isExporting = false;
            }
        }
    },
    mounted() {
        this.fetchUsers();
    }
};
