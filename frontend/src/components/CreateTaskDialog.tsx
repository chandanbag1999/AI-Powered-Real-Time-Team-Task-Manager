import { useState, useRef } from "react";
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
import { Sparkles, Calendar, Upload, X, Plus, Trash2 } from "lucide-react";
import aiService from "@/utils/aiService";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskData: Record<string, unknown>, file?: File) => void;
  projectId: string;
}

const CreateTaskDialog = ({ open, onOpenChange, onSubmit, projectId }: CreateTaskDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    subtasks: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [reminderText, setReminderText] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create a preview URL for the file if it's an image
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
    
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Creating task for project: ${projectId}`);
      await onSubmit(formData, file || undefined);
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        subtasks: [],
      });
      setFile(null);
      setFilePreview(null);
      setReminderText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setLoading(false);
    }
  };

  // AI features
  const handleSuggestSubtasks = async () => {
    if (!formData.title.trim()) {
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

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, newSubtask.trim()]
      }));
      setNewSubtask("");
    }
  };

  const removeSubtask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project. Fill out the details below.
          </DialogDescription>
        </DialogHeader>
        
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
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => handleSelectChange("priority", value)}
              >
                <SelectTrigger aria-label="Task priority">
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
                  <Upload className="h-3 w-3" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
              {filePreview && (
                <div className="mt-2 border rounded-md p-1 overflow-hidden">
                  <img 
                    src={filePreview} 
                    alt={file?.name || "Preview"} 
                    className="max-h-48 object-contain mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* AI Subtasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Subtasks</Label>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={handleSuggestSubtasks}
                disabled={aiLoading || !formData.title.trim()}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Suggest
              </Button>
            </div>
            
            {/* Manual subtask entry */}
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add a subtask"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={addSubtask}
                disabled={!newSubtask.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.subtasks.length > 0 ? (
              <ul className="space-y-2 mt-2 text-sm">
                {formData.subtasks.map((subtask, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="h-5 w-5 mt-0.5 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <span className="flex-1">{subtask}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeSubtask(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No subtasks yet. Add them manually or use AI to suggest.</p>
            )}
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;