// This is the centralized API helper.
// It automatically adds the backend URL and the authentication token to every request.

const apiService = {
    // Helper function to handle the response from the fetch call
    async handleResponse(response) {
        // If the response is not OK (e.g., 404, 500), try to parse the error message
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // If the response isn't JSON, use the status text
                throw new Error(response.statusText || 'An unknown error occurred.');
            }
            // Throw an error with the message from the backend
            throw new Error(errorData.message || 'An API error occurred.');
        }
        // If the response is OK, parse and return the JSON data
        return response.json();
    },

    // Method for GET requests
    async get(endpoint) {
        const headers = {
            'Content-Type': 'application/json',
        };
        const token = store.state.token;
        if (token) {
            headers['Authentication-Token'] = token;
        }
        const response = await fetch(`${window.API_URL}${endpoint}`, {
            method: 'GET',
            headers: headers,
        });
        return this.handleResponse(response);
    },

    // Method for POST requests
    async post(endpoint, body) {
        const headers = {
            'Content-Type': 'application/json',
        };
        const token = store.state.token;
        if (token) {
            headers['Authentication-Token'] = token;
        }
        const response = await fetch(`${window.API_URL}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
        });
        return this.handleResponse(response);
    },

    // Method for PUT requests
    async put(endpoint, body) {
        const headers = {
            'Content-Type': 'application/json',
        };
        const token = store.state.token;
        if (token) {
            headers['Authentication-Token'] = token;
        }
        const response = await fetch(`${window.API_URL}${endpoint}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(body),
        });
        return this.handleResponse(response);
    },

    // Method for PATCH requests
    async patch(endpoint, body = {}) {
        const headers = {
            'Content-Type': 'application/json',
        };
        const token = store.state.token;
        if (token) {
            headers['Authentication-Token'] = token;
        }
        const response = await fetch(`${window.API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(body),
        });
        return this.handleResponse(response);
    },

    // Method for DELETE requests
    async del(endpoint) {
        const headers = {
            'Content-Type': 'application/json',
        };
        const token = store.state.token;
        if (token) {
            headers['Authentication-Token'] = token;
        }
        const response = await fetch(`${window.API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: headers,
        });
        return this.handleResponse(response);
    }
};

