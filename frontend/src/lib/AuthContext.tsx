"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getApiUrl } from "./api";

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
};

type AuthContextType = {
  token: string | null;
  usuario: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "siar_token";

function setCookie(value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie() {
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      setCookie(stored);
      fetch(getApiUrl("/api/auth/me"), {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setUsuario(data);
          else { localStorage.removeItem(TOKEN_KEY); removeCookie(); }
        })
        .catch(() => { localStorage.removeItem(TOKEN_KEY); removeCookie(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const form = new FormData();
    form.append("email", email);
    form.append("password", password);
    const res = await fetch(getApiUrl("/api/auth/login"), { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Error de conexion" }));
      throw new Error(err.detail || "Error al iniciar sesion");
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setCookie(data.access_token);
    setToken(data.access_token);
    setUsuario(data.usuario);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    removeCookie();
    setToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
