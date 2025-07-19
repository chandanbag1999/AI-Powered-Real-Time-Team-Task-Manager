import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Link } from "react-router-dom";
import { loginUser } from "@/features/auth/authSlice";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";

export default function Login() {
  const dispatch = useAppDispatch();
  const { loading, user, isInitialized } = useAppSelector(s => s.auth);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) return toast.error("All fields are required");

    console.log("Attempting login with:", { email });
    
    try {
      const result = await dispatch(loginUser({ email, password }));
      console.log("Login result:", result);

      if (loginUser.fulfilled.match(result)) {
        console.log("Login successful, user data:", result.payload);
        
        // Ensure we have the access token from the response payload
        if (result.meta.arg) {
          console.log("Login successful, redirecting to dashboard");
          toast.success("Login successfully!");
          navigate("/dashboard");
        }
      } else {
        console.error("Login failed:", result.payload);
        toast.error(result.payload as string);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An error occurred during login");
    }
  };

  useEffect(() => {
    // Only redirect if authentication has been initialized and user exists
    if (isInitialized && user) {
      console.log("User is logged in, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [user, navigate, isInitialized]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 mt-1">Sign in to your account</p>
        </div>
        
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
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput 
              id="password"
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full"
              autoComplete="current-password"
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full py-2">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
