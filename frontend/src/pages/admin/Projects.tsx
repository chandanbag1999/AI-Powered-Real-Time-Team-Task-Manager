import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import apiClient from '@/utils/apiClient';
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  Users,
  Clock,
  Filter,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectUser {
  _id: string;
  name: string;
  email: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  createdAt: string;
  createdBy: ProjectUser;
  members?: ProjectUser[];
  taskCount?: number;
  completedTaskCount?: number;
  lastActivity?: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface ProjectsResponse {
  projects: Project[];
  pagination: Pagination;
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchProjects = async (page = 1, search = searchQuery, status = statusFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<ProjectsResponse>('/admin/projects', {
        params: {
          page,
          limit: 10,
          search,
          status: status !== 'all' ? status : undefined
        }
      });
      
      setProjects(response.data.projects);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects');
      toast.error('Failed to load projects');
      
      // Set empty projects on error
      setProjects([]);
      setPagination({
        total: 0,
        page: 1,
        pages: 1,
        limit: 10
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects(1, searchQuery, statusFilter);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchProjects(1, searchQuery, status);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchProjects(newPage, searchQuery, statusFilter);
  };

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'on-hold':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const calculateCompletionPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Project Management</h1>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Project Management</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-medium">Error loading projects</p>
          <p>{error}</p>
          <Button onClick={() => fetchProjects()} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Project Management</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchProjects(pagination.page, searchQuery, statusFilter)} 
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <Input
                placeholder="Search by project name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" className="flex items-center gap-1">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Button>
            </form>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <div className="flex gap-1">
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleStatusFilterChange('all')}
                >
                  All
                </Button>
                <Button 
                  variant={statusFilter === 'active' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleStatusFilterChange('active')}
                  className={statusFilter === 'active' ? '' : 'text-green-700'}
                >
                  Active
                </Button>
                <Button 
                  variant={statusFilter === 'on-hold' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleStatusFilterChange('on-hold')}
                  className={statusFilter === 'on-hold' ? '' : 'text-amber-700'}
                >
                  On Hold
                </Button>
                <Button 
                  variant={statusFilter === 'completed' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleStatusFilterChange('completed')}
                  className={statusFilter === 'completed' ? '' : 'text-blue-700'}
                >
                  Completed
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No projects found
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div 
                  key={project._id} 
                  className="bg-white border border-slate-200 rounded-md p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-lg">{project.name}</h3>
                        <Badge variant="outline" className={`${getStatusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-sm line-clamp-2">
                        {project.description || "No description"}
                      </p>
                      
                      {project.taskCount !== undefined && (
                        <div className="mt-3">
                          <div className="flex justify-between mb-1 text-xs">
                            <span>Progress</span>
                            <span>{project.completedTaskCount} of {project.taskCount} tasks completed</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ 
                                width: `${calculateCompletionPercentage(
                                  project.completedTaskCount || 0, 
                                  project.taskCount || 0
                                )}%` 
                              }} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Created: {formatDate(project.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        <span>Owner: {project.createdBy?.name || "Unknown"}</span>
                      </div>
                      
                      {project.members && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Users className="h-3.5 w-3.5" />
                          <span>Members: {project.members.length}</span>
                        </div>
                      )}
                      
                      {project.lastActivity && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Last activity: {formatDate(project.lastActivity)}</span>
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => openProjectDetails(project)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-slate-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} projects
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Details Modal */}
      {isDetailsModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsDetailsModalOpen(false)}
          ></div>
          <div className="relative z-10 bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{selectedProject.name}</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
                  <p className="text-sm">{selectedProject.description || "No description provided."}</p>
                </div>
                
                {selectedProject.taskCount !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-1">Progress</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1 text-xs">
                          <span>Tasks Completed</span>
                          <span>{calculateCompletionPercentage(
                            selectedProject.completedTaskCount || 0, 
                            selectedProject.taskCount || 0
                          )}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ 
                              width: `${calculateCompletionPercentage(
                                selectedProject.completedTaskCount || 0, 
                                selectedProject.taskCount || 0
                              )}%` 
                            }} 
                          />
                        </div>
                      </div>
                      <div className="text-sm">
                        {selectedProject.completedTaskCount} / {selectedProject.taskCount}
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedProject.members && selectedProject.members.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-1">Team Members</h4>
                    <div className="space-y-2">
                      {selectedProject.members.map(member => (
                        <div key={member._id} className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-slate-500 mb-3">Project Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <div className="text-sm font-medium">
                        <Badge variant="outline" className={`${getStatusColor(selectedProject.status)}`}>
                          {selectedProject.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-slate-500">Created by</p>
                      <p className="text-sm font-medium">{selectedProject.createdBy?.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-slate-500">Created on</p>
                      <p className="text-sm font-medium">{formatDate(selectedProject.createdAt)}</p>
                    </div>
                    
                    {selectedProject.lastActivity && (
                      <div>
                        <p className="text-xs text-slate-500">Last activity</p>
                        <p className="text-sm font-medium">{formatDate(selectedProject.lastActivity)}</p>
                      </div>
                    )}
                    
                    {selectedProject.members && (
                      <div>
                        <p className="text-xs text-slate-500">Team size</p>
                        <p className="text-sm font-medium">{selectedProject.members.length} members</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(`/project/${selectedProject._id}`, '_blank')}>
                    View Project Board
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage; 