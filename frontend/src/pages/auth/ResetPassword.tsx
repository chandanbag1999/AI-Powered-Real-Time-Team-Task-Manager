import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import apiClient from "@/utils/apiClient";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      return toast.error("All fields are required");
    }
    
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    
    try {
      setLoading(true);
      const response = await apiClient.post(`/auth/reset-password/${token}`, { 
        password 
      });
      toast.success(response.data.message || "Password reset successful");
      setResetComplete(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Create New Password</h2>
          <p className="text-slate-500 mt-1">
            {resetComplete 
              ? "Your password has been reset successfully" 
              : "Enter your new password below"}
          </p>
        </div>
        
        {!resetComplete ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                New Password
              </label>
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full"
                autoComplete="new-password"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm New Password
              </label>
              <Input 
                id="confirmPassword"
                type="password" 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                className="w-full"
                autoComplete="new-password"
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full py-2">
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-slate-600 mb-4">
              Your password has been reset successfully. You will be redirected to the login page.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/login">Back to Login</Link>
            </Button>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Remember your password?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 