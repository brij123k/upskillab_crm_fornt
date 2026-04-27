import { jwtDecode } from "jwt-decode";

export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const LOGIN_AT_KEY = "login_at";

type JwtPayload = {
  userId: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  isSuperAdmin: boolean;
  permissions: {
    module: string;
    actions: string[];
  }[];
  status: string;
  isDashboardEnabled: boolean;
  exp: number;
};

export const setAuth = (data: any) => {
   const token = data.access_token;
  const decoded = jwtDecode<JwtPayload>(token);
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem(
    "permissions",
    JSON.stringify(decoded.permissions || [])
  );
  localStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
  console.log(decoded)
};

export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  localStorage.removeItem("permissions");
  localStorage.removeItem(LOGIN_AT_KEY);
};

export const getToken = () => {
  // console.log(localStorage.getItem("access_token"))
  return localStorage.getItem("access_token");
};

export const getUser = () => {
  if (isSessionExpired()) {
    clearAuth();
    return null;
  }
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getLoginAt = () => {
  const loginAt = localStorage.getItem(LOGIN_AT_KEY);
  return loginAt ? Number(loginAt) : null;
};

export const isSessionExpired = () => {
  const token = getToken();
  if (!token) return false;

  const loginAt = getLoginAt();
  if (!loginAt) return false;
  console.log(Date.now(),loginAt,SESSION_DURATION_MS)
  console.log(Date.now() - loginAt >= SESSION_DURATION_MS)
  return Date.now() - loginAt >= SESSION_DURATION_MS;
};

export const isAuthenticated = () => {
  if (isSessionExpired()) {
    clearAuth();
    return false;
  }

  return !!getToken();
};
