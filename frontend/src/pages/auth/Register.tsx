import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="w-full max-w-md p-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Register</h2>
      <Input type="text" placeholder="Name" className="mb-4" />
      <Input type="email" placeholder="Email" className="mb-4" />
      <Input type="password" placeholder="Password" className="mb-6" />
      <Button className="w-full mb-2">Register</Button>
      <p className="text-sm text-center">
        Already have an account?{" "}
        <Link to="/" className="text-blue-600 underline">
          Login
        </Link>
      </p>
    </div>
  );
}
