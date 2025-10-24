// NOTE: No imports needed. Assumes apiService is global.

const AdminReportsPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Reports & Analytics</h2>

            <!-- Loading and Error States -->
            <div v-if="loading" class="alert alert-info">Loading report data...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <!-- Main Content Area -->
            <div v-if="!loading && !error" class="row">

                <!-- Daily Revenue Chart -->
                <div class="col-lg-8 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h4 class="card-title">Daily Revenue Trends (Last 7 Days)</h4>
                            <!-- Chart container -->
                            <div v-if="revenueData.length > 0 && maxRevenue > 0" class="chart-container">
                                <div v-for="data in revenueData" :key="data.day" class="chart-bar-wrapper">
                                    <div class="chart-bar" :style="{ height: data.height + '%' }">
                                        <span class="bar-value">₹{{ data.revenue.toLocaleString('en-IN') }}</span>
                                    </div>
                                    <div class="chart-label">{{ data.day }}</div>
                                </div>
                            </div>
                            <!-- No data message -->
                            <p v-else class="text-muted mt-4">Not enough completed order data to display a chart.</p>
                        </div>
                    </div>
                </div>

                <!-- Top Restaurants List -->
                <div class="col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h4 class="card-title">Top Restaurants by Revenue</h4>
                            <ul class="list-group list-group-flush">
                                <li v-if="topRestaurants.length === 0" class="list-group-item text-muted">No completed orders to rank restaurants.</li>
                                <li v-for="restaurant in topRestaurants" :key="restaurant.rank" class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="rank-badge">{{ restaurant.rank }}</span>
                                        <strong>{{ restaurant.name }}</strong>
                                    </div>
                                    <span class="font-weight-bold">₹{{ restaurant.revenue.toLocaleString('en-IN') }}</span>
                                </li>
                            </ul>
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
            rawRevenueData: [], // Store raw data from API
            topRestaurants: []
        };
    },
    computed: {
        maxRevenue() {
            if (!this.rawRevenueData || this.rawRevenueData.length === 0) {
                return 0;
            }
            // Ensure revenues are numbers before calculating max
             const revenues = this.rawRevenueData.map(d => parseFloat(d.revenue)).filter(r => !isNaN(r));
             return revenues.length > 0 ? Math.max(...revenues) : 0;
        },
        revenueData() {
            // Guard against division by zero if maxRevenue is 0
            if (!this.rawRevenueData || this.rawRevenueData.length === 0 || this.maxRevenue <= 0) {
                return this.rawRevenueData.map(d => ({ ...d, height: 0 }));
            }
            return this.rawRevenueData.map(data => ({
                ...data,
                 // Ensure revenue is a number for calculation
                 height: (parseFloat(data.revenue) / this.maxRevenue) * 100
            }));
        }
    },
    methods: {
        async fetchReports() {
            this.loading = true;
            this.error = null;
            try {
                // Use apiService.get
                const data = await apiService.get('/api/admin/reports');
                // Basic validation of received data structure
                 if (!data || !Array.isArray(data.dailyRevenue) || !Array.isArray(data.topRestaurants)) {
                     throw new Error("Received invalid data structure from reports API.");
                 }
                this.rawRevenueData = data.dailyRevenue;
                this.topRestaurants = data.topRestaurants;
            } catch (err) {
                this.error = err.message;
                console.error("Error fetching admin reports:", err);
            } finally {
                this.loading = false;
            }
        }
    },
    mounted() {
        this.fetchReports();
    }
};
// NOTE: No export default needed

