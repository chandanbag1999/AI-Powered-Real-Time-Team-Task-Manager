import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import apiClient from "@/utils/apiClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return toast.error("Email is required");
    }
    
    try {
      setLoading(true);
      console.log("Sending forgot password request for:", email);
      const response = await apiClient.post("/auth/forgot-password", { email });
      console.log("Forgot password response:", response.data);
      
      // Even if user is not found, we show success message for security reasons
      toast.success("If your email exists in our system, you will receive reset instructions");
      setSubmitted(true);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      
      // For security reasons, we don't reveal if the email exists or not
      // We show a success message even if there was an error
      toast.success("If your email exists in our system, you will receive reset instructions");
      setSubmitted(true);
      
      // Log the actual error for debugging purposes
      if (process.env.NODE_ENV === 'development') {
        console.error("Actual error:", error.response?.data || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Reset Password</h2>
          <p className="text-slate-500 mt-1">
            {submitted 
              ? "Check your email for reset instructions" 
              : "Enter your email to receive a password reset link"}
          </p>
        </div>
        
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input 
                id="email"
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full"
                autoComplete="email"
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full py-2">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-slate-600 mb-4">
              If an account exists with this email, you'll receive instructions to reset your password.
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