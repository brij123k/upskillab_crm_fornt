// const url = "http://localhost:3000"
const url = "https://crm.upskillab.in"
const ApiConfig = {
  url,
  login:`${url}/users/login`,
  logout:`${url}/users/Logout`,
  forgetPassword:`${url}/users/forget-password`,
  varify_otp:`${url}/users/verify-otp`,
  reset_password:`${url}/users/reset-password`,


  userStats:`${url}/lead-stats`,
  uploadImage: `${url}/profile-upload/image`,
  getAllUser:`${url}/users`,
  getAllProfile:`${url}/users/profile`,
  getMySeniors:`${url}/users/seniors/me`,
  getUserSeniors:(userId:string)=>`${url}/users/seniors/${userId}`,
  getLastActivities:`${url}/users/last-activities`,
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
  poolChange:`${url}/leads/pool/assign`,
  assignLeadToDepartment:`${url}/leads/lead/assign-department`,
  leaddoublicateFinder:`${url}/leads/leaddoublicate/duplicates`,
  leadmerge:`${url}/leads/leaddoublicate/merge`,

  getAllLevels: `${url}/level`,       // GET all levels
addNewLevel: `${url}/level`,  
  levelUpdate:(levelId:string)=>`${url}/level/${levelId}`,
  CallLog:`${url}/call-logs/users`,
  LeadInteractionLog:`${url}/interaction-logs/users`,
  createInteractionLog:`${url}/interaction-logs`,
  getLeadSchedules:`${url}/lead-schedules`,

  MeetingLog:`${url}/meeting-logs`,
  getMeetingLog:`${url}/meeting-logs/with-feedbacks`,
  addMettingFeedback:`${url}/meeting-logs/feeback`,
  instantnotify:(leadId:number)=>`${url}/lead-schedules/${leadId}`,

  getcallLogReview:(callId:string)=> `${url}/call-logs/callLogReview/${callId}`,
  // notifications

  getFollowUp:`${url}/lead-schedules`,
  markFollowUp:(scheduleId:string)=>`${url}/lead-schedules/${scheduleId}/complete`,
  
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
  leadPaymentLink:`${url}/payment/leadPayment-link`,
  getPaymentHistory:`${url}/payment`,
  getPaymentbyOrderId:(orderId:string)=>`${url}/payment/by-order-id/${orderId}`,
  createSubscription:`${url}/subscription/create`,
  getSubscriptionByOrderId:(orderId:string)=>`${url}/subscription/${orderId}`,
  getLoanHistory:`${url}/order/loan/loan-emi`,
  sendLoanReminder:(emiId:string)=>`${url}/order/loan/reminder/${emiId}`,
  updateLoanStatus:(emiId:string)=>`${url}/order/loan/loan-emi/${emiId}`,

  stageSummery:`${url}/leads/report/stage-summary`,
  allEmpStages:`${url}/leads/report/all-employees-stages`,
  stateWiseReport:`${url}/leads/report/state-wise`,
  stateWiseEmployeeReport:`${url}/leads/report/state-wise-employee`,
  poolWiseStages:`${url}/leads/report/pool-wise-data`,
  employeePoolRevenueReport:`${url}/order/report/employee-pool-revenue`,
  employeePoolUtilizationReport:`${url}/order/report/employee-pool-utilization`,
  employeeStageleads:`${url}/order/report/employee-stage-leads`,
  consultantPerforment:`${url}/order/report/consultant-performance`,
  employeePoolDailyUtilizationReport:`${url}/call-logs/report/employee-pool-daily-utilization`,
  employeeSalarySheetReport:`${url}/attendance/report/salary-sheet`,
  getTargetReport:`${url}/targets/report`,
  getRevenueTargetReport:`${url}/targets/revenue-report`,
  userActivitySummary:`${url}/reports/user-activity-summary`,
  getTargetMy:`${url}/targets/me`,
  getTargetCompareMy:`${url}/targets/compare/me`,
  getTargetByUser:(userId:string)=>`${url}/targets/user/${userId}`,
  createTarget:`${url}/targets`,
  createTargetsBulk:`${url}/targets/bulk`,
  copyTargets:`${url}/targets/copy`,
  updateTarget:(id:string)=>`${url}/targets/${id}`,
  sourcecampaignstagesummary:`${url}/leads/report/source-campaign-stage-summary`,
  sourcecampaignwiseleadrevenue:`${url}/order/report/source-campaign-wise-lead-revenue`,
  sourceCampaignWiseLeadRevenueReport:`${url}/order/report/source-campaign-wise-lead-revenue`,
  getSourceCampaigns:`${url}/source-campaigns`,
  createSourceCampaign:`${url}/source-campaigns`,
  getSourceCampaignById:(id:string)=>`${url}/source-campaigns/${id}`,
  updateSourceCampaign:(id:string)=>`${url}/source-campaigns/${id}`,
  toggleSourceCampaign:(id:string)=>`${url}/source-campaigns/${id}/toggle`,
  
  getSourceCampaignComparisonReport:`${url}/source-campaigns/report/comparison`,
  getPublicSourceCampaign:(id:string)=>`${url}/source-campaigns/public/${id}`,
  submitPublicSourceLead:(id:string)=>`${url}/source-campaigns/public/${id}/lead`,

  // IVR section
  getMynumbers:`${url}/IVR/myNumbers`,
  createIVRUser:`${url}/users/IVR`,
  callToLead:`${url}/IVR/click-to-call`,
  updateCallLog:`${url}/IVR/submit-call-log`,


  // HR work
  getUserLogs:`${url}/user-logs`,
  getUserLogsByUserId:(userId:string)=>`${url}/user-logs/user/${userId}`, 
  getUserActivity:(userId:string)=>`${url}/user-activities/user/${userId}`,
  createTask:`${url}/tasks`,
  getTasks:`${url}/tasks`,
  getMyTasks:`${url}/tasks/me`,
  getMyTaskById:(taskId:string)=>`${url}/tasks/me/${taskId}`,
  getTaskById:(taskId:string)=>`${url}/tasks/${taskId}`,
  updateTask:(taskId:string)=>`${url}/tasks/${taskId}`,
  updateTaskStatus:(taskId:string)=>`${url}/tasks/${taskId}/status`,
  updateMyTaskStatus:(taskId:string)=>`${url}/tasks/me/${taskId}/status`,
  deleteTask:(taskId:string)=>`${url}/tasks/${taskId}`,

  // announcement
  createAnnouncement:`${url}/announcements`,
  getAnnouncements:`${url}/announcements`,
  getMyAnnouncements:`${url}/announcements/me`,
  getMyAnnouncementById:(announcementId:string)=>`${url}/announcements/me/${announcementId}`,
  getAnnouncementsByUserId:(userId:string)=>`${url}/announcements/user/${userId}`,
  getAnnouncementById:(announcementId:string)=>`${url}/announcements/${announcementId}`,
  deleteAnnouncement:(announcementId:string)=>`${url}/announcements/${announcementId}`,

  // performance-warnings
  createWarning:`${url}/performance-warnings`,
  getWarnings:`${url}/performance-warnings`,
  getMyWarnings:`${url}/performance-warnings/bd/me`,
  getMyWarningById:(warningId:string)=>`${url}/performance-warnings/me/${warningId}`,
  getWarningById:(warningId:string)=>`${url}/performance-warnings/${warningId}`,
  updateWarning:(warningId:string)=>`${url}/performance-warnings/${warningId}`,

  // KRA
  getKRA:`${url}/kra`,
  getKRAByRole:(roleId:string)=>`${url}/kra/role/${roleId}`,
  getKRACompare:(userId:string, roleId?: string, date?: string) => {
    const params = new URLSearchParams();
    params.set('userId', userId);
    if (roleId) params.set('roleId', roleId);
    if (date) params.set('date', date);
    return `${url}/kra/compare?${params.toString()}`;
  },
  upsertKRA:`${url}/kra`,
  updateKRA:(kraId:string)=>`${url}/kra/${kraId}`,
  deleteKRA:(kraId:string)=>`${url}/kra/${kraId}`,

  // leave
  createLeave:`${url}/leaves`,
  getLeaves:`${url}/leaves/me`,
  leavePolicies:`${url}/leaves/policies`,
  getLeavePolicyByRole:(roleId:string)=>`${url}/leaves/policies/role/${roleId}`,
  leavePolicyById:(policyId:string)=>`${url}/leaves/policies/${policyId}`,
  
  getMyLeaveSummary:`${url}/leave-balances/me/summary`,
  getMyLeaves:`${url}/leave-balances/me`,
  myLeavesbalHistory:`${url}/leave-balances/me/history`,
  
  getMyLeaveById:(leaveId:string)=>`${url}/leaves/me/${leaveId}`,
  updateMyLeave:(leaveId:string)=>`${url}/leaves/me/${leaveId}`,
  cancelMyLeave:(leaveId:string)=>`${url}/leaves/me/${leaveId}/cancel`,
  getLeaveRequests:`${url}/leaves/requests`,
  getLeaveRequestById:(leaveId:string)=>`${url}/leaves/requests/${leaveId}`,
  decideLeave:(leaveId:string)=>`${url}/leaves/${leaveId}/decision`,

  // PCAT
  getOngoingPcatExam:'https://api.upskillab.com/pcat/exams/ongoing/exam',
  registerPcatUser:'https://api.upskillab.com/pcat-users/register',
  registerPcatBackend:(leadId:number|string)=>`${url}/leads/${leadId}/pcat-register`,

  // attendance
  markAttendance:`${url}/attendance/mark`,
  getAttendance:`${url}/attendance`,
  getAttendanceByUserId:(userId:string)=>`${url}/attendance/user/${userId}`,
  getAttendanceByDate:(date:string)=>`${url}/attendance/date/${date}`,


  bulkStageChange: `${url}/leads/bulkStage/change`,


  // Whatsapp part

  bulkWhatsappSend: `${url}/campaigns/bulk-whatsapp`,
  getWhatsappTemplates: `${url}/whatsapp/templates`,
  getCompaignlogs:(compaignId:any)=>`${url}/campaigns/${compaignId}/logs`,
  getCompaigns:`${url}/campaigns`,
};

export default ApiConfig;
