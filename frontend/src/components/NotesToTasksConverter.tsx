import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Plus } from "lucide-react";
import aiService from "@/utils/aiService";
import taskService from "@/utils/taskService";

interface NotesToTasksConverterProps {
  projectId: string;
  onTasksCreated: () => void;
}

const NotesToTasksConverter = ({ projectId, onTasksCreated }: NotesToTasksConverterProps) => {
  const [note, setNote] = useState("");
  const [extractedTasks, setExtractedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleExtractTasks = async () => {
    if (!note.trim()) {
      toast.error("Please enter a note to extract tasks from");
      return;
    }

    try {
      setLoading(true);
      const tasks = await aiService.extractTasksFromNote(note);
      setExtractedTasks(tasks);
      toast.success("Tasks extracted from note");
    } catch (error) {
      console.error("Failed to extract tasks:", error);
      toast.error("Failed to extract tasks from note");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = async () => {
    if (extractedTasks.length === 0) {
      toast.error("No tasks to create");
      return;
    }

    try {
      setCreating(true);
      
      // Create tasks one by one
      const promises = extractedTasks.map(title => 
        taskService.createTask(projectId, { 
          title, 
          status: "todo",
          priority: "medium" 
        })
      );
      
      await Promise.all(promises);
      
      toast.success(`${extractedTasks.length} tasks created successfully`);
      setNote("");
      setExtractedTasks([]);
      onTasksCreated();
    } catch (error) {
      console.error("Failed to create tasks:", error);
      toast.error("Failed to create tasks");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <h3 className="text-lg font-medium text-slate-900 mb-4">Convert Notes to Tasks</h3>
      
      <div className="space-y-4">
        <div>
          <Textarea
            placeholder="Enter your notes here... e.g., 'I need to prepare the presentation for Monday, call the client about the project update, and fix the bug in the login page.'"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            className="w-full"
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleExtractTasks} 
            disabled={loading || !note.trim()}
            variant="outline"
            className="gap-1"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Extracting..." : "Extract Tasks"}
          </Button>
        </div>
        
        {extractedTasks.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Extracted Tasks:</h4>
            <ul className="space-y-2 border rounded-md p-3 bg-slate-50">
              {extractedTasks.map((task, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="h-5 w-5 mt-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleCreateTasks} 
                disabled={creating}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                {creating ? "Creating..." : "Create Tasks"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesToTasksConverter; 