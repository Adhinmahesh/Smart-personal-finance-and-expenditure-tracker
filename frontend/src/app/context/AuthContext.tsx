import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch } from "../utils/api";

export interface UserProfile {
  id?: string | number;
  name: string;
  email: string;
}

export interface AuthContextType {
  currentUser: UserProfile | null;
  isCheckingAuth: boolean;
  login: (user: UserProfile) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const userRes = await apiFetch("/auth/me");
          setCurrentUser(userRes.data.user);
        } catch (error) {
          localStorage.removeItem("token");
          setCurrentUser(null);
        }
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const login = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const logout = async () => {
    try {
      if (localStorage.getItem("token")) {
        await apiFetch("/auth/logout", { method: "POST" });
      }
    } catch (e) {
      console.error("Logout API failed", e);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isCheckingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
