const url = "http://localhost:3000"
// const url = "https://crm.upskillab.in"
const ApiConfig = {
  url,
  login:`${url}/users/login`,
  logout:`${url}/users/Logout`,
  forgetPassword:`${url}/users/forget-password`,
  varify_otp:`${url}/users/verify-otp`,
  reset_password:`${url}/users/reset-password`,

  getAllUser:`${url}/users`,
  getAllProfile:`${url}/users/profile`,
  getUserByDepartmentId:(departmentId:string)=>`${url}/profiles/department/${departmentId}`,
  getUserBydepId:(depId:string)=>`${url}/users/${depId}`,
  getAllRoles:`${url}/roles`,
  getAllDepartments:`${url}/departments`,
  getAllStages:`${url}/lead-stages`,
  getAllPools:`${url}/pool`,
  addNewEmp:`${url}/users/register`,
  updateUser:(userId:string)=>`${url}/users/user/${userId}`,
  addNewRole:`${url}/roles`,
  addNewDepartments:`${url}/departments`,
  addNewPool:`${url}/pool`,
  addNewStage:`${url}/lead-stages`,
  updateStage:(id:string)=>`${url}/lead-stages/${id}`,
  updatePool:(id:string)=>`${url}/pool/${id}`,
  updateDepartments:(departmentId:string)=>`${url}/departments/${departmentId}`,
  updateRole:(roleId:string)=>`${url}/roles/${roleId}`,
  updateStatus:(id:string)=>`${url}/users/${id}/status`,
  togglePoolActive:(id:string)=>`${url}/pool/toggle/${id}`,
  blockUser:(id:string)=>`${url}/users/${id}/toggle-block`,
  profileGen:(id:string)=>`${url}/users/${id}/toggle-dashboard`,
  getAllLeads:`${url}/leads`,
  createNewLead:`${url}/leads`,
  updateLead:(leadid:string)=>`${url}/leads/${leadid}`,
  changeStatusLead:(leadid:string)=>`${url}/leads/${leadid}/status`,
  changeStageLead:(leadid:string)=>`${url}/leads/${leadid}/stage`,
  leadHistory:(leadid:string)=>`${url}/lead-history/${leadid}`,
  assignLead:`${url}/leads/lead/assign`,
  assignLeadToDepartment:`${url}/leads/lead/assign-department`,
  leaddoublicateFinder:`${url}/leads/leaddoublicate/duplicates`,
  leadmerge:`${url}/leads/leaddoublicate/merge`,

  CallLog:`${url}/call-logs/users`,

  MeetingLog:`${url}/meeting-logs`,
  getMeetingLog:`${url}/meeting-logs/with-feedbacks`,
  addMettingFeedback:`${url}/meeting-logs/feeback`,
  instantnotify:(leadId:number)=>`${url}/lead-schedules/${leadId}`,

  getcallLogReview:(callId:string)=> `${url}/call-logs/callLogReview/${callId}`,
  // notifications

  notification:`${url}/notifications`,
  notificationUnreadCount:`${url}/notifications/unread-count`,
  readNotification:(id)=>`${url}/notifications/${id}/read`,
  readAllNotification:`${url}/notifications/read-all`

  // uploadFiles: `${url}/file`,
  // categoryByCode: (code:string) => `${url}/category/code/${code}`,
};

export default ApiConfig;
