import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useStore';
import { logout } from '@/features/auth/authSlice';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Activity,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminLayout = () => {
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Navigation items for the sidebar
  const navItems = [
    { 
      path: '/admin', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      path: '/admin/users', 
      label: 'Users', 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      path: '/admin/projects', 
      label: 'Projects', 
      icon: <FolderKanban className="h-5 w-5" /> 
    },
    { 
      path: '/admin/system', 
      label: 'System Health', 
      icon: <Activity className="h-5 w-5" /> 
    },
    { 
      path: '/admin/settings', 
      label: 'Settings', 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-800 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <button 
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                      isActive 
                        ? 'bg-slate-700 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                  end={item.path === '/admin'}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center">
            <button 
              className="lg:hidden mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold text-slate-800">Admin Dashboard</h2>
          </div>

          <div className="flex items-center relative">
            <button 
              className="flex items-center gap-2"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-sm font-medium text-slate-600">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden md:inline">{user?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    navigate('/dashboard');
                    setUserMenuOpen(false);
                  }}
                >
                  User Dashboard
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    handleLogout();
                    setUserMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 