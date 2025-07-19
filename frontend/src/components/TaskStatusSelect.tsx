import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import taskService from "@/utils/taskService";
import type { Task } from "../types";

interface TaskStatusSelectProps {
  task: Task;
  onStatusChange?: (task: Task) => void;
  className?: string;
}

const TaskStatusSelect = ({ task, onStatusChange, className }: TaskStatusSelectProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<"todo" | "in-progress" | "completed">(task.status as "todo" | "in-progress" | "completed");
  
  const handleStatusChange = async (status: string) => {
    if (status === currentStatus) return;
    
    try {
      setIsUpdating(true);
      console.log(`TaskStatusSelect: Changing status from ${currentStatus} to ${status}`);
      
      // Optimistically update local state
      setCurrentStatus(status as "todo" | "in-progress" | "completed");
      
      const updatedTask = await taskService.updateTaskStatus(
        task._id,
        status as "todo" | "in-progress" | "completed"
      );
      
      toast.success("Task status updated");
      
      // Notify parent component about the status change
      if (onStatusChange) {
        console.log("Notifying parent about status change");
        onStatusChange(updatedTask);
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast.error("Failed to update task status");
      
      // Revert to original status on error
      setCurrentStatus(task.status as "todo" | "in-progress" | "completed");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-slate-100 text-slate-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "";
    }
  };
  
  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger 
        className={`h-8 text-xs font-medium ${getStatusColor(currentStatus)} ${className}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Change task status"
      >
        <SelectValue placeholder="Select status">
          {getStatusLabel(currentStatus)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todo" textValue="To Do">To Do</SelectItem>
        <SelectItem value="in-progress" textValue="In Progress">In Progress</SelectItem>
        <SelectItem value="completed" textValue="Completed">Completed</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default TaskStatusSelect; 