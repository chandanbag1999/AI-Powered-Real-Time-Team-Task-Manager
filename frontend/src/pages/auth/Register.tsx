import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { registerUser } from "@/features/auth/authSlice";
import { useState, useEffect } from "react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, user, isInitialized } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) return toast.error("All fields are required");

    const result = await dispatch(registerUser({ name, email, password }));

    if (registerUser.fulfilled.match(result)) {
      toast.success("Account created! Please login.");
      navigate("/dashboard");
    } else {
      toast.error(result.payload as string);
    }
  };

  useEffect(() => {
    // Only redirect if authentication has been initialized and user exists
    if (isInitialized && user) {
      console.log("User is already logged in, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [user, navigate, isInitialized]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Create Account</h2>
          <p className="text-slate-500 mt-1">Join TaskMate to manage tasks smarter</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <Input 
              id="name"
              type="text" 
              placeholder="John Doe" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full"
              autoComplete="name"
            />
          </div>
          
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
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <PasswordInput 
              id="password"
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full"
              autoComplete="new-password"
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full py-2">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
