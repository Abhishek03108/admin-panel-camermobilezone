import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth.api.js";
import { getErrorMessage } from "../api/axiosClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const res = await authApi.me();
      setAdmin(res.data.data);
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.data.data.requiresTwoFactor) {
      return { requiresTwoFactor: true, ticket: res.data.data.ticket, maskedEmail: res.data.data.maskedEmail };
    }
    setAdmin(res.data.data.admin);
    return { requiresTwoFactor: false, admin: res.data.data.admin };
  };

  const setAdminSession = (adminData) => setAdmin(adminData);

  const verifyTwoFactor = async (ticket, code) => {
    const res = await authApi.verifyTwoFactorLogin(ticket, code);
    setAdmin(res.data.data.admin);
    return res.data.data.admin;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the network call fails, clear local state so the UI
      // reflects a logged-out session — the cookie will expire either way.
    }
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{ admin, isLoading, login, verifyTwoFactor, setAdminSession, logout, refetch: loadMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { getErrorMessage };