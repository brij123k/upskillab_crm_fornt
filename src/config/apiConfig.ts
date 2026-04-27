// const url = "http://localhost:3000"
const url = "https://crm.upskillab.in"
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
  readAllNotification:`${url}/notifications/read-all`,


  // order management
  Order:`${url}/order`,
  getOrderById:(orderId:string)=>`${url}/order/${orderId}`,
  updateOrder:(orderId:string)=>`${url}/order/${orderId}`,
  toggleOrder:(orderId:string)=>`${url}/order/approve/${orderId}`,

  getLoanPartners:`${url}/loan-partner`,
  createLoanPartners:`${url}/loan-partner`,
  updateLoanPartners:(loanPartnerId:string)=>`${url}/loan-partner/${loanPartnerId}`,
  toggleLoanPartners:(loanPartnerId:string)=>`${url}/loan-partner/toggle/${loanPartnerId}`,
  createPaymentLink:`${url}/payment/create-link`,
  getPaymentHistory:`${url}/payment`,
  getPaymentbyOrderId:(orderId:string)=>`${url}/payment/by-order-id/${orderId}`,
  createSubscription:`${url}/subscription/create`,
  getSubscriptionByOrderId:(orderId:string)=>`${url}/subscription/${orderId}`,
  getLoanHistory:`${url}/order/loan/loan-emi`,
  sendLoanReminder:(emiId:string)=>`${url}/order/loan/reminder/${emiId}`,
  updateLoanStatus:(emiId:string)=>`${url}/order/loan/loan-emi/${emiId}`,

  stageSummery:`${url}/leads/report/stage-summary`,
  allEmpStages:`${url}/leads/report/all-employees-stages`,
  poolWiseStages:`${url}/leads/report/pool-wise-data`,
  employeePoolRevenueReport:`${url}/order/report/employee-pool-revenue`,
  employeePoolUtilizationReport:`${url}/order/report/employee-pool-utilization`,
  consultantPerforment:`${url}/order/report/consultant-performance`,
  employeePoolDailyUtilizationReport:`${url}/call-logs/report/employee-pool-daily-utilization`,
  
  sourceCampaignWiseLeadRevenueReport:`${url}/order/report/source-campaign-wise-lead-revenue`,

  // IVR section
  getMynumbers:`${url}/IVR/myNumbers`,
  createIVRUser:`${url}/users/IVR`,
  callToLead:`${url}/IVR/click-to-call`,
  updateCallLog:`${url}/IVR/submit-call-log`,

};

export default ApiConfig;
