const AdminReportsPage = {
    template: `
        <div class="admin-container">
            <h2 class="admin-page-title">Reports & Analytics</h2>

            <div v-if="loading" class="alert alert-info">Loading report data...</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div v-if="!loading && !error" class="row">
                <div class="col-lg-8 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h4 class="card-title">Daily Revenue Trends (Last 7 Days)</h4>
                            <div v-if="revenueData.length > 0" class="chart-container">
                                <div v-for="data in revenueData" :key="data.day" class="chart-bar-wrapper">
                                    <div class="chart-bar" :style="{ height: data.height + '%' }">
                                        <span class="bar-value">\${{ data.revenue }}</span>
                                    </div>
                                    <div class="chart-label">{{ data.day }}</div>
                                </div>
                            </div>
                            <p v-else class="text-muted">Not enough sales data to display a chart.</p>
                        </div>
                    </div>
                </div>

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
                                    <span class="font-weight-bold">\${{ restaurant.revenue.toLocaleString() }}</span>
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
            rawRevenueData: [],
            topRestaurants: []
        };
    },
    computed: {
        revenueData() {
            if (!this.rawRevenueData || this.rawRevenueData.length === 0) return [];
            const maxRevenue = Math.max(...this.rawRevenueData.map(d => d.revenue));
            if (maxRevenue === 0) return this.rawRevenueData.map(d => ({ ...d, height: 0 }));
            
            return this.rawRevenueData.map(data => ({
                ...data,
                height: (data.revenue / maxRevenue) * 100
            }));
        }
    },
    mounted() {
        this.fetchReports();
    },
    methods: {
        async fetchReports() {
            this.loading = true;
            this.error = null;
            try {
                const token = this.$store.state.token;
                const response = await fetch('/api/admin/reports', {
                    headers: { 'Authentication-Token': token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch reports.");

                this.rawRevenueData = data.dailyRevenue;
                this.topRestaurants = data.topRestaurants;

            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        }
    }
};

export default AdminReportsPage;
