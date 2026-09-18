import api from "./api";

/**
 * Authentication Service
 *
 * Communicates with backend endpoints:
 *   POST /api/auth/login
 *   POST /api/auth/register
 *   GET  /api/auth/me
 *   POST /api/auth/logout
 */
export const authService = {
  /**
   * Log in with email and password
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const data = await api.post("/api/auth/login", { email, password });
    if (data.token) {
      localStorage.setItem("ffms_token", data.token);
      localStorage.setItem("ffms_user", JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Register a new user account
   * @param {object} param0 - { name, email, password, role_id }
   */
  async register({ name, email, password, role_id = 5 }) {
    const data = await api.post("/api/auth/register", {
      name,
      email,
      password,
      role_id: Number(role_id) || 5,
    });
    if (data.token) {
      localStorage.setItem("ffms_token", data.token);
      localStorage.setItem("ffms_user", JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Fetch current authenticated user profile
   */
  async me() {
    const data = await api.get("/api/auth/me");
    if (data.user) {
      localStorage.setItem("ffms_user", JSON.stringify(data.user));
    }
    return data.user;
  },

  /**
   * Log out user from current session
   */
  async logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Ignore logout backend errors — proceed with client-side cleanup
    } finally {
      localStorage.removeItem("ffms_token");
      localStorage.removeItem("ffms_user");
    }
  },

  /**
   * Get cached user from localStorage
   */
  getCachedUser() {
    try {
      const user = localStorage.getItem("ffms_user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get cached token from localStorage
   */
  getToken() {
    return localStorage.getItem("ffms_token");
  },

  /**
   * Check if token is present in localStorage
   */
  isAuthenticated() {
    return !!localStorage.getItem("ffms_token");
  },
};

export default authService;
