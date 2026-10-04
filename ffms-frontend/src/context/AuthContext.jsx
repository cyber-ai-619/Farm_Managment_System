import { createContext, useState, useEffect, useCallback } from "react";
import authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCachedUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = authService.getToken();
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.me();
        if (isMounted) {
          setUser(currentUser);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn("Session expired or invalid:", err.message);
        authService.logout();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Listen for 401 unauthorized events emitted from api.js
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("ffms:unauthorized", handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener("ffms:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setToken(response.token);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    try {
      const response = await authService.register(payload);
      setUser(response.user);
      setToken(response.token);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await authService.me();
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
      throw err;
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    role: user?.role_name || user?.role || "worker",
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
