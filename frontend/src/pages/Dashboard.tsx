import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { fetchProjects, deleteProject } from "@/features/projects/projectsSlice";
import LogoutButton from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/ProjectCard";
import CreateProjectForm from "@/components/CreateProjectForm";
import NotesToTasksConverter from "@/components/NotesToTasksConverter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import MaintenanceModeBanner from "@/components/MaintenanceModeBanner";
import apiClient from "@/utils/apiClient";

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { projects, loading, error, deletingIds } = useAppSelector((state) => state.projects);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      await dispatch(fetchProjects()).unwrap();
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }, [dispatch]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Fetch maintenance mode status
  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const response = await apiClient.get('/system/maintenance');
        if (response.data) {
          setMaintenanceMode(response.data.maintenanceMode || false);
        }
      } catch (error) {
        console.error('Failed to fetch maintenance mode status:', error);
      }
    };

    fetchMaintenanceStatus();
  }, []);

  const handleDeleteProject = async (id: string) => {
    try {
      await dispatch(deleteProject(id)).unwrap();
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadProjects();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Maintenance Mode Banner */}
      {maintenanceMode && <MaintenanceModeBanner isAdmin={false} />}
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">TaskMate</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden md:inline">
              Welcome, {user?.name || "User"}
            </span>
            {user?.role === "admin" && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">Admin Dashboard</Link>
              </Button>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
            </TabsList>
            
            {activeTab === "projects" && (
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                size="sm"
              >
                {showCreateForm ? "Cancel" : "New Project"}
              </Button>
            )}
          </div>
          
          <TabsContent value="projects">
            {showCreateForm && (
              <div className="mb-8">
                <CreateProjectForm 
                  onSuccess={handleCreateSuccess} 
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            )}

            {loading && (
              <div className="text-center py-10">
                <p className="text-slate-600">Loading projects...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {!loading && !error && projects.length === 0 && !showCreateForm && (
              <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-600 mb-4">No projects found</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Create your first project
                </Button>
              </div>
            )}

            {/* Projects Grid */}
            {!loading && !error && projects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard 
                    key={project.id || project._id || `temp-${Math.random()}`}
                    project={project}
                    onDelete={handleDeleteProject}
                    isDeleting={deletingIds.includes(project.id || project._id || '')}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ai-tools">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notes to Tasks */}
              <div className="lg:col-span-2">
                {projects.length > 0 ? (
                  <NotesToTasksConverter 
                    projectId={projects[0]?.id || projects[0]?._id || ''}
                    onTasksCreated={loadProjects}
                  />
                ) : (
                  <div className="bg-white p-6 rounded-lg border border-slate-200 text-center">
                    <p className="text-slate-600 mb-4">You need to create a project first to use AI tools</p>
                    <Button onClick={() => {
                      setActiveTab("projects");
                      setShowCreateForm(true);
                    }}>
                      Create a project
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Other AI tools can be added here */}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard; 