"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    access_token: null,
    userId: null,
    loggedIn: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const access_token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    if (access_token && userId) {
      setAuth({
        access_token,
        userId,
        loggedIn: true,
      });
    }

    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");

    setAuth({
      access_token: null,
      userId: null,
      loggedIn: false,
    });
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
