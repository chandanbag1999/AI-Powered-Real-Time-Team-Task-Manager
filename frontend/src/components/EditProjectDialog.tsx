import { useState } from "react";
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
import { toast } from "sonner";
import apiClient from "@/utils/apiClient";
import type { Project } from "@/types";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onProjectUpdated: (updatedProject: Project) => void;
}

const EditProjectDialog = ({ 
  open, 
  onOpenChange, 
  project, 
  onProjectUpdated 
}: EditProjectDialogProps) => {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
  }>({
    name: project.name,
    description: project.description || "",
  });
  const [loading, setLoading] = useState(false);

  // Update form data when project changes
  useState(() => {
    setFormData({
      name: project.name,
      description: project.description || "",
    });
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setLoading(true);
      const projectId = project.id || project._id;
      await apiClient.put(`/projects/${projectId}`, formData);
      
      const updatedProject = {
        ...project,
        ...formData,
      };
      
      onProjectUpdated(updatedProject);
      onOpenChange(false);
      toast.success("Project updated successfully");
    } catch (error: unknown) {
      console.error("Error updating project:", error);
      const errorMsg = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message || "Failed to update project"
        : "Failed to update project";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
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
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog; 