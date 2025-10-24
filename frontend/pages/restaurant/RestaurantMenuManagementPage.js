// NOTE: No imports needed. Assumes $, XLSX, apiService, and Vuex store are global.

const RestaurantMenuManagementPage = {
    template: `
        <div class="admin-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="admin-page-title">Menu Management</h2>
                <button class="btn btn-brand" @click="openAddItemModal">
                    <i class="fas fa-plus mr-2"></i> Add Single Item
                </button>
            </div>

            <div v-if="loading" class="alert alert-info">Loading your menu...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error">
                <!-- BULK UPLOAD SECTION -->
                <div class="card mb-4">
                    <div class="card-body">
                        <h4 class="card-title">Bulk Upload Menu</h4>
                        <p class="text-muted">Save time by uploading all your categories and menu items at once using our Excel template.</p>
                        <div v-if="uploadError" class="alert alert-danger">{{ uploadError }}</div>
                        <div v-if="uploadSuccess" class="alert alert-success">{{ uploadSuccess }}</div>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-outline-secondary mr-3" @click="downloadTemplate">
                                <i class="fas fa-download mr-2"></i>Download Template
                            </button>
                            <div class="custom-file">
                                <input type="file" class="custom-file-input" id="menuFile" @change="handleFileSelect" accept=".xlsx">
                                <label class="custom-file-label" for="menuFile">{{ selectedFile ? selectedFile.name : 'Choose Excel file...' }}</label>
                            </div>
                            <button class="btn btn-brand ml-3" @click="handleFileUpload" :disabled="!selectedFile || isUploading">
                                <span v-if="isUploading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                {{ isUploading ? 'Uploading...' : 'Upload' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- CATEGORY AND MENU DISPLAY -->
                <div v-if="categories.length === 0" class="card card-body text-center">
                    <p class="text-muted">Your menu is empty. Add a category and item manually, or use the bulk upload feature.</p>
                </div>
                
                <div v-for="category in categories" :key="category.id" class="card mb-4">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center">
                        <h4 class="mb-0">{{ category.name }}</h4>
                        <!-- Add Category Edit/Delete buttons here if needed -->
                    </div>
                    <div class="card-body">
                        <div v-if="category.menu_items.length === 0" class="text-center text-muted p-3">This category is empty.</div>
                        <div v-else class="table-responsive">
                            <table class="table table-hover mb-0 align-middle">
                                <tbody>
                                    <tr v-for="item in category.menu_items" :key="item.id">
                                        <td width="10%">
                                            <img :src="item.image || 'https://placehold.co/100x100/FFFBF8/FF7043?text=No+Image'" 
                                                 class="menu-item-img rounded" 
                                                 :alt="item.name">
                                        </td>
                                        <td>
                                            <strong>{{ item.name }}</strong>
                                            <p class="text-muted small mb-0">{{ item.description }}</p>
                                        </td>
                                        <td class="text-center" width="10%">₹{{ item.price.toLocaleString('en-IN') }}</td>
                                        <td class="text-center" width="15%">
                                            <button class="btn btn-sm" :class="item.is_available ? 'btn-success' : 'btn-secondary'" @click="toggleAvailability(item)">
                                                {{ item.is_available ? 'Available' : 'Unavailable' }}
                                            </button>
                                        </td>
                                        <td class="text-right" width="15%">
                                            <button class="btn btn-sm btn-outline-secondary mr-2" @click="openEditItemModal(item, category.id)">Edit</button>
                                            <button class="btn btn-sm btn-outline-danger" @click="deleteItem(item.id)">Delete</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL FOR ADD/EDIT MENU ITEM -->
            <div class="modal fade" id="menuItemModal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ isEditMode ? 'Edit' : 'Add' }} Menu Item</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="saveMenuItem">
                                <div class="form-group"><label>Item Name</label><input type="text" class="form-control" v-model="currentItem.name" required></div>
                                <div class="form-group"><label>Description</label><textarea class="form-control" v-model="currentItem.description" rows="3"></textarea></div>
                                <div class="form-row">
                                    <div class="form-group col-md-6"><label>Price</label><input type="number" step="0.01" class="form-control" v-model.number="currentItem.price" required></div>
                                    <div class="form-group col-md-6"><label>Category</label><select class="form-control" v-model="currentItem.category_id" required><option :value="null">Select a category...</option><option v-for="cat in categories" :value="cat.id">{{ cat.name }}</option></select></div>
                                </div>
                                <div class="form-group"><label>Item Image</label><div class="custom-file"><input type="file" class="custom-file-input" id="itemImage" @change="handleImageSelect" accept="image/jpeg, image/png, image/webp"><label class="custom-file-label" for="itemImage">{{ imageFile ? imageFile.name : 'Choose image...' }}</label></div></div>
                                <div v-if="imagePreview" class="text-center mt-2"><img :src="imagePreview" class="img-fluid rounded mb-2" style="max-height: 200px;"/><button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage"><i class="fas fa-times mr-1"></i> Remove</button></div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-brand" @click="saveMenuItem" :disabled="isSaving"><span v-if="isSaving" class="spinner-border spinner-border-sm"></span> {{ isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Item') }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return { 
            loading: true, error: null, categories: [], isEditMode: false, currentItem: {},
            isUploading: false, uploadError: null, uploadSuccess: null, selectedFile: null,
            isSaving: false, imageFile: null, imagePreview: null
        };
    },
    methods: {
        async fetchMenu() {
            this.loading = true; this.error = null;
            try {
                // ✅ UPDATED: Use apiService.get
                this.categories = await apiService.get('/api/restaurant/menu');
            } catch (err) {
                this.error = err.message;
                console.error("Error fetching menu:", err);
            } finally {
                this.loading = false;
            }
        },
        openAddItemModal() {
            this.isEditMode = false;
            this.currentItem = { id: null, name: '', description: '', price: 0, category_id: this.categories[0]?.id || null, image: '', is_available: true };
            this.imageFile = null; this.imagePreview = null;
            $('#menuItemModal').modal('show');
        },
        openEditItemModal(item, categoryId) {
            this.isEditMode = true;
            // Create a deep copy to avoid mutating state directly
            this.currentItem = JSON.parse(JSON.stringify({ ...item, category_id: categoryId }));
            this.imageFile = null; 
            this.imagePreview = item.image; // Set preview to existing image
            $('#menuItemModal').modal('show');
        },
        handleImageSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            this.imageFile = file;
            this.imagePreview = URL.createObjectURL(file);
        },
        removeImage() {
            this.imageFile = null; 
            this.imagePreview = null; // Clear preview
            this.currentItem.image = null; // Mark image for removal
        },
        async saveMenuItem() {
            this.isSaving = true;
            try {
                // Step 1: Upload image if a new one is selected
                if (this.imageFile) {
                    const formData = new FormData();
                    formData.append('image_file', this.imageFile);
                    // ✅ UPDATED: Use apiService.post for image upload
                    const uploadData = await apiService.post('/api/upload/image', formData);
                    this.currentItem.image = uploadData.url;
                }

                let saveData;
                // Step 2: Save the menu item (create or update)
                if (this.isEditMode) {
                    // ✅ UPDATED: Use apiService.put
                    saveData = await apiService.put(`/api/restaurant/menu-items/${this.currentItem.id}`, this.currentItem);
                } else {
                    // ✅ UPDATED: Use apiService.post
                    saveData = await apiService.post('/api/restaurant/menu-items', this.currentItem);
                }
                
                alert(saveData.message || "Item saved successfully!");
                $('#menuItemModal').modal('hide');
                this.fetchMenu(); // Refresh menu list

            } catch (err) { 
                alert('Error: ' + err.message); 
                console.error("Error saving menu item:", err);
            } finally {
                this.isSaving = false;
            }
        },
        async deleteItem(itemId) {
            if (!confirm('Are you sure you want to delete this item?')) return;
            try {
                // ✅ UPDATED: Use apiService.delete
                const data = await apiService.delete(`/api/restaurant/menu-items/${itemId}`);
                alert(data.message || "Item deleted.");
                this.fetchMenu(); // Refresh menu list
            } catch (err) { 
                alert('Error: ' + err.message); 
                console.error("Error deleting item:", err);
            }
        },
        async toggleAvailability(item) {
            try {
                // ✅ UPDATED: Use apiService.patch
                await apiService.patch(`/api/restaurant/menu-items/${item.id}/availability`, { is_available: !item.is_available });
                item.is_available = !item.is_available; // Update UI immediately
            } catch (err) { 
                alert('Error: ' + err.message); 
                console.error("Error toggling availability:", err);
                // Revert UI change on failure if needed
            }
        },
        downloadTemplate() {
            // This method is client-side and doesn't need apiService
            const worksheet_data = [
                ["Category", "Name", "Description", "Price"],
                ["Starters", "Paneer Tikka", "Grilled cottage cheese cubes", 250],
                ["Main Course", "Butter Chicken", "Creamy tomato-based chicken curry", 450],
            ];
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Template");
            XLSX.writeFile(workbook, "menu_template.xlsx");
        },
        handleFileSelect(event) {
            this.uploadSuccess = null; this.uploadError = null;
            this.selectedFile = event.target.files[0];
            // Update file label
             const label = document.querySelector('.custom-file-label[for="menuFile"]');
             if (label) {
                 label.textContent = this.selectedFile ? this.selectedFile.name : 'Choose Excel file...';
             }
        },
        async handleFileUpload() {
            if (!this.selectedFile) { this.uploadError = "Please select a file first."; return; }
            this.isUploading = true; this.uploadError = null; this.uploadSuccess = null;
            const formData = new FormData();
            formData.append('menu_file', this.selectedFile);
            try {
                // ✅ UPDATED: Use apiService.post
                const data = await apiService.post('/api/restaurant/menu/bulk-upload', formData);
                this.uploadSuccess = data.message;
                this.selectedFile = null; 
                document.getElementById('menuFile').value = null;
                // Reset file label
                const label = document.querySelector('.custom-file-label[for="menuFile"]');
                if (label) {
                    label.textContent = 'Choose Excel file...';
                }
                await this.fetchMenu(); // Refresh menu
            } catch (err) {
                this.uploadError = "Upload failed: " + err.message;
                console.error("Error with bulk upload:", err);
            } finally {
                this.isUploading = false;
            }
        }
    },
    mounted() {
        this.fetchMenu();
    }
};
// NOTE: No export default needed

