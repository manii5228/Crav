// This is your centralized API helper for the UNIFIED deployment model.
// It automatically adds the authentication token and handles responses.
// Assumes 'store' is a global variable from store.js

const apiService = {
    // Standard HTTP methods
    get(endpoint) {
        return this.request('GET', endpoint);
    },
    post(endpoint, body) {
        return this.request('POST', endpoint, body);
    },
    put(endpoint, body) {
        return this.request('PUT', endpoint, body);
    },
    patch(endpoint, body) {
        return this.request('PATCH', endpoint, body);
    },
    delete(endpoint) {
        return this.request('DELETE', endpoint);
    },

    // Core request function
    async request(method, endpoint, body = null, responseType = 'json') { // Added responseType
        const headers = {};
        // Only add Content-Type for methods that typically send a body
        if (body) {
             headers['Content-Type'] = 'application/json';
        }

        // Get token from the global Vuex store
        const token = store.state.token;
        if (token) {
            headers['Authentication-Token'] = token;
        }

        const config = {
            method: method,
            headers: headers,
        };

        // Add body if it exists
        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            // --- CRITICAL CHANGE FOR UNIFIED MODEL ---
            // Use the relative endpoint directly. The browser automatically uses the current domain.
            const response = await fetch(endpoint, config);
            // --- END OF CHANGE ---

            // Handle non-ok responses (like 401, 404, 500)
            if (!response.ok) {
                let errorData = { message: `Request failed with status: ${response.status}` };
                try {
                    // Try to parse error JSON from the backend
                    errorData = await response.json();
                } catch (e) {
                    // If parsing fails, use the status text
                    errorData.message = response.statusText || errorData.message;
                }
                throw new Error(errorData.message);
            }

            // Handle different expected response types
            if (responseType === 'blob') {
                 // Return the raw blob for file downloads
                 return response.blob();
            }

            // Handle empty responses (like successful DELETE or PUT without content)
            const contentType = response.headers.get("content-type");
            if (response.status === 204 || !contentType) { // 204 No Content
                return null; // Return null or undefined for empty responses
            }

            // Handle JSON responses
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            }

            // Handle unexpected content types if necessary
            console.warn("Received unexpected content type:", contentType);
            return response.text(); // Fallback to text if not JSON

        } catch (error) {
            console.error(`API ${method} request to ${endpoint} failed:`, error);
            // Re-throw the error so the component can catch it
            throw error;
        }
    }
};
// NOTE: No export default needed

