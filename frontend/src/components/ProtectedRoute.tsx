import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/hooks/useStore";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isInitialized, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    console.log("ProtectedRoute - Current auth state:", { user, isInitialized, loading });
  }, [user, isInitialized, loading]);

  // Show loading spinner while checking authentication status
  if (!isInitialized || loading) {
    console.log("ProtectedRoute - Auth not initialized yet or loading, showing spinner...");
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log("ProtectedRoute - No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedRoute - User authenticated, rendering content");
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute; 