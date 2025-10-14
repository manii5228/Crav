Vue.use(Vuex);

const store = new Vuex.Store({
    // 1. STATE: The single source of truth for the application.
    state: {
        // --- Authentication State ---
        token: localStorage.getItem('auth-token') || null,
        user: JSON.parse(localStorage.getItem('user-info')) || null,

        // --- Shopping Cart State ---
        // Load cart items from browser storage to persist them across page reloads.
        cart: JSON.parse(localStorage.getItem('cart-items')) || [],
        // Store the ID of the restaurant the cart belongs to.
        cartRestaurantId: localStorage.getItem('cart-restaurant-id') || null,
    },

    // 2. GETTERS: Computed properties for the store's state.
    getters: {
        // --- Auth Getters ---
        isAuthenticated: (state) => !!state.token,
        currentUser: (state) => state.user,
        userRoles: (state) => (state.user ? state.user.roles : []),

        // --- Cart Getters ---
        cartItems: (state) => state.cart,
        cartRestaurantId: (state) => state.cartRestaurantId,
        // Calculates the total number of items for the cart icon badge.
        cartItemCount: (state) => state.cart.reduce((total, item) => total + item.quantity, 0),
        // Calculates the subtotal of the items in the cart.
        cartTotal: (state) => state.cart.reduce((total, item) => total + (item.price * item.quantity), 0),
    },

    // 3. MUTATIONS: Synchronous functions that directly modify the state.
    mutations: {
        SET_TOKEN(state, token) {
            state.token = token;
            localStorage.setItem('auth-token', token);
        },
        SET_USER(state, user) {
            state.user = user;
            localStorage.setItem('user-info', JSON.stringify(user));
        },
        LOGOUT(state) {
            state.token = null;
            state.user = null;
            localStorage.removeItem('auth-token');
            localStorage.removeItem('user-info');
            // Also clear the cart on logout
            state.cart = [];
            state.cartRestaurantId = null;
            localStorage.removeItem('cart-items');
            localStorage.removeItem('cart-restaurant-id');
        },

        // --- Cart Mutations ---
        ADD_TO_CART(state, { item, restaurantId }) {
            // Business Rule: If user adds an item from a new restaurant, clear the old cart.
            if (state.cartRestaurantId && state.cartRestaurantId !== restaurantId) {
                state.cart = [];
                alert('Your cart has been cleared because you are ordering from a different restaurant.');
            }
            state.cartRestaurantId = restaurantId;

            const existingItem = state.cart.find(i => i.id === item.id);
            if (existingItem) {
                existingItem.quantity++; // Increment quantity if item already exists
            } else {
                state.cart.push({ ...item, quantity: 1 }); // Add new item with quantity 1
            }
            // Persist changes to local storage
            localStorage.setItem('cart-items', JSON.stringify(state.cart));
            localStorage.setItem('cart-restaurant-id', restaurantId);
        },
        UPDATE_QUANTITY(state, { id, quantity }) {
            const item = state.cart.find(i => i.id === id);
            if (item) {
                item.quantity = quantity;
            }
            localStorage.setItem('cart-items', JSON.stringify(state.cart));
        },
        REMOVE_FROM_CART(state, itemId) {
            state.cart = state.cart.filter(i => i.id !== itemId);
            // If cart is now empty, clear the restaurant ID as well
            if (state.cart.length === 0) {
                state.cartRestaurantId = null;
                localStorage.removeItem('cart-restaurant-id');
            }
            localStorage.setItem('cart-items', JSON.stringify(state.cart));
        },
        CLEAR_CART(state) {
            state.cart = [];
            state.cartRestaurantId = null;
            localStorage.removeItem('cart-items');
            localStorage.removeItem('cart-restaurant-id');
        }
    },

    // 4. ACTIONS: Asynchronous functions that commit mutations.
    actions: {
        async login({ commit }, credentials) {
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials),
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }
                commit('SET_TOKEN', data.token);
                commit('SET_USER', data.user);
                return data;
            } catch (error) {
                throw error;
            }
        },
        logout({ commit }) {
            commit('LOGOUT');
        },

        // --- Cart Actions ---
        addItemToCart({ commit }, { item, restaurantId }) {
            commit('ADD_TO_CART', { item, restaurantId });
        },
        updateCartQuantity({ commit }, payload) {
            commit('UPDATE_QUANTITY', payload);
        },
        removeItemFromCart({ commit }, itemId) {
            commit('REMOVE_FROM_CART', itemId);
        },
        clearCart({ commit }) {
            commit('CLEAR_CART');
        }
    },
});

export default store;

