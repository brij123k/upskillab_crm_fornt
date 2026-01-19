export const setAuth = (data: any) => {
  // console.log(data)
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
};

export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
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
