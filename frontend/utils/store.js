Vue.use(Vuex);

const store = new Vuex.Store({
    // 1. STATE: The single source of truth for the application.
    state: {
        token: localStorage.getItem('auth-token') || null,
        user: JSON.parse(localStorage.getItem('user-info')) || null,
        cart: JSON.parse(localStorage.getItem('cart-items')) || [],
        cartRestaurantId: localStorage.getItem('cart-restaurant-id') || null,
    },

    // 2. GETTERS: Computed properties for the store's state.
    getters: {
        isAuthenticated: (state) => !!state.token,
        currentUser: (state) => state.user,
        userRoles: (state) => (state.user ? state.user.roles : []),
        cartItems: (state) => state.cart,
        cartRestaurantId: (state) => state.cartRestaurantId,
        cartItemCount: (state) => state.cart.reduce((total, item) => total + item.quantity, 0),
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
            state.cart = [];
            state.cartRestaurantId = null;
            localStorage.removeItem('cart-items');
            localStorage.removeItem('cart-restaurant-id');
        },
        ADD_TO_CART(state, { item, restaurantId }) {
            if (state.cartRestaurantId && state.cartRestaurantId !== restaurantId) {
                state.cart = [];
                alert('Your cart has been cleared because you are ordering from a different restaurant.');
            }
            state.cartRestaurantId = restaurantId;
            const existingItem = state.cart.find(i => i.id === item.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                state.cart.push({ ...item, quantity: 1 });
            }
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
        // ✅ --- THIS IS THE CRITICAL CHANGE --- ✅
        async login({ commit }, credentials) {
            try {
                // Use the new apiService helper, which knows the correct backend URL.
                const data = await apiService.post('/api/login', credentials);
                
                commit('SET_TOKEN', data.token);
                commit('SET_USER', data.user);
                return data; // Return data on success
            } catch (error) {
                // The apiService automatically throws an error on failure,
                // so we just re-throw it to be caught by the component.
                throw error;
            }
        },
        // ✅ --- END OF CHANGE --- ✅

        logout({ commit }) {
            commit('LOGOUT');
        },
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

