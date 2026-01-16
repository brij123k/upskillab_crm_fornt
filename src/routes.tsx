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

// HR Pages
import { HRDashboard } from "@/pages/hr/HRDashboard";
import { EmployeesPage } from "@/pages/hr/EmployeesPage";

// BD Pages
import { BDDashboard } from "@/pages/bd/BDDashboard";
import { LeadsPage } from "@/pages/bd/LeadsPage";
import ProtectedRoute from "@/ProtectedRoute";
import DashboardRedirect from "@/DashboardRedirect";
import { VerifyOTP } from "@/pages/VerifyOTP";
import { ResetPassword } from "@/pages/ResetPassword";

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


        {/* Admin Panel */}
        <Route path="/admin" element={ 
            <ProtectedRoute>
                 <RoleProtectedRoute allowedRoles={["admin"]}>
                <PanelLayout panel="admin" />
                </RoleProtectedRoute>
                </ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="departments" element={<PlaceholderPage title="Departments & Hierarchy" />} />
          <Route path="leads" element={<PlaceholderPage title="Leads & Data Control" />} />
          <Route path="finance" element={<PlaceholderPage title="Finance" />} />
          <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
          <Route path="security" element={<PlaceholderPage title="Security & Audit" />} />
          <Route path="settings" element={<PlaceholderPage title="System Settings" />} />
        </Route>

        {/* HR Panel */}
        <Route path="/hr" element={
            <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["hr"]}>
                    <PanelLayout panel="hr" />
                    </RoleProtectedRoute>
                    </ProtectedRoute>
                }>
          <Route index element={<HRDashboard />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="attendance" element={<PlaceholderPage title="Attendance" />} />
          <Route path="performance" element={<PlaceholderPage title="Performance" />} />
          <Route path="warnings" element={<PlaceholderPage title="Warnings & PIP" />} />
          <Route path="announcements" element={<PlaceholderPage title="Announcements" />} />
          <Route path="reports" element={<PlaceholderPage title="HR Reports" />} />
          <Route path="exit" element={<PlaceholderPage title="Exit Management" />} />
        </Route>

        {/* BD Panel */}
        <Route path="/bd" element={
            <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["bd"]}>
                <PanelLayout panel="bd" />
                </RoleProtectedRoute>
                </ProtectedRoute>}>

          <Route index element={<BDDashboard />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="tasks" element={<PlaceholderPage title="Tasks & Follow-ups" />} />
          <Route path="calls" element={<PlaceholderPage title="Calls" />} />
          <Route path="meetings" element={<PlaceholderPage title="Meetings" />} />
          <Route path="payments" element={<PlaceholderPage title="Payments" />} />
          <Route path="reports" element={<PlaceholderPage title="BD Reports" />} />
          <Route path="settings" element={<PlaceholderPage title="BD Settings" />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
