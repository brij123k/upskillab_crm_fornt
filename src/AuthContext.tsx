import React, { createContext, useContext, useState } from "react";
import { getUser, getToken, clearAuth } from "@/auth";
import { postDataHandlerWithToken } from "./config/services";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(getUser());
  const [token, setToken] = useState(getToken());

  const logout = async () => {
    await postDataHandlerWithToken('logout',null,false)
    clearAuth();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
