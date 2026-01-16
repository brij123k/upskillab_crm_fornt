const url = "http://localhost:3000"
const ApiConfig = {
  url,
  login:`${url}/users/login`,
  forgetPassword:`${url}/users/forget-password`,
  varify_otp:`${url}/users/verify-otp`,
  reset_password:`${url}/users/reset-password`,

  // admin
  getAllUser:`${url}/users`,
  getAllRoles:`${url}/roles`,
  getAllDepartments:`${url}/departments`,
  addNewEmp:`${url}/users/register`,
  updateStatus:(id:string)=>`${url}/users/${id}/status`,
  blockUser:(id:string)=>`${url}/users/${id}/toggle-block`,
  profileGen:(id:string)=>`${url}/users/${id}/toggle-dashboard`,
  uploadFiles: `${url}/file`,
  categoryByCode: (code:string) => `${url}/category/code/${code}`,
};

export default ApiConfig;
