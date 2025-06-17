import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

const ProjectCard = ({ project, onDelete, isDeleting = false }: ProjectCardProps) => {
  const projectId = project.id || project._id || '';
  
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(projectId);
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
      <h3 className="font-medium text-lg text-slate-800 mb-2">
        {project.name}
      </h3>
      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
        {project.description}
      </p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">
          Created: {new Date(project.createdAt).toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/project/${projectId}`}>View</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard; 