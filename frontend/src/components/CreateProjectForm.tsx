import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppDispatch } from "@/hooks/useStore";
import { createProject } from "@/features/projects/projectsSlice";

interface CreateProjectFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

interface ProjectFormData {
  name: string;
  description: string;
}

const CreateProjectForm = ({ onSuccess, onCancel }: CreateProjectFormProps) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

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
      await dispatch(createProject(formData)).unwrap();
      onSuccess();
      setFormData({ name: "", description: "" });
    } catch (error: any) {
      console.error("Error creating project:", error);
      // Toast is already handled in the slice
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border border-slate-200">
      <h3 className="text-lg font-medium text-slate-900 mb-4">Create New Project</h3>
      
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
      
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </form>
  );
};

export default CreateProjectForm; 