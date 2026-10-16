import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Lets only admins through; everyone else goes back to the dashboard.
export default function AdminRoute() {
  const { session } = useAuth();
  if (session?.role !== "ROLE_ADMIN") {
    return <Navigate to="/business-dashboard" replace />;
  }
  return <Outlet />;
}
