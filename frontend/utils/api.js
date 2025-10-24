// This is your centralized API helper for the UNIFIED deployment model.
// It automatically adds the authentication token and handles responses.

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
    // Special method for downloading files
    download(endpoint) {
        return this.request('GET', endpoint, null, 'blob');
    },

    // Core request function
    async request(method, endpoint, body = null, responseType = 'json') {
        // Ensure endpoint starts with a single /
        const correctedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

        const headers = {};

        // Handle JSON body
        if (body && !(body instanceof FormData)) {
             headers['Content-Type'] = 'application/json';
        }

        // --- THE DEFINITIVE FIX ---
        // Read the token directly from localStorage at the time of the request.
        // This bypasses any Vuex reactivity/timing issues.
        const token = localStorage.getItem('auth-token');
        // --- END OF FIX ---

        if (token) {
            headers['Authentication-Token'] = token;
        }

        const config = {
            method: method,
            headers: headers,
        };

        if (body) {
            // Handle both FormData (for file uploads) and JSON
            config.body = (body instanceof FormData) ? body : JSON.stringify(body);
        }

        try {
            // Use the relative endpoint directly (e.g., /api/login)
            // This works because we are on the unified model (same domain)
            const response = await fetch(correctedEndpoint, config);

            if (!response.ok) {
                // Try to parse error message, otherwise throw HTTP error
                let errorData = { message: `Request failed: ${response.status} ${response.statusText}` };
                try {
                     // Read response body as text first
                     const rawErrorResponse = await response.text();
                     // Then try to parse as JSON
                     errorData = JSON.parse(rawErrorResponse); 
                } catch (e) {
                    // Could not parse as JSON, use the status text
                    // This often happens if the server returns an HTML 404/500 page
                }
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }

            // Handle different response types (Blob, No Content, JSON)
            if (responseType === 'blob') {
                return response.blob();
            }
            if (response.status === 204) { // 204 No Content
                return null;
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();
            }
            // Fallback for any other response
            return response.text();

        } catch (error) {
            console.error(`API ${method} request to ${correctedEndpoint} failed:`, error);
            throw error; // Re-throw the error to be caught by the component
        }
    }
};
// NOTE: No export default needed

