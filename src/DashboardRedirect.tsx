import { Navigate } from "react-router-dom";
import { getUser } from "./auth";

const DashboardRedirect = () => {
  const user = getUser();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role.name) {
    case "Admin":
      return <Navigate to="/admin" replace />;
    case "hr":
      return <Navigate to="/hr" replace />;
    default:
      return <Navigate to="/bd" replace />;
  }
};

export default DashboardRedirect;
