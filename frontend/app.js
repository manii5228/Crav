// NOTE: No imports needed. Assumes Vue, Navbar, router, and store are global.

// --- Loading Indicator Logic ---
// Function to hide the loading indicator once Vue is mounted
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    const appContent = document.getElementById('app');
    if (appContent) {
        appContent.style.display = 'block'; // Show the app content
    }
}

// --- Main Vue Application Instance ---
const app = new Vue({
    el: '#app',
    // Root template for the application
    template: `
        <div>
            <!-- Navbar is always visible -->
            <navbar></navbar>
            <!-- RouterView displays the component for the current route -->
            <router-view :key="$route.fullPath"></router-view>
        </div>
    `,
    // Register global components (like the Navbar)
    components: {
        // Use kebab-case for component tags in the template
        'navbar': Navbar,
    },
    // Inject the router and store into the Vue instance
    // These are now guaranteed to be defined by the script loading order in index.html
    router: router,
    store: store,

    // --- Lifecycle Hook ---
    mounted() {
        // This code runs after the Vue instance has been created and mounted to the DOM.
        // It's the perfect place to hide the loading indicator.
        this.$nextTick(() => {
            hideLoadingIndicator();
        });
        console.log("Vue App Mounted!"); // For debugging
    }
});
// NOTE: No export default needed

