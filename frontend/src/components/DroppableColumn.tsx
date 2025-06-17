import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DroppableColumnProps {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

const DroppableColumn = ({
  id,
  title,
  count,
  children,
  showAddButton = false,
  onAddClick
}: DroppableColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  console.log(`DroppableColumn ${id} rendered`);

  return (
    <div 
      ref={setNodeRef}
      id={id}
      data-column-id={id}
      className={`bg-slate-50 rounded-lg p-4 min-h-[500px] w-full md:w-1/3 flex flex-col transition-colors ${
        isOver ? "bg-slate-100 ring-2 ring-primary ring-inset" : ""
      }`}
    >
      <h3 className="font-medium text-lg mb-4 text-slate-700 flex items-center justify-between">
        <span>{title} ({count})</span>
        {showAddButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={onAddClick}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </h3>
      
      <div className="space-y-3 flex-grow">
        {children}
      </div>
    </div>
  );
};

export default DroppableColumn; 