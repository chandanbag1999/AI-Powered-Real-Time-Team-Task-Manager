import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import apiClient from "@/utils/apiClient";
import taskService from "@/utils/taskService";
import socketService from "@/utils/socketService";
import { ArrowLeft, Plus, Filter, SortAsc, Search, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  DndContext, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  rectIntersection,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent, DropAnimation } from "@dnd-kit/core";
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";

import TaskCard from "@/components/TaskCard";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import DroppableColumn from "@/components/DroppableColumn";
import EditProjectDialog from "@/components/EditProjectDialog";
import SocketStatus from "@/components/SocketStatus";
import MaintenanceModeBanner from "@/components/MaintenanceModeBanner";
import type { Project, Task } from "../types";
import aiService from "@/utils/aiService";

// Define a search filter interface to fix type errors
interface SearchFilter {
  title?: string;
  priority?: string;
  status?: string;
}

const TaskBoard = () => {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project>({ 
    name: "", 
    description: "", 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: "",
    members: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter | null>(null);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

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

  // DnD sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const tasksData = await taskService.getTasks(projectId);
      // Ensure no duplicate tasks by filtering unique IDs
      const uniqueTasks = tasksData.filter((task, index, self) => 
        index === self.findIndex(t => t._id === task._id)
      );
      setTasks(uniqueTasks);
    } catch (err: unknown) {
      console.error("Error fetching tasks:", err);
      toast.error("Failed to load tasks");
    }
  }, [projectId]);

  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      try {
        setLoading(true);
        
        // Fetch project details
        const projectResponse = await apiClient.get(`/projects/${projectId}`);
        setProject(projectResponse.data);
        
        // Fetch tasks for this project
        await fetchTasks();
        setError(null);
      } catch (err: unknown) {
        console.error("Error fetching project data:", err);
        const errorMsg = err && typeof err === 'object' && 'response' in err
          ? (err.response as { data?: { message?: string } })?.data?.message || "Failed to load project data"
          : "Failed to load project data";
        setError(errorMsg);
        toast.error("Failed to load project data");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectAndTasks();
    }
  }, [projectId, fetchTasks]);

  // Set up socket connection and event listeners
  useEffect(() => {
    if (!projectId) return;

    // Initialize socket connection and join project room
    socketService.connect();
    socketService.joinProject(projectId);
    
    // Track connection status
    const unsubscribeConnection = socketService.on('connection-status', (status) => {
      console.log('Socket connection status changed:', status);
      setSocketConnected(status);
    });
    
    // Set initial connection status
    setSocketConnected(socketService.isConnected());
    
    // Setup socket event listeners using the new global event system
    const unsubscribeTaskCreated = socketService.on('task-created', (newTask) => {
      console.log('Socket: New task received', newTask);
      // Only add the task if it belongs to this project
      if (newTask.project === projectId) {
        setTasks(prev => {
          // Check if task already exists to avoid duplicates
          if (prev.some(t => t._id === newTask._id)) {
            return prev;
          }
          return [...prev, newTask];
        });
        toast.info(`New task added: ${newTask.title}`);
      }
    });
    
    const unsubscribeTaskUpdated = socketService.on('task-updated', (updatedTask) => {
      console.log('Socket: Task updated', updatedTask);
      // Only update the task if it belongs to this project
      if (updatedTask.project === projectId) {
        setTasks(prev => prev.map(t => 
          t._id === updatedTask._id ? updatedTask : t
        ));
        toast.info(`Task updated: ${updatedTask.title}`);
      }
    });
    
    const unsubscribeTaskDeleted = socketService.on('task-deleted', (taskId) => {
      console.log('Socket: Task deleted', taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.info('A task was deleted');
    });
    
    // Cleanup function
    return () => {
      if (projectId) {
        socketService.leaveProject(projectId);
        // Unsubscribe from all event listeners
        unsubscribeConnection();
        unsubscribeTaskCreated();
        unsubscribeTaskUpdated();
        unsubscribeTaskDeleted();
      }
    };
  }, [projectId]);

  // Map API status values to our display status
  const normalizeStatus = (status: string): "todo" | "in-progress" | "done" => {
    console.log("Normalizing status:", status);
    if (status === "completed") return "done";
    if (status === "in-progress") return "in-progress";
    return "todo";
  };

  // Map UI status back to API status
  const denormalizeStatus = (status: string): "todo" | "in-progress" | "completed" => {
    console.log("Denormalizing status:", status);
    if (status === "done") return "completed";
    if (status === "in-progress") return "in-progress";
    return "todo";
  };

  // Get tasks filtered and sorted
  const getFilteredTasks = () => {
    let filteredTasks = tasks;
    
    // Apply AI search filter if available
    if (searchFilter) {
      filteredTasks = filteredTasks.filter(task => {
        // Simple implementation - this would need to be expanded based on your search filter structure
        if (searchFilter.title && !task.title.toLowerCase().includes(searchFilter.title.toLowerCase())) {
          return false;
        }
        if (searchFilter.priority && task.priority !== searchFilter.priority) {
          return false;
        }
        if (searchFilter.status && task.status !== searchFilter.status) {
          return false;
        }
        return true;
      });
    } 
    // Otherwise apply basic search
    else if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(query) || 
        (task.description && task.description.toLowerCase().includes(query))
      );
    }
    
    // Apply priority filter
    if (filterPriority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
    }
    
    // Apply sorting
    return filteredTasks.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
    });
  };

  const getTasksByStatus = (status: "todo" | "in-progress" | "done") => {
    return getFilteredTasks().filter(task => normalizeStatus(task.status) === status);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    const foundTask = tasks.find(t => t._id === taskId);
    
    if (foundTask) {
      setActiveTask(foundTask);
    }
  };
  
  // Handle drag over for visual feedback
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    console.log("Drag over event:", {
      activeId: active.id,
      overId: over.id
    });
  };

  // Handle task status change via drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);
    
    if (!over) return;
    
    const taskId = active.id as string;
    const overId = over.id as string;
    
    console.log("Drag end event:", { 
      taskId, 
      overId,
      activeId: active.id,
      overContainerId: over.id 
    });
    
    // Check if dragged over a column
    if (overId.includes('-container')) {
      // Extract the status from the container ID (e.g., "todo-container" -> "todo")
      const newColumnStatus = overId.split('-')[0];
      console.log("Target column status:", newColumnStatus);
      
      // Convert UI column status to API status format
      const newApiStatus = denormalizeStatus(newColumnStatus);
      console.log("Converted to API status:", newApiStatus);
      
      // Find the task
      const taskToUpdate = tasks.find(t => t._id === taskId);
      
      if (!taskToUpdate) {
        console.error("Task not found:", taskId);
        return;
      }
      
      console.log("Current task status:", taskToUpdate.status);
      
      // Skip if the task already has this status
      if (normalizeStatus(taskToUpdate.status) === newColumnStatus) {
        console.log("Task already has this status, skipping update");
        return;
      }
      
      // Store original status for rollback if needed
      const originalStatus = taskToUpdate.status;
      
      try {
        console.log(`Updating task ${taskId} status from ${originalStatus} to ${newApiStatus}`);
        
        // Optimistically update UI
        setTasks(prev => 
          prev.map(t => t._id === taskId ? { ...t, status: newApiStatus } : t)
        );
        
        // Show toast indicating the change
        toast.promise(
          taskService.updateTaskStatus(taskId, newApiStatus),
          {
            loading: `Moving task to ${newColumnStatus}...`,
            success: `Task moved to ${newColumnStatus}`,
            error: "Failed to update task status"
          }
        );
        
        // No need to emit socket event here as the backend will handle it
      } catch (err) {
        console.error("Failed to update task status:", err);
        
        // Revert the optimistic update
        setTasks(prev => 
          prev.map(t => t._id === taskId ? { ...t, status: originalStatus } : t)
        );
      }
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>, file?: File) => {
    try {
      const newTask = await taskService.createTask(projectId, taskData, file);
      
      // Add the new task to the state with duplicate prevention
      setTasks(prev => {
        // Check if task already exists to avoid duplicates
        if (prev.some(t => t._id === newTask._id)) {
          return prev;
        }
        return [...prev, newTask];
      });
      setIsCreateTaskOpen(false);
      toast.success("Task created successfully");
      
      // No need to emit socket event here as the backend will handle it
    } catch (err) {
      console.error("Failed to create task:", err);
      toast.error("Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      
      // Remove the task from the state
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success("Task deleted successfully");
      
      // No need to emit socket event here as the backend will handle it
    } catch (err) {
      console.error("Failed to delete task:", err);
      toast.error("Failed to delete task");
    }
  };

  const handleAISearch = async () => {
    if (!aiSearchQuery.trim()) {
      setSearchFilter(null);
      return;
    }
    
    try {
      setAiSearchLoading(true);
      const filter = await aiService.parseSearchQuery(aiSearchQuery);
      setSearchFilter(filter as SearchFilter);
      toast.success("AI search applied");
    } catch (err) {
      console.error("Failed to parse search query:", err);
      toast.error("Failed to parse search query");
    } finally {
      setAiSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setAiSearchQuery("");
    setSearchFilter(null);
  };

  const renderTaskColumn = (status: "todo" | "in-progress" | "done", title: string) => {
    const columnTasks = getTasksByStatus(status);
    const columnId = `${status}-container`;
    
    return (
      <DroppableColumn
        key={status}
        id={columnId}
        title={title}
        count={columnTasks.length}
        showAddButton={status === "todo"}
        onAddClick={() => setIsCreateTaskOpen(true)}
      >
        {columnTasks.length === 0 ? (
          <div className="bg-white p-4 rounded border border-slate-200 text-center text-slate-500 text-sm">
            No tasks in this column
          </div>
        ) : (
          <SortableContext items={columnTasks.map(task => task._id)} strategy={verticalListSortingStrategy}>
            {columnTasks.map((task, index) => (
              <TaskCard 
                key={`${task._id}-${index}`}
                task={task}
                onDelete={() => handleDeleteTask(task._id)}
                onStatusChange={(updatedTask) => {
                  console.log("TaskBoard: Task status changed:", updatedTask);
                  // Update the task in the tasks array
                  setTasks(prev => 
                    prev.map(t => t._id === updatedTask._id ? updatedTask : t)
                  );
                }}
              />
            ))}
          </SortableContext>
        )}
      </DroppableColumn>
    );
  };

  // Custom drop animation
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  // Add this function to handle project updates
  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-4">
        <div className="container mx-auto">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-50 rounded-lg p-4 min-h-[500px] w-full md:w-1/3">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <Skeleton key={j} className="h-24 w-full rounded-md" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-100 p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md max-w-xl mx-auto">
          <p>{error || "Project not found"}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Maintenance Mode Banner */}
      {maintenanceMode && <MaintenanceModeBanner />}
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard" className="flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{project.name}</h1>
                <p className="text-sm text-slate-500">{project.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:max-w-xs">
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterPriority(null)}>
                    All Priorities
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority("high")}>
                    High Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority("medium")}>
                    Medium Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority("low")}>
                    Low Priority
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SortAsc className="h-4 w-4 mr-1" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                    Oldest First
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={() => setIsCreateTaskOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Task
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditProjectOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* AI Search */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Ask AI to find tasks (e.g., 'find urgent tasks about the login page')"
                value={aiSearchQuery}
                onChange={(e) => setAiSearchQuery(e.target.value)}
                className="pl-8"
                disabled={aiSearchLoading}
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            <Button 
              onClick={handleAISearch} 
              disabled={!aiSearchQuery.trim() || aiSearchLoading}
              size="sm"
            >
              {aiSearchLoading ? "Searching..." : "Ask AI"}
            </Button>
            {searchFilter && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearSearch}
              >
                Clear Search
              </Button>
            )}
          </div>
          
          {/* Filter indicators */}
          {(filterPriority || searchFilter) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filterPriority && (
                <Badge variant="outline" className="bg-white">
                  Priority: {filterPriority}
                  <button 
                    className="ml-2 text-xs" 
                    onClick={() => setFilterPriority(null)}
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchFilter && (
                <Badge variant="outline" className="bg-white">
                  AI Search: {aiSearchQuery}
                  <button 
                    className="ml-2 text-xs" 
                    onClick={clearSearch}
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
          
          {/* Socket connection status */}
          <div className="mt-2">
            <SocketStatus connected={socketConnected} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Active filters display */}
        {(filterPriority || searchQuery || searchFilter) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600">Filtered by:</span>
            
            {filterPriority && (
              <Badge variant="outline" className="flex items-center gap-1">
                {filterPriority} priority
                <button 
                  onClick={() => setFilterPriority(null)}
                  className="ml-1 hover:bg-slate-100 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            
            {searchQuery && (
              <Badge variant="outline" className="flex items-center gap-1">
                "{searchQuery}"
                <button 
                  onClick={clearSearch}
                  className="ml-1 hover:bg-slate-100 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            
            {searchFilter && (
              <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                AI Search: "{aiSearchQuery}"
                <button 
                  onClick={clearSearch}
                  className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
        
        <DndContext 
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {renderTaskColumn("todo", "To Do")}
            {renderTaskColumn("in-progress", "In Progress")}
            {renderTaskColumn("done", "Done")}
          </div>
          
          {/* Drag overlay for visual feedback */}
          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? (
              <div className="w-full opacity-80">
                <TaskCard 
                  task={activeTask}
                  onDelete={() => Promise.resolve()}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        
        <div className="mt-8 text-sm text-slate-500 text-center">
          <p>This board is now synchronized in real-time with other team members</p>
        </div>
      </main>
      
      {/* Add EditProjectDialog */}
      <EditProjectDialog
        open={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
        project={project}
        onProjectUpdated={handleProjectUpdated}
      />

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        onSubmit={handleCreateTask}
        projectId={projectId || ""}
      />
    </div>
  );
};

export default TaskBoard;