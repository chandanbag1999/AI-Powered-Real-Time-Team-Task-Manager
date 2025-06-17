import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Navigation */}
      <header className="container mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold text-primary">TaskMate</div>
          {/* Mobile navigation */}
          <nav className="flex md:hidden space-x-2">
            <Button size="sm" variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Register</Link>
            </Button>
          </nav>
          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Register</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col md:flex-row container mx-auto px-4 py-6 md:p-6 items-center">
        <div className="flex-1 flex flex-col justify-center space-y-4 md:space-y-6 text-center md:text-left md:pr-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
            <span className="text-primary">TaskMate</span> — Manage Tasks Smarter
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto md:mx-0">
            AI-powered, real-time task manager built to make teams faster and projects smarter.
          </p>
          <div className="flex flex-row justify-center md:justify-start gap-3 md:gap-4 pt-2 md:pt-4">
            <Button size="lg" className="px-6 shadow-md hover:shadow-lg transition-shadow" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="px-6" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="flex-1 mt-8 md:mt-0 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm md:max-w-md aspect-square overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <img 
              src="https://placehold.co/600x600/e2e8f0/64748b?text=TaskMate" 
              alt="TaskMate illustration" 
              className="rounded-lg object-cover w-full h-full hover:scale-105 transition-transform duration-300"
              width={600}
              height={600}
            />
          </div>
        </div>
      </main>

      {/* Features Section (Simple) */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-primary text-2xl mb-3">🤖</div>
            <h3 className="font-semibold text-lg mb-2">AI-Powered</h3>
            <p className="text-slate-600">Let AI help prioritize and organize your tasks efficiently.</p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-primary text-2xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Real-Time Updates</h3>
            <p className="text-slate-600">See changes instantly as your team collaborates on projects.</p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-primary text-2xl mb-3">🔍</div>
            <h3 className="font-semibold text-lg mb-2">Smart Organization</h3>
            <p className="text-slate-600">Keep everything organized with intelligent task management.</p>
          </div>
        </div>
      </section>

      {/* Footer - Keeping it simple as requested */}
      <footer className="container mx-auto p-4 md:p-6 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} TaskMate. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;