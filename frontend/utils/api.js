// This is your new centralized API helper.
// It automatically adds the backend URL and authentication token to every request.

const apiService = {
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
    async request(method, endpoint, body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = store.state.token; // Access the token from the global store
        if (token) {
            headers['Authentication-Token'] = token;
        }

        const config = {
            method: method,
            headers: headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        // The most important part: using the global API_URL
        const response = await fetch(`${window.API_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
            throw new Error(errorData.message);
        }

        // For DELETE requests or other requests that might not have a body
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        } else {
            return; // Return nothing if there's no JSON body
        }
    }
};

