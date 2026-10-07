/**
 * FFMS Centralized API Client
 *
 * Handles HTTP requests to the backend API, automatically injecting the JWT
 * Bearer token from localStorage, providing clean user-friendly error messages,
 * and logging rich developer diagnostics to the JavaScript console in dev mode.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * Helper to strip HTML tags from raw server errors (e.g. PHP notices or XAMPP error pages)
 */
function stripHtml(input) {
  if (!input || typeof input !== "string") return "";
  return input.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

/**
 * Determine a clean, human-friendly user-facing message based on status code and response payload
 */
function getFriendlyErrorMessage(status, rawMessage, endpoint) {
  // If backend provided a clean JSON message and it's not a generic 500/503 HTML dump, prefer it
  const cleaned = stripHtml(rawMessage);

  if (status === 0) {
    return "Cannot connect to the backend server. Please verify that XAMPP (Apache/MySQL) or your backend service is running.";
  }

  if (status === 503 || (cleaned && cleaned.toLowerCase().includes("database connection failed"))) {
    return "Database service is currently unavailable. Please make sure MySQL is started in XAMPP.";
  }

  if (status === 500) {
    return "The server encountered an unexpected error. Please check the backend logs or try again shortly.";
  }

  if (status === 401) {
    if (endpoint.includes("/api/auth/login")) {
      return "Invalid email or password. Please verify your credentials.";
    }
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to access this resource.";
  }

  if (status === 404) {
    return "The requested service endpoint was not found.";
  }

  if (status === 409) {
    return cleaned || "A record with these details already exists.";
  }

  if (status === 422) {
    return cleaned || "Please review the form for invalid or missing fields.";
  }

  return cleaned || "An unexpected error occurred. Please try again.";
}

/**
 * Log rich technical diagnostics in the browser console when in developer mode
 */
function logDeveloperError(endpoint, method, status, errorData, originalError) {
  if (!import.meta.env.DEV) return;

  const styleHeader = "color: #e74c3c; font-weight: bold; font-size: 11px;";
  const styleLabel = "color: #d4a54a; font-weight: 600;";

  console.groupCollapsed(
    `%c⚠️ [FFMS API ${status ? `Status ${status}` : "Network Failure"}] %c${method} ${endpoint}`,
    styleHeader,
    "color: #333; font-weight: normal;"
  );

  console.info(`%cTarget Base URL:%c ${API_BASE_URL}`, styleLabel, "color: inherit;");
  console.info(`%cFull Endpoint:%c ${endpoint}`, styleLabel, "color: inherit;");
  console.info(`%cHTTP Method:%c ${method}`, styleLabel, "color: inherit;");
  console.info(`%cHTTP Status Code:%c ${status || "0 (No Response / Connection Refused)"}`, styleLabel, "color: inherit;");

  if (errorData) {
    console.error("%cRaw Server Response Payload:", styleLabel, errorData);
  }

  if (originalError) {
    console.error("%cException Stack Trace:", styleLabel, originalError);
  }

  console.info(
    "%c💡 Troubleshooting Tips:\n" +
      "  1. Ensure XAMPP Apache & MySQL services are running (green status in XAMPP Control Panel).\n" +
      "  2. If using PHP built-in server, start it via: php -S localhost:8000 -t backend/public backend/public/index.php\n" +
      "  3. Check database credentials in .env (DB_HOST, DB_USER, DB_PASS, DB_DATABASE).\n" +
      "  4. Verify CORS and VITE_API_URL settings in ffms-frontend/.env",
    "color: #27ae60; font-size: 10px;"
  );

  console.groupEnd();
}

/**
 * Core request helper
 *
 * @param {string} endpoint - Path e.g. '/api/auth/login' or '/api/farms'
 * @param {object} options - Standard fetch options (method, headers, body)
 * @returns {Promise<any>} Parsed JSON response
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const method = options.method || "GET";

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
    method,
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
      data = { success: response.ok, message: stripHtml(text) };
    }

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes("/api/auth/login")) {
        // Token expired or invalid — clear local auth state
        localStorage.removeItem("ffms_token");
        localStorage.removeItem("ffms_user");
        window.dispatchEvent(new CustomEvent("ffms:unauthorized"));
      }

      const rawMsg = data.message || data.error || `HTTP error ${response.status}`;
      const userMessage = getFriendlyErrorMessage(response.status, rawMsg, endpoint);

      // Log rich technical diagnostic in console for developers
      logDeveloperError(endpoint, method, response.status, data, null);

      const error = new Error(userMessage);
      error.status = response.status;
      error.data = data;
      error.developerDetails = {
        endpoint,
        method,
        status: response.status,
        rawMessage: rawMsg,
        debug: data.debug || null,
        url,
      };
      throw error;
    }

    return data;
  } catch (error) {
    // If it's already our structured error, bubble it up
    if (error.status !== undefined) {
      throw error;
    }

    // Handle network failures (e.g. Failed to fetch / server offline)
    const isNetwork = error.name === "TypeError" && error.message.toLowerCase().includes("fetch");
    const userMessage = getFriendlyErrorMessage(0, error.message, endpoint);

    logDeveloperError(endpoint, method, 0, null, error);

    const networkError = new Error(userMessage);
    networkError.status = 0;
    networkError.developerDetails = {
      endpoint,
      method,
      status: 0,
      rawMessage: error.message,
      url,
      isNetworkFailure: isNetwork,
    };
    throw networkError;
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
