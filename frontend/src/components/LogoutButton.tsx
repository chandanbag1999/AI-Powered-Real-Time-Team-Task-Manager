import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useStore";
import { logout } from "@/features/auth/authSlice";
import { toast } from "sonner";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const LogoutButton = ({ 
  variant = "outline", 
  size = "default",
  className = ""
}: LogoutButtonProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleLogout}
      className={className}
    >
      Logout
    </Button>
  );
};

export default LogoutButton; 