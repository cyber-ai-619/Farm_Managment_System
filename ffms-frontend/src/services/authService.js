import api from "./api";

function cacheUser(user) {
  if (!user) return;
  const cachedUser = { ...user };
  delete cachedUser.profile_photo;
  localStorage.setItem("ffms_user", JSON.stringify(cachedUser));
}

/**
 * Authentication Service
 *
 * Communicates with backend endpoints:
 *   POST /api/auth/login
 *   POST /api/auth/register
 *   GET  /api/auth/me
 *   PUT  /api/auth/me
 *   PUT  /api/auth/password
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
      cacheUser(data.user);
    }
    return data;
  },

  /**
   * Register a new user account as a Farm Owner with an initial farm workspace (Direct)
   * @param {object} param0 - { name, email, password, farm_name }
   */
  async register({ name, email, password, farm_name }) {
    const data = await api.post("/api/auth/register", {
      name,
      email,
      password,
      farm_name,
    });
    if (data.token) {
      localStorage.setItem("ffms_token", data.token);
      cacheUser(data.user);
    }
    return data;
  },

  /**
   * Request temporal registration verification email (24-hour token)
   * @param {object} param0 - { name, email, farm_name }
   */
  async requestRegistration({ name, email, farm_name }) {
    return api.post("/api/auth/register-request", {
      name,
      email,
      farm_name,
    });
  },

  /**
   * Verify a 24-hour registration token
   * @param {string} token
   */
  async verifyRegistration(token) {
    const res = await api.get(`/api/auth/verify-registration?token=${encodeURIComponent(token)}`);
    return res.data;
  },

  /**
   * Complete registration by setting password with valid temporal token
   * @param {object} param0 - { token, password, name, farm_name }
   */
  async completeRegistration({ token, password, name, farm_name }) {
    const data = await api.post("/api/auth/complete-registration", {
      token,
      password,
      name,
      farm_name,
    });
    if (data.token) {
      localStorage.setItem("ffms_token", data.token);
      cacheUser(data.user);
    }
    return data;
  },

  /**
   * Request a 10-minute password reset link
   * @param {string} email
   */
  async forgotPassword(email) {
    return api.post("/api/auth/forgot-password", { email });
  },

  /**
   * Reset password using temporal 10-minute token
   * @param {object} param0 - { token, password }
   */
  async resetPassword({ token, password }) {
    return api.post("/api/auth/reset-password", { token, password });
  },

  /**
   * Fetch invite details by token for auto-populating signup fields
   * @param {string} token
   */
  async getInvite(token) {
    const res = await api.get(`/api/auth/invite?token=${encodeURIComponent(token)}`);
    return res.data;
  },

  /**
   * Accept an invitation and activate member account
   * @param {object} param0 - { token, name, password }
   */
  async acceptInvite({ token, name, password }) {
    const data = await api.post("/api/auth/accept-invite", {
      token,
      name,
      password,
    });
    if (data.token) {
      localStorage.setItem("ffms_token", data.token);
      cacheUser(data.user);
    }
    return data;
  },

  /**
   * Fetch current authenticated user profile
   */
  async me() {
    const data = await api.get("/api/auth/me");
    if (data.user) {
      cacheUser(data.user);
    }
    return data.user;
  },

  async updateProfile(profile) {
    const data = await api.put("/api/auth/me", profile);
    if (data.user) {
      cacheUser(data.user);
    }
    return data.user;
  },

  async changePassword({ current_password, new_password }) {
    return api.put("/api/auth/password", { current_password, new_password });
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
