import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PanelLayout } from "@/components/layout/PanelLayout";
import RoleProtectedRoute from "@/RoleRoute"
// Public Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import NotFound from "@/pages/NotFound";

// Admin Pages
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { UsersPage } from "@/pages/admin/UsersPage";
// import { DepartmentsPage } from "@/pages/admin/DepartmentsPage";
import {LeadsPage} from "@/pages/admin/LeadsPage"
import { CallLogsPage as AdminCallLogsPage } from "@/pages/bd/CallLogsPage";
import { MeetingLogsPage as AdminMeetingLogsPage } from "@/pages/bd/MeetingLogsPage";
import { OrderManagementPage as AdminOrderManagementPage } from "@/pages/bd/OrderManagementPage";
import { PaymentHistoryPage as AdminPaymentHistoryPage } from "@/pages/bd/PaymentHistoryPage";

// BD Pages
import { BDDashboard } from "@/pages/bd/BDDashboard";
import { BDLeadsPage } from "@/pages/bd/LeadsPage";
import { BDUsersPage } from "@/pages/bd/UsersPage";
import { CallLogsPage } from "@/pages/bd/CallLogsPage";
import ProtectedRoute from "@/ProtectedRoute";
import DashboardRedirect from "@/DashboardRedirect";
import { VerifyOTP } from "@/pages/VerifyOTP";
import { ResetPassword } from "@/pages/ResetPassword";
import { MeetingLogsPage } from "./pages/bd/MeetingLogsPage";
import { OrderManagementPage } from "./pages/bd/OrderManagementPage";
import { PaymentHistoryPage } from "./pages/bd/PaymentHistoryPage";
import { LoanManagementPage } from "./pages/bd/LoanManagementPage";
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { CashfreeSubscriptionAuthPage } from "./pages/CashfreeSubscriptionAuthPage";
import { UserLogsPage } from "./pages/admin/UserLogsPage";
import { UserActivityPage } from "./components/modal/UserActivityModal";
import { TaskManagementPage } from "./pages/admin/TaskManagementPage";
import { HRAnnouncementPage } from "./pages/admin/HRAnnouncementPage";
import { PerformanceWarningPage } from "./pages/admin/PerformanceWarningPage";
import { AttendancePage } from "./pages/AttendancePage";
import { TaskManagementPagebd } from "./pages/bd/TaskManagementPagebd";
import { BDAnnouncementPage } from "./pages/bd/AnnouncementPage";
import { MyAnnouncementsPage } from "@/pages/announcements/MyAnnouncementsPage";
import { MyWarningsPage } from "@/pages/bd/MyWarningsPage";
import { MyTasksPage } from "@/pages/bd/MyTasksPage";
// Placeholder
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground">This page is under development</p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/cashfree/subscription-auth" element={<CashfreeSubscriptionAuthPage />} />
        


        {/* Admin Panel */}
        <Route path="/admin" element={ 
            <ProtectedRoute>
                 <RoleProtectedRoute allowedRoles={["Admin"]}>
                <PanelLayout panel="admin" />
                </RoleProtectedRoute>
                </ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="calls" element={<AdminCallLogsPage />} />
          <Route path="meetings" element={<AdminMeetingLogsPage />} />
          <Route path="orders" element={<AdminOrderManagementPage />} />
          <Route path="payments" element={<AdminPaymentHistoryPage />} />
          <Route path="subscriptions" element={<PlaceholderPage title="Subscriptions" />} />
          <Route path="finance" element={<PlaceholderPage title="Finance" />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="security" element={<PlaceholderPage title="Security & Audit" />} />
          <Route path="settings" element={<PlaceholderPage title="System Settings" />} />
          <Route path="user-logs" element={<UserLogsPage/>} />
          <Route path="user-activity/:userId" element={<UserActivityPage />} />
          <Route path="tasks" element={<TaskManagementPage />} />
          <Route path="announcements" element={<HRAnnouncementPage />} />
          <Route path="performance-warnings" element={<PerformanceWarningPage />} />
          <Route path="attendance/:userId" element={<AttendancePage />} />
        </Route>

        {/* HR Panel */}
       
          {/* <Route path="attendance" element={<PlaceholderPage title="Attendance" />} />
          <Route path="performance" element={<PlaceholderPage title="Performance" />} />
          <Route path="warnings" element={<PlaceholderPage title="Warnings & PIP" />} />
          <Route path="announcements" element={<PlaceholderPage title="Announcements" />} />
          <Route path="reports" element={<PlaceholderPage title="HR Reports" />} />
          <Route path="exit" element={<PlaceholderPage title="Exit Management" />} /> */}
        

        {/* BD Panel */}
        <Route path="/bd" element={
            <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["bd"]}>
                <PanelLayout panel="bd" />
                </RoleProtectedRoute>
                </ProtectedRoute>}>

          <Route index element={<BDDashboard />} />
          <Route path="users" element={<BDUsersPage />} />
          <Route path="leads" element={<BDLeadsPage />} />
          <Route path="calls" element={<CallLogsPage/>} />
          <Route path="meetings" element={<MeetingLogsPage />} />
          <Route path="orders" element={<OrderManagementPage />} />
          <Route path="payments" element={<PaymentHistoryPage />} />
          <Route path="loan-management" element={<LoanManagementPage />} />
          <Route path="subscriptions" element={<PlaceholderPage title="BD Subscriptions" />} />
          <Route path="tasks" element={<TaskManagementPagebd />} />
          <Route path="my-tasks" element={<MyTasksPage />} />
          <Route path="my-tasks/:taskId" element={<MyTasksPage />} />
          <Route path="announcements" element={<BDAnnouncementPage />} />
          <Route path="my-announcements" element={<MyAnnouncementsPage />} />
          <Route path="my-announcements/:announcementId" element={<MyAnnouncementsPage />} />
          <Route path="my-warnings" element={<MyWarningsPage />} />
          <Route path="my-warnings/:warningId" element={<MyWarningsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<PlaceholderPage title="BD Settings" />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
