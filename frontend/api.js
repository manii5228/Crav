// This is our new API helper service.
// It centralizes all the logic for making API calls.
const apiService = {
    // Helper function to get the authentication token from the store
    _getToken: () => {
        // We assume the global 'store' object is available
        return store.state.token;
    },

    // Helper to construct headers
    _getHeaders: (hasContent = false) => {
        const headers = {
            'Authentication-Token': apiService._getToken()
        };
        if (hasContent) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    },

    // A generic request handler to reduce repetition
    _request: async (endpoint, method, body = null) => {
        const url = `${window.API_URL}${endpoint}`;
        const options = {
            method,
            headers: apiService._getHeaders(!!body)
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const responseText = await response.text(); // Read response text once

        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                // Try to parse a JSON error message from the backend
                const errorJson = JSON.parse(responseText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                // The error response was not JSON, maybe plain text or HTML
                console.error("Could not parse error response as JSON:", responseText);
            }
            throw new Error(errorMessage);
        }

        // Handle cases where the response might be empty
        return responseText ? JSON.parse(responseText) : {};
    },

    // Public methods for GET, POST, PUT, PATCH, DELETE
    get: (endpoint) => apiService._request(endpoint, 'GET'),
    post: (endpoint, body) => apiService._request(endpoint, 'POST', body),
    put: (endpoint, body) => apiService._request(endpoint, 'PUT', body),
    patch: (endpoint, body) => apiService._request(endpoint, 'PATCH', body),
    del: (endpoint) => apiService._request(endpoint, 'DELETE'),

    // Special method for downloading files like Excel exports
    getBlob: async (endpoint) => {
        const url = `${window.API_URL}${endpoint}`;
        const options = {
            method: 'GET',
            headers: apiService._getHeaders()
        };
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to download file.' }));
            throw new Error(errorData.message);
        }
        return response.blob();
    }
};
