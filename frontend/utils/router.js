const Home = {
    template : `<h1> this is home </h1>`
}

// Define the routes for the application
const routes = [
    // --- Public & Customer Routes ---
    { path: '/', component: CustomerHomePage, name: 'CustomerHome' },
    { path: '/login', component: CustomerLoginPage, name: 'CustomerLogin' },
    { path: '/register', component: CustomerRegisterPage, name: 'CustomerRegister' },
    { path: '/restaurants/:id', component: CustomerRestaurantDetailPage, name: 'RestaurantDetail' },
    { path: '/cart', component: CustomerCartPage, name: 'Cart', meta: { requiresAuth: true, roles: ['customer'] } },
    { path: '/checkout', component: CustomerCheckoutPage, name: 'Checkout', meta: { requiresAuth: true, roles: ['customer'] } },
    { path: '/orders', component: CustomerOrderHistoryPage, name: 'OrderHistory', meta: { requiresAuth: true, roles: ['customer'] } },
    { path: '/orders/:id', component: CustomerOrderDetailPage, name: 'OrderDetail', meta: { requiresAuth: true, roles: ['customer'] } },
    { path: '/profile', component: CustomerProfilePage, name: 'Profile', meta: { requiresAuth: true, roles: ['customer'] } },
    { path: '/favorites', component: CustomerFavoritesPage, name: 'Favorites', meta: { requiresAuth: true, roles: ['customer'] } },
    { path: '/rewards', component: CustomerRewardsPage, name: 'Rewards', meta: { requiresAuth: true, roles: ['customer'] } },

    // --- Restaurant Routes ---
    { path: '/restaurant/login', component: RestaurantLoginPage, name: 'RestaurantLogin' },
    { path: '/restaurant/register', component: RestaurantRegisterPage, name: 'RestaurantRegister' },
    { path: '/restaurant/dashboard', component: RestaurantDashboardPage, name: 'RestaurantDashboard', meta: { requiresAuth: true, roles: ['owner'] } },
    { path: '/restaurant/menu', component: RestaurantMenuManagementPage, name: 'RestaurantMenu', meta: { requiresAuth: true, roles: ['owner'] } },
    { path: '/restaurant/orders', component: RestaurantOrderQueuePage, name: 'RestaurantOrders', meta: { requiresAuth: true, roles: ['owner'] } },
    { path: '/restaurant/profile', component: RestaurantProfileManagementPage, name: 'RestaurantProfile', meta: { requiresAuth: true, roles: ['owner'] } },
    { path: '/restaurant/promotions', component: RestaurantPromotionsPage, name: 'RestaurantPromotions', meta: { requiresAuth: true, roles: ['owner'] } },
    { path: '/restaurant/analytics', component: RestaurantAnalyticsPage, name: 'RestaurantAnalytics', meta: { requiresAuth: true, roles: ['owner'] } },   
    { path: '/restaurant/timeslots', component: RestaurantTimeSlotManagementPage, name: 'RestaurantTimeSlots', meta: { requiresAuth: true, roles: ['owner'] } },

    // --- Admin Routes ---
    { path: '/admin/login', component: AdminLoginPage, name: 'AdminLogin' },
    { path: '/admin/dashboard', component: AdminDashboardPage, name: 'AdminDashboard', meta: { requiresAuth: true, roles: ['admin'] } },
    { path: '/admin/restaurants', component: AdminRestaurantManagementPage, name: 'AdminRestaurants', meta: { requiresAuth: true, roles: ['admin'] } },
    { path: '/admin/users', component: AdminUserManagementPage, name: 'AdminUsers', meta: { requiresAuth: true, roles: ['admin'] } },
    { path: '/admin/orders', component: AdminOrderManagementPage, name: 'AdminOrders', meta: { requiresAuth: true, roles: ['admin'] } },
    { path: '/admin/coupons', component: AdminCouponManagementPage, name: 'AdminCoupons', meta: { requiresAuth: true, roles: ['admin'] } },
    { path: '/admin/reviews', component: AdminReviewManagementPage, name: 'AdminReviews', meta: { requiresAuth: true, roles: ['admin'] } },
    { path: '/admin/reports', component: AdminReportsPage, name: 'AdminReports', meta: { requiresAuth: true, roles: ['admin'] } },
];

// Create the router instance
const router = new VueRouter({
    routes,
    mode: 'history', // Use history mode for cleaner URLs
});

// Navigation Guard (this code is correct and remains unchanged)
router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const isAuthenticated = store.getters.isAuthenticated;
    const userRoles = store.getters.userRoles;

    if (requiresAuth && !isAuthenticated) {
        if (to.path.startsWith('/admin')) {
            next('/admin/login');
        } else if (to.path.startsWith('/restaurant')) {
            next('/restaurant/login');
        } else {
            next('/login');
        }
    } else if (requiresAuth && isAuthenticated) {
        const requiredRoles = to.meta.roles;
        const hasRole = requiredRoles.some(role => userRoles.includes(role));

        if (hasRole) {
            next();
        } else {
            alert("You are not authorized to view this page.");
            next('/');
        }
    } else {
        next();
    }
});

