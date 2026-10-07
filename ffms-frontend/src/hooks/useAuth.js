import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Custom hook to access authentication state and actions
 * @returns {{ user, token, loading, error, isAuthenticated, role, login, register, logout, refreshUser }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default useAuth;
