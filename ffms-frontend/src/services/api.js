/**
 * FFMS Centralized API Client
 *
 * Handles HTTP requests to the backend API, automatically injecting the JWT
 * Bearer token from localStorage and formatting headers.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Core request helper
 *
 * @param {string} endpoint - Path e.g. '/api/auth/login' or '/api/farms'
 * @param {object} options - Standard fetch options (method, headers, body)
 * @returns {Promise<any>} Parsed JSON response
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  const token = localStorage.getItem("ffms_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { success: response.ok, message: text };
    }

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes("/api/auth/login")) {
        // Token expired or invalid — clear local auth state
        localStorage.removeItem("ffms_token");
        localStorage.removeItem("ffms_user");
        window.dispatchEvent(new CustomEvent("ffms:unauthorized"));
      }

      const error = new Error(data.message || data.error || `HTTP error ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      const networkError = new Error("Unable to connect to the backend server. Please ensure the API is running on " + API_BASE_URL);
      networkError.status = 0;
      throw networkError;
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
  getBaseUrl: () => API_BASE_URL,
};

export default api;
