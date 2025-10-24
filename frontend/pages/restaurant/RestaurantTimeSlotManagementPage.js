// NOTE: No imports needed. Assumes $, apiService, and Vuex store are global.

const RestaurantTimeSlotManagementPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Time Slot Management</h2>
            <p class="text-muted">Define the days and time windows your restaurant is available for scheduled orders.</p>

            <div v-if="loading" class="alert alert-info">Loading time slots...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="row">
                <!-- Add New Slot Form -->
                <div class="col-lg-4 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h4 class="card-title">Add New Time Slot</h4>
                            <form @submit.prevent="addSlot">
                                <div class="form-group">
                                    <label for="dayOfWeek">Day of the Week</label>
                                    <select id="dayOfWeek" class="form-control" v-model="newSlot.day_of_week" required>
                                        <option v-for="day in daysOfWeek" :key="day" :value="day">{{ day }}</option>
                                    </select>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="startTime">Start Time</label>
                                        <input type="time" id="startTime" class="form-control" v-model="newSlot.start_time" required>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="endTime">End Time</label>
                                        <input type="time" id="endTime" class="form-control" v-model="newSlot.end_time" required>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-brand btn-block" :disabled="isSaving">
                                    <span v-if="isSaving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    {{ isSaving ? 'Adding...' : 'Add Slot' }}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Existing Slots Display -->
                <div class="col-lg-8">
                    <div v-if="slots.length === 0" class="card card-body text-center">
                        <p class="text-muted mb-0">No time slots have been added yet. Use the form to create your first one.</p>
                    </div>
                    <div v-else>
                        <div v-for="day in daysOfWeek" :key="day" class="mb-3">
                            <div v-if="getSlotsForDay(day).length > 0">
                                <h5>{{ day }}</h5>
                                <ul class="list-group">
                                    <li v-for="slot in getSlotsForDay(day)" :key="slot.id" class="list-group-item d-flex justify-content-between align-items-center">
                                        <span>
                                            <i class="far fa-clock mr-2"></i>
                                            {{ formatTime(slot.start_time) }} - {{ formatTime(slot.end_time) }}
                                        </span>
                                        <button class="btn btn-sm btn-outline-danger" @click="deleteSlot(slot.id)">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: true,
            isSaving: false,
            error: null,
            slots: [],
            newSlot: {
                day_of_week: 'Monday',
                start_time: '09:00',
                end_time: '17:00'
            },
            daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        };
    },
    methods: {
        async fetchSlots() {
            this.loading = true;
            this.error = null;
            try {
                // ✅ UPDATED: Use apiService.get
                this.slots = await apiService.get('/api/restaurant/timeslots');
            } catch (err) {
                this.error = "Failed to load time slots. " + err.message;
                console.error("Error in fetchSlots:", err);
            } finally {
                this.loading = false;
            }
        },
        async addSlot() {
            this.isSaving = true;
            this.error = null;
            try {
                // ✅ UPDATED: Use apiService.post
                const data = await apiService.post('/api/restaurant/timeslots', this.newSlot);
                alert(data.message || "Slot added!");
                await this.fetchSlots(); // Refresh the list
            } catch (err) {
                this.error = "Error adding slot: " + err.message;
                console.error("Error in addSlot:", err);
            } finally {
                this.isSaving = false;
            }
        },
        async deleteSlot(slotId) {
            if (!confirm('Are you sure you want to delete this time slot?')) return;
            try {
                // ✅ UPDATED: Use apiService.delete
                const data = await apiService.delete(`/api/restaurant/timeslots/${slotId}`);
                alert(data.message || "Slot deleted.");
                await this.fetchSlots(); // Refresh the list
            } catch (err) {
                this.error = "Error deleting slot: " + err.message;
                console.error("Error in deleteSlot:", err);
            }
        },
        getSlotsForDay(day) {
            return this.slots.filter(slot => slot.day_of_week === day);
        },
        formatTime(timeStr) {
            if (!timeStr) return '';
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours);
            const suffix = h >= 12 ? 'PM' : 'AM';
            const formattedHour = ((h + 11) % 12 + 1); // Converts 24h to 12h (0->12, 13->1, etc.)
            return `${formattedHour}:${minutes} ${suffix}`;
        }
    },
    mounted() {
        this.fetchSlots();
    }
};
// NOTE: No export default needed

