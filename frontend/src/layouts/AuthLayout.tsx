import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="container mx-auto p-4 md:p-6">
        <Link to="/" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          TaskMate
        </Link>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <Outlet />
      </div>
      
      {/* Footer */}
      <footer className="container mx-auto p-4 md:p-6 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} TaskMate. All rights reserved.</p>
      </footer>
    </div>
  )
}