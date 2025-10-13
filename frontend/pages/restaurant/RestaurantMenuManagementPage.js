const RestaurantMenuManagementPage = {
    template: `
        <div class="admin-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="admin-page-title">Menu Management</h2>
                <button class="btn btn-brand" @click="openAddModal">
                    <i class="fas fa-plus"></i> Add New Item
                </button>
            </div>

            <div v-if="loading" class="alert alert-info">Loading your menu...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error">
                <div v-if="categories.length === 0" class="card card-body text-center">
                    <p class="text-muted">Your menu is empty. You can add items once you have categories.</p>
                </div>

                <div v-for="category in categories" :key="category.id" class="card mb-4">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center">
                        <h4 class="mb-0">{{ category.name }}</h4>
                    </div>
                    <div class="card-body">
                        <div v-if="category.menu_items.length === 0" class="text-center text-muted p-3">This category is empty.</div>
                        <div v-else class="table-responsive">
                            <table class="table table-hover mb-0">
                                <tbody>
                                    <tr v-for="item in category.menu_items" :key="item.id">
                                        <td width="10%"><img :src="item.image" class="menu-item-img rounded" :alt="item.name"></td>
                                        <td>
                                            <strong>{{ item.name }}</strong>
                                            <p class="text-muted small mb-0">{{ item.description }}</p>
                                        </td>
                                        <td class="text-center" width="10%">\${{ item.price.toFixed(2) }}</td>
                                        <td class="text-center" width="15%">
                                            <button class="btn btn-sm" :class="item.is_available ? 'btn-success' : 'btn-secondary'" @click="toggleAvailability(item)">
                                                {{ item.is_available ? 'Available' : 'Unavailable' }}
                                            </button>
                                        </td>
                                        <td class="text-right" width="15%">
                                            <button class="btn btn-sm btn-outline-secondary mr-2" @click="openEditModal(item, category.id)">Edit</button>
                                            <button class="btn btn-sm btn-outline-danger" @click="deleteItem(item.id)">Delete</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal for Add/Edit Menu Item -->
            <div class="modal fade" id="menuItemModal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ isEditMode ? 'Edit' : 'Add' }} Menu Item</h5>
                            <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="saveMenuItem">
                                <div class="form-group"><label>Item Name</label><input type="text" class="form-control" v-model="currentItem.name" required></div>
                                <div class="form-group"><label>Description</label><textarea class="form-control" v-model="currentItem.description" rows="3"></textarea></div>
                                <div class="form-row">
                                    <div class="form-group col-md-6"><label>Price</label><input type="number" step="0.01" class="form-control" v-model.number="currentItem.price" required></div>
                                    <div class="form-group col-md-6"><label>Category</label><select class="form-control" v-model="currentItem.category_id" required><option v-for="cat in categories" :value="cat.id">{{ cat.name }}</option></select></div>
                                </div>
                                <div class="form-group"><label>Image URL</label><input type="text" class="form-control" v-model="currentItem.image" placeholder="https://example.com/image.png"></div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-brand" @click="saveMenuItem">{{ isEditMode ? 'Save Changes' : 'Add Item' }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return { loading: true, error: null, categories: [], isEditMode: false, currentItem: {} };
    },
    mounted() { this.fetchMenu(); },
    methods: {
        async fetchMenu() {
            this.loading = true; this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/restaurant/menu', { headers: { 'Authentication-Token': token } });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch menu.");
                this.categories = data;
            } catch (err) { this.error = err.message; } finally { this.loading = false; }
        },
        openAddModal() {
            this.isEditMode = false;
            this.currentItem = { id: null, name: '', description: '', price: 0, category_id: this.categories[0]?.id || null, image: '', is_available: true };
            $('#menuItemModal').modal('show');
        },
        openEditModal(item, categoryId) {
            this.isEditMode = true;
            this.currentItem = JSON.parse(JSON.stringify({ ...item, category_id: categoryId }));
            $('#menuItemModal').modal('show');
        },
        async saveMenuItem() {
            const token = this.$store.state.token;
            const url = this.isEditMode ? `/api/restaurant/menu-items/${this.currentItem.id}` : '/api/restaurant/menu-items';
            const method = this.isEditMode ? 'PUT' : 'POST';
            try {
                const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authentication-Token': token }, body: JSON.stringify(this.currentItem) });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                alert(data.message);
                $('#menuItemModal').modal('hide');
                this.fetchMenu();
            } catch (err) { alert('Error: ' + err.message); }
        },
        async deleteItem(itemId) {
            if (!confirm('Are you sure you want to delete this item?')) return;
            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/restaurant/menu-items/${itemId}`, { method: 'DELETE', headers: { 'Authentication-Token': token } });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                alert(data.message);
                this.fetchMenu();
            } catch (err) { alert('Error: ' + err.message); }
        },
        async toggleAvailability(item) {
            try {
                const token = this.$store.state.token;
                const response = await fetch(`/api/restaurant/menu-items/${item.id}/availability`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authentication-Token': token },
                    body: JSON.stringify({ is_available: !item.is_available })
                });
                if (!response.ok) throw new Error((await response.json()).message);
                item.is_available = !item.is_available;
            } catch (err) { alert('Error: ' + err.message); }
        }
    }
};

export default RestaurantMenuManagementPage;
