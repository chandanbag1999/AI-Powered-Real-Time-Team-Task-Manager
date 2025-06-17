import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar, User, Paperclip, Trash, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import taskService from "@/utils/taskService";
import socketService from "@/utils/socketService";
import type { Task } from "../types";
import TaskDetailsDialog from "./TaskDetailsDialog";
import TaskStatusSelect from "./TaskStatusSelect";


interface TaskCardProps {
  task: Task;
  onStatusChange?: (task: Task) => void;
  onDelete?: () => Promise<void>;
}

const TaskCard = ({ task, onStatusChange, onDelete }: TaskCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [isImageAttachment, setIsImageAttachment] = useState(false);
  
  // Setup sortable (drag and drop)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task._id,
    data: {
      type: 'task',
      task: currentTask,
    }
  });
  
  // Check if the attachment is an image
  useEffect(() => {
    if (currentTask.fileUrl && currentTask.fileName) {
      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(currentTask.fileName);
      setIsImageAttachment(isImage);
    } else {
      setIsImageAttachment(false);
    }
  }, [currentTask.fileUrl, currentTask.fileName]);

  // Listen for socket updates to this specific task
  useEffect(() => {
    // Subscribe to task updates from socket
    const unsubscribe = socketService.on('task-updated', (updatedTask) => {
      if (updatedTask._id === currentTask._id) {
        console.log(`TaskCard: Received socket update for task ${updatedTask._id}`, updatedTask);
        setCurrentTask(updatedTask);
        
        // If the status changed, notify parent component
        if (updatedTask.status !== currentTask.status && onStatusChange) {
          console.log(`TaskCard: Status changed from ${currentTask.status} to ${updatedTask.status}`);
          onStatusChange(updatedTask);
        }
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [currentTask._id, currentTask.status, onStatusChange]);

  console.log(`TaskCard rendered: ${task._id}, status: ${task.status}`);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        setIsDeleting(true);
        
        if (onDelete) {
          await onDelete();
        } else {
          await taskService.deleteTask(task._id);
          toast.success("Task deleted successfully");
        }
      } catch (err) {
        console.error("Failed to delete task:", err);
        toast.error("Failed to delete task");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getPriorityStyles = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const handleViewFile = () => {
    if (currentTask.fileUrl) {
      window.open(currentTask.fileUrl, '_blank');
    }
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setCurrentTask(updatedTask);
    
    // If the status changed, notify parent component
    if (updatedTask.status !== task.status && onStatusChange) {
      console.log(`TaskCard: Status changed from ${task.status} to ${updatedTask.status}`);
      onStatusChange(updatedTask);
    }
    
    toast.success("Task updated");
  };

  return (
    <>
      <Card 
        ref={setNodeRef} 
        style={style} 
        className={`cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${isDragging ? 'ring-2 ring-primary' : ''}`}
        {...attributes} 
        {...listeners}
      >
        <CardContent className="p-4" onClick={() => setIsDetailsOpen(true)}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-slate-800">{currentTask.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()} // Prevent opening details dialog
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600">
                  <Trash className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete Task"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Status Badge */}
          <div className="mb-3">
            <TaskStatusSelect 
              task={currentTask}
              onStatusChange={(updatedTask) => {
                handleTaskUpdated(updatedTask);
              }}
            />
          </div>
          
          {currentTask.description && (
            <p className="text-sm text-slate-600 mt-1 mb-3 line-clamp-2">{currentTask.description}</p>
          )}

          {/* File Attachment Preview */}
          {currentTask.fileUrl && (
            <div className="mb-3">
              <div 
                className="flex items-center justify-between p-2 border rounded-md mb-2 cursor-pointer hover:bg-slate-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewFile();
                }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-700">{currentTask.fileName || "Attachment"}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </div>
              
              {isImageAttachment && (
                <div 
                  className="border rounded-md overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewFile();
                  }}
                >
                  <img 
                    src={currentTask.fileUrl} 
                    alt={currentTask.fileName || "Attachment"} 
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Subtasks */}
          {currentTask.subtasks && currentTask.subtasks.length > 0 && (
            <div className="mt-2 mb-3">
              <p className="text-xs font-medium text-slate-700 mb-1">Subtasks:</p>
              <ul className="text-xs text-slate-600 pl-4 space-y-1">
                {currentTask.subtasks.slice(0, 2).map((subtask, i) => (
                  <li key={i} className="list-disc list-outside line-clamp-1">{subtask}</li>
                ))}
                {currentTask.subtasks.length > 2 && (
                  <li className="text-slate-500">+{currentTask.subtasks.length - 2} more</li>
                )}
              </ul>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mt-3">
            {currentTask.priority && (
              <Badge variant="outline" className={`${getPriorityStyles(currentTask.priority)} text-xs font-normal`}>
                {currentTask.priority}
              </Badge>
            )}
            
            {currentTask.dueDate && (
              <Badge variant="outline" className="text-xs font-normal flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                <Calendar className="h-3 w-3" />
                {new Date(currentTask.dueDate).toLocaleDateString()}
              </Badge>
            )}
            
            {currentTask.assignedTo && (
              <Badge variant="outline" className="text-xs font-normal flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
                <User className="h-3 w-3" />
                {currentTask.assignedTo}
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-slate-500 mt-3">
            Updated {new Date(currentTask.updatedAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      <TaskDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        task={currentTask}
        onTaskUpdated={(updatedTask) => {
          if (updatedTask) {
            handleTaskUpdated(updatedTask);
          }
        }}
      />
    </>
  );
};

export default TaskCard;