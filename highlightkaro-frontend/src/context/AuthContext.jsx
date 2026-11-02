import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../config/api";
import { apiFetch, refreshSession } from "../api/client";

const AuthContext = createContext();

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = useCallback((data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  const logout = useCallback(() => {
    clearSession();
    // Drop the refresh cookie too, otherwise the next visit logs straight back in
    fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  }, [clearSession]);

  // Refresh user after payment / on load. Returns the fresh user or null.
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("token")) return null;

    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        return data.user;
      }
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
    return null;
  }, []);

  // Keep state in sync with token refreshes done by apiFetch
  useEffect(() => {
    const onAuth = (e) => {
      if (e.detail?.type === "refreshed") {
        setToken(e.detail.token);
        setUser(e.detail.user);
      } else if (e.detail?.type === "expired") {
        clearSession();
      }
    };
    window.addEventListener("hk:auth", onAuth);
    return () => window.removeEventListener("hk:auth", onAuth);
  }, [clearSession]);

  // On load: validate a stored token (and pick up plan changes / expiry),
  // or restore a "remember me" session from the refresh cookie
  useEffect(() => {
    if (localStorage.getItem("token")) {
      // Async: state is only set after the request resolves
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshUser();
    } else {
      refreshSession();
    }
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, token, login, logout, refreshUser }),
    [user, token, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
