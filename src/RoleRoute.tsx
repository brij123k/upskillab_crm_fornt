import { Navigate } from "react-router-dom";
import { getUser } from "@/auth";

interface Props {
  allowedRoles: string[];
  children: JSX.Element;
}

const RoleProtectedRoute = ({ allowedRoles, children }: Props) => {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.name;
  // console.log(userRole,!allowedRoles.includes(userRole))
  if (!allowedRoles.includes(userRole)) {
    // 🔥 redirect to THEIR dashboard
    switch (userRole) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "hr":
        return <Navigate to="/hr" replace />;
      default:
        return <Navigate to="/bd" replace />;
    }
  }

  return children;
};

export default RoleProtectedRoute;
