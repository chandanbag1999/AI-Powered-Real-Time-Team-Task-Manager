import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import apiClient from '@/utils/apiClient';
import { Users, FolderKanban, CheckSquare, BarChart2, RefreshCw } from 'lucide-react';

// Define types for our dashboard data
interface DashboardStats {
  userCount: number;
  projectCount: number;
  taskCount: number;
  taskStatusData: {
    todo: number;
    'in-progress': number;
    completed: number;
  };
}

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface RecentProject {
  _id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentUsers: RecentUser[];
  recentProjects: RecentProject[];
}

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/admin/dashboard');
      setDashboardData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <p className="font-medium">Error loading dashboard data</p>
        <p>{error}</p>
        <Button onClick={fetchDashboardData} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDashboardData} 
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.stats.userCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered users in the system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.stats.projectCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Created projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.stats.taskCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Created tasks
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Task Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Task Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData && (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">To Do</span>
                      <span className="text-sm font-medium">
                        {dashboardData.stats.taskStatusData.todo}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ 
                          width: `${dashboardData.stats.taskCount ? 
                            (dashboardData.stats.taskStatusData.todo / dashboardData.stats.taskCount) * 100 : 0}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">In Progress</span>
                      <span className="text-sm font-medium">
                        {dashboardData.stats.taskStatusData['in-progress']}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ 
                          width: `${dashboardData.stats.taskCount ? 
                            (dashboardData.stats.taskStatusData['in-progress'] / dashboardData.stats.taskCount) * 100 : 0}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Completed</span>
                      <span className="text-sm font-medium">
                        {dashboardData.stats.taskStatusData.completed}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ 
                          width: `${dashboardData.stats.taskCount ? 
                            (dashboardData.stats.taskStatusData.completed / dashboardData.stats.taskCount) * 100 : 0}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Data */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentUsers.map((user) => (
                <div 
                  key={user._id} 
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              
              {(!dashboardData?.recentUsers || dashboardData.recentUsers.length === 0) && (
                <p className="text-center text-slate-500 py-4">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentProjects.map((project) => (
                <div 
                  key={project._id} 
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-slate-500 line-clamp-1">
                      {project.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-700' : 
                      project.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {project.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(project.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              
              {(!dashboardData?.recentProjects || dashboardData.recentProjects.length === 0) && (
                <p className="text-center text-slate-500 py-4">No projects found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
