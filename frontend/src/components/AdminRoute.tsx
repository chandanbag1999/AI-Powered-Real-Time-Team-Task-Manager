import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/hooks/useStore";
import { toast } from "sonner";

const AdminRoute = () => {
  const { user, isInitialized } = useAppSelector((state) => state.auth);

  // If authentication is still initializing, show nothing yet
  if (!isInitialized) {
    return null;
  }

  // Check if user exists and has admin role
  if (!user || user.role !== "admin") {
    toast.error("You don't have permission to access this area");
    return <Navigate to="/dashboard" replace />;
  }

  // User is an admin, render the child routes
  return <Outlet />;
};

export default AdminRoute; 