import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles,
  Calendar,
  Upload,
  X,
  Plus,
  Pencil,
  Check,
  Trash2,
  Paperclip,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  File,
  Image,
  FileType,
  AudioLines,
  Video,
  Code,
} from "lucide-react";
import aiService from "@/utils/aiService";
import taskService from "@/utils/taskService";
import type { Task } from "../types";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskUpdated: (updatedTask?: Task) => void;
}

const TaskDetailsDialog = ({ 
  open, 
  onOpenChange, 
  task, 
  onTaskUpdated 
}: TaskDetailsDialogProps) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    subtasks: [],
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [reminderText, setReminderText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [aiRetries, setAiRetries] = useState(0);
  const MAX_RETRIES = 2;
  
  // New state for subtask management
  const [newSubtask, setNewSubtask] = useState("");
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState<number | null>(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState("");

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority || "medium",
        dueDate: task.dueDate || "",
        subtasks: task.subtasks || [],
      });
    }
  }, [task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = async (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If status is changed, update the task immediately
    if (name === "status" && task) {
      try {
        setLoading(true);
        console.log(`TaskDetailsDialog: Updating status to ${value}`);
        
        const updatedTask = await taskService.updateTaskStatus(
          task._id,
          value as "todo" | "in-progress" | "completed"
        );
        
        toast.success("Task status updated");
        onTaskUpdated(updatedTask);
      } catch (error) {
        console.error("Failed to update task status:", error);
        toast.error("Failed to update task status");
        
        // Revert to original status on error
        setFormData(prev => ({ ...prev, status: task.status }));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create a preview URL for the file
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    if (!task?._id) {
      toast.error("Task ID is missing");
      return;
    }
    
    try {
      setLoading(true);
      
      const updatedTask = await taskService.updateTask(task._id, formData, file || undefined);
      toast.success("Task updated successfully");
      onTaskUpdated(updatedTask);
      onOpenChange(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!task?._id) return;
    
    try {
      setLoading(true);
      await taskService.deleteTaskFile(task._id);
      
      // Update the local task data
      const updatedTask = {
        ...task,
        fileUrl: undefined,
        fileName: undefined
      };
      
      toast.success("File deleted successfully");
      onTaskUpdated(updatedTask);
    } catch (error) {
      console.error("Failed to delete file:", error);
      toast.error("Failed to delete file");
    } finally {
      setLoading(false);
    }
  };

  // AI features
  const handleSuggestSubtasks = async () => {
    if (!formData.title?.trim()) {
      toast.error("Task title is required for AI suggestions");
      return;
    }

    try {
      setAiLoading(true);
      const subtasks = await aiService.suggestSubtasks(formData.title);
      setFormData(prev => ({ ...prev, subtasks }));
      toast.success("AI suggested subtasks");
    } catch (error) {
      console.error("Failed to get AI suggestions:", error);
      toast.error("Failed to get AI suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  const handleParseReminder = async () => {
    if (!reminderText.trim()) {
      toast.error("Please enter a reminder text");
      return;
    }

    try {
      setAiLoading(true);
      const dueDate = await aiService.parseReminder(reminderText);
      setFormData(prev => ({ ...prev, dueDate }));
      toast.success("AI parsed your reminder");
    } catch (error) {
      console.error("Failed to parse reminder:", error);
      toast.error("Failed to parse reminder");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAutoPrioritize = async () => {
    if (!task?._id) {
      toast.error("Task ID is missing");
      return;
    }

    try {
      setAiLoading(true);
      const priority = await aiService.autoPrioritizeTask(task._id);
      setFormData(prev => ({ ...prev, priority }));
      toast.success("AI prioritized your task");
      // Reset retries on success
      setAiRetries(0);
    } catch (error: unknown) {
      console.error("Failed to auto-prioritize:", error);
      
      // Check if we should retry
      if (aiRetries < MAX_RETRIES) {
        setAiRetries(prev => prev + 1);
        toast.info(`Retrying... (${aiRetries + 1}/${MAX_RETRIES})`, { duration: 2000 });
        
        // Wait a moment before retrying
        setTimeout(() => {
          handleAutoPrioritize();
        }, 1500);
        return;
      }
      
      // Extract more specific error message if available
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string, error?: string } })?.data?.message || 
          (error.response as { data?: { message?: string, error?: string } })?.data?.error || 
          "Failed to auto-prioritize"
        : "Failed to auto-prioritize";
      
      toast.error(errorMessage, {
        description: "Please try again later or set priority manually",
        duration: 5000
      });
      
      // Fallback: Set a reasonable priority based on task data
      if (task) {
        let fallbackPriority: "low" | "medium" | "high" = "medium";
        
        // If there's a due date, check how soon it is
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const now = new Date();
          const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 2) {
            fallbackPriority = "high";
          } else if (daysDiff <= 7) {
            fallbackPriority = "medium";
          } else {
            fallbackPriority = "low";
          }
        }
        
        setFormData(prev => ({ ...prev, priority: fallbackPriority }));
        toast.info("Set fallback priority based on due date", { duration: 3000 });
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Create a preview URL when task has a fileUrl
  useEffect(() => {
    if (task?.fileUrl) {
      console.log("File URL detected:", task.fileUrl);
      
      // Check if it's an image by the file extension or URL pattern
      const isImage = task.fileName 
        ? /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(task.fileName) 
        : /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(task.fileUrl);
      
      if (isImage) {
        console.log("Setting image preview for:", task.fileName || task.fileUrl);
        
        // For Cloudinary URLs, we might need to transform them for better preview
        let previewUrl = task.fileUrl;
        
        // If it's a Cloudinary URL with raw resource type, modify it to access as an image
        if (task.fileUrl.includes('cloudinary.com') && task.fileUrl.includes('/raw/')) {
          // Convert from raw to image resource type if it's an image
          previewUrl = task.fileUrl.replace('/raw/', '/image/');
          console.log("Modified Cloudinary URL for preview:", previewUrl);
        }
        
        setFilePreview(previewUrl);
      } else {
        console.log("Non-image file detected:", task.fileName || task.fileUrl);
        setFilePreview(null);
      }
    } else {
      console.log("No file URL found in task");
      setFilePreview(null);
    }
    
    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [task?.fileUrl, task?.fileName]);

  // Get file type icon based on file extension
  const getFileIcon = (fileName: string) => {
    if (!fileName) return <File className="h-5 w-5 text-slate-500" />;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (/^(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(extension || '')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (/^(pdf)$/i.test(extension || '')) {
      return <FileType className="h-5 w-5 text-red-500" />;
    } else if (/^(doc|docx)$/i.test(extension || '')) {
      return <FileText className="h-5 w-5 text-blue-700" />;
    } else if (/^(xls|xlsx)$/i.test(extension || '')) {
      return <FileText className="h-5 w-5 text-green-600" />;
    } else if (/^(ppt|pptx)$/i.test(extension || '')) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    } else if (/^(mp3|wav|ogg|flac)$/i.test(extension || '')) {
      return <AudioLines className="h-5 w-5 text-purple-500" />;
    } else if (/^(mp4|avi|mov|wmv|flv|mkv)$/i.test(extension || '')) {
      return <Video className="h-5 w-5 text-pink-500" />;
    } else if (/^(js|ts|jsx|tsx|html|css|py|java|c|cpp|php|rb)$/i.test(extension || '')) {
      return <Code className="h-5 w-5 text-yellow-500" />;
    } else {
      return <File className="h-5 w-5 text-slate-500" />;
    }
  };

  // Extract file name from URL if fileName is not provided
  const getFileName = (url: string, fallbackName?: string): string => {
    if (fallbackName) return fallbackName;
    
    try {
      // Try to extract filename from URL
      const urlParts = url.split('/');
      let fileName = urlParts[urlParts.length - 1];
      
      // Remove query parameters if any
      if (fileName.includes('?')) {
        fileName = fileName.split('?')[0];
      }
      
      // URL decode the filename
      return decodeURIComponent(fileName);
    } catch (error) {
      console.error("Error extracting filename from URL:", error);
      return "attachment";
    }
  };

  const getFileType = (fileName: string) => {
    if (!fileName) return 'application/octet-stream';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Common MIME types
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'zip': 'application/zip',
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'json': 'application/json'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  };

  const handleViewFile = async () => {
    if (!task?.fileUrl) return;
    
    try {
      console.log("Opening file:", task.fileUrl);
      window.open(task.fileUrl, '_blank');
    } catch (error) {
      console.error("Error opening file:", error);
      toast.error("Failed to open file");
    }
  };

  const handleDownloadFile = async () => {
    if (!task?.fileUrl) return;
    
    try {
      console.log("Downloading file:", task.fileUrl);
      const fileName = task.fileName || getFileName(task.fileUrl, "download");
      
      // Create a download link
      const link = document.createElement('a');
      link.href = task.fileUrl;
      link.download = fileName;
      link.target = "_blank";
      
      // Append to the document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  // Add a new subtask
  const handleAddSubtask = () => {
    if (!newSubtask.trim()) {
      toast.error("Subtask cannot be empty");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask.trim()]
    }));
    setNewSubtask("");
  };
  
  // Remove a subtask
  const handleRemoveSubtask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.filter((_, i) => i !== index)
    }));
  };
  
  // Start editing a subtask
  const handleStartEditSubtask = (index: number, text: string) => {
    setEditingSubtaskIndex(index);
    setEditingSubtaskText(text);
  };
  
  // Save edited subtask
  const handleSaveEditSubtask = () => {
    if (editingSubtaskIndex === null) return;
    
    if (!editingSubtaskText.trim()) {
      toast.error("Subtask cannot be empty");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.map((subtask, i) => 
        i === editingSubtaskIndex ? editingSubtaskText.trim() : subtask
      )
    }));
    
    setEditingSubtaskIndex(null);
    setEditingSubtaskText("");
  };
  
  // Cancel editing subtask
  const handleCancelEditSubtask = () => {
    setEditingSubtaskIndex(null);
    setEditingSubtaskText("");
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{isEditing ? "Edit Task" : "Task Details"}</span>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </DialogTitle>
          {!isEditing ? (
            <DialogDescription>
              View task details and attachments
            </DialogDescription>
          ) : (
            <DialogDescription>
              Edit task information and manage subtasks
            </DialogDescription>
          )}
        </DialogHeader>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger aria-label="Task status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo" textValue="To Do">To Do</SelectItem>
                    <SelectItem value="in-progress" textValue="In Progress">In Progress</SelectItem>
                    <SelectItem value="completed" textValue="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="priority">Priority</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={handleAutoPrioritize}
                    disabled={aiLoading}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto
                  </Button>
                </div>
                <Select 
                  value={formData.priority || "medium"} 
                  onValueChange={(value) => handleSelectChange("priority", value)}
                >
                  <SelectTrigger id="priority" aria-label="Task priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" textValue="Low">Low</SelectItem>
                    <SelectItem value="medium" textValue="Medium">Medium</SelectItem>
                    <SelectItem value="high" textValue="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* AI Reminder Parser */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="e.g., next Monday, tomorrow"
                    value={reminderText}
                    onChange={(e) => setReminderText(e.target.value)}
                  />
                </div>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={handleParseReminder}
                  disabled={aiLoading || !reminderText.trim()}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Parse
                </Button>
              </div>
              {formData.dueDate && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {new Date(formData.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Attachment</Label>
              {task.fileUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2 text-sm">
                      {getFileIcon(task.fileName || "")}
                      <span>{task.fileName || "Attachment"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleViewFile}
                        className="h-8 w-8 p-0"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDownloadFile}
                        className="h-8 w-8 p-0"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDeleteFile}
                        className="h-8 w-8 p-0 text-red-600"
                        title="Delete"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {filePreview && (
                    <div className="mt-2 border rounded-md p-1 overflow-hidden">
                      <img 
                        src={filePreview} 
                        alt={task.fileName || "Preview"} 
                        className="max-h-[200px] object-contain mx-auto"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    {file && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={removeFile}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {file && (
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      {getFileIcon(file.name)}
                      <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    </p>
                  )}
                  {filePreview && (
                    <div className="mt-2 border rounded-md p-1 overflow-hidden">
                      <img 
                        src={filePreview} 
                        alt={file?.name || "Preview"} 
                        className="max-h-[200px] object-contain mx-auto"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Subtasks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Subtasks</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSuggestSubtasks}
                  disabled={aiLoading || !formData.title?.trim()}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Suggest with AI
                </Button>
              </div>
              
              {/* Add new subtask */}
              <div className="flex items-center gap-2 mt-2">
                <Input
                  placeholder="Add a new subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Subtasks list */}
              {formData.subtasks && formData.subtasks.length > 0 ? (
                <ul className="space-y-2 mt-2 text-sm">
                  {formData.subtasks.map((subtask, index) => (
                    <li key={index} className="flex items-center gap-2 group">
                      {editingSubtaskIndex === index ? (
                        <>
                          <div className="h-5 w-5 mt-0.5 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <Input
                            value={editingSubtaskText}
                            onChange={(e) => setEditingSubtaskText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEditSubtask();
                              } else if (e.key === 'Escape') {
                                handleCancelEditSubtask();
                              }
                            }}
                            autoFocus
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            onClick={handleSaveEditSubtask}
                          >
                            Save
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            onClick={handleCancelEditSubtask}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="h-5 w-5 mt-0.5 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <span className="flex-1">{subtask}</span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0" 
                              onClick={() => handleStartEditSubtask(index, subtask)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 text-red-600" 
                              onClick={() => handleRemoveSubtask(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No subtasks yet. Add them manually or use AI to suggest.</p>
              )}
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Task details in view mode */}
            <div>
              <h3 className="text-lg font-medium">{task.title}</h3>
              {task.description && (
                <p className="mt-2 text-slate-600 whitespace-pre-wrap">{task.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Status</h4>
                <div className={`inline-block px-2 py-1 rounded-md text-sm font-medium ${
                  task.status === "todo" ? "bg-slate-100 text-slate-800" : 
                  task.status === "in-progress" ? "bg-blue-100 text-blue-800" : 
                  "bg-green-100 text-green-800"
                }`}>
                  {task.status === "todo" ? "To Do" : 
                   task.status === "in-progress" ? "In Progress" : 
                   "Completed"}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Priority</h4>
                <div className={`inline-block px-2 py-1 rounded-md text-sm font-medium ${
                  task.priority === "high" ? "bg-red-100 text-red-800" : 
                  task.priority === "medium" ? "bg-yellow-100 text-yellow-800" : 
                  "bg-green-100 text-green-800"
                }`}>
                  {task.priority || "Medium"}
                </div>
              </div>
            </div>
            
            {task.dueDate && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Due Date</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
            )}
            
            {/* Attachment Viewer - Always show attachment section if task has fileUrl */}
            {task.fileUrl ? (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-slate-50 p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(task.fileName || getFileName(task.fileUrl || ""))}
                    <span className="font-medium text-sm">{task.fileName || getFileName(task.fileUrl || "")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleViewFile}
                      className="h-8 w-8 p-0"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleDownloadFile}
                      className="h-8 w-8 p-0"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {filePreview ? (
                  <div className="p-2 flex justify-center bg-slate-100">
                    <img 
                      src={filePreview} 
                      alt={task.fileName || getFileName(task.fileUrl || "")} 
                      className="max-h-[300px] object-contain rounded shadow-sm"
                      onError={(e) => {
                        console.error("Image failed to load:", e);
                        // Try with a direct URL if the preview URL fails
                        if (filePreview !== task.fileUrl) {
                          (e.target as HTMLImageElement).src = task.fileUrl || "";
                        } else {
                          // If direct URL also fails, show error state
                          setFilePreview(null);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-6 flex flex-col items-center justify-center bg-slate-100 text-slate-500">
                    {getFileIcon(task.fileName || getFileName(task.fileUrl || ""))}
                    <p className="mt-2 text-sm">Preview not available</p>
                    <p className="text-xs text-slate-400 mb-2">File type: {task.fileName ? task.fileName.split('.').pop()?.toUpperCase() : 'Unknown'}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleViewFile}
                      className="mt-2"
                    >
                      Open File
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Attachment</h4>
                <p className="text-sm text-slate-500">No attachment</p>
              </div>
            )}
            
            {/* Subtasks in view mode */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Subtasks</h4>
                <ul className="space-y-1">
                  {task.subtasks.map((subtask, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="h-5 w-5 mt-0.5 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span>{subtask}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="text-xs text-slate-500 pt-4 border-t">
              <div>Created: {new Date(task.createdAt).toLocaleString()}</div>
              <div>Last Updated: {new Date(task.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
