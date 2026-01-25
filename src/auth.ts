import { jwtDecode } from "jwt-decode";
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
  console.log(decoded)
};

export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  localStorage.removeItem("permissions");
};

export const getToken = () => {
  // console.log(localStorage.getItem("access_token"))
  return localStorage.getItem("access_token");
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!getToken();
};
