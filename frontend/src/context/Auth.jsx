import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  const logout = () => {
    sessionStorage.removeItem("scholarship-token");
    setUser(null);
  };
  useEffect(() => {
    let alive = true;
    if (!sessionStorage.getItem("scholarship-token")) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => {
        if (alive) setUser(r.data);
      })
      .catch(() => {
        if (alive) logout();
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const id = api.interceptors.response.use(
      (r) => r,
      (e) => {
        if (e.response?.status === 401) logout();
        return Promise.reject(e);
      },
    );
    return () => api.interceptors.response.eject(id);
  }, []);
  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    sessionStorage.setItem("scholarship-token", data.accessToken);
    try {
      const profile = (await api.get("/auth/me")).data;
      setUser(profile);
      return profile;
    } catch (e) {
      logout();
      throw e;
    }
  }
  return (
    <Context.Provider value={{ user, loading, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
