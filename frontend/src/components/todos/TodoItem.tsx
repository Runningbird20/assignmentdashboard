import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { DragEvent } from "react";

import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { Button } from "@/components/ui/button";
import type { Todo } from "@/types";
import { cn } from "@/utils/cn";
import { describeDueDate } from "@/utils/date";

const dueToneClasses = {
  overdue: "text-red-600 dark:text-red-400",
  today: "text-amber-600 dark:text-amber-400",
  soon: "text-muted-foreground",
  normal: "text-muted-foreground",
};

export function TodoItem({
  todo,
  draggable = false,
  isDragging = false,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  todo: Todo;
  draggable?: boolean;
  isDragging?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (event: DragEvent) => void;
  onDrop?: () => void;
}) {
  const due = todo.due_date ? describeDueDate(todo.due_date) : null;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5",
        isDragging && "opacity-50",
      )}
    >
      {draggable && (
        <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
      )}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        className="size-4 shrink-0 cursor-pointer accent-primary"
        aria-label={todo.completed ? "Mark as not completed" : "Mark as completed"}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            todo.completed && "text-muted-foreground line-through",
          )}
        >
          {todo.title}
        </p>
        {todo.description ? (
          <p className="truncate text-xs text-muted-foreground">{todo.description}</p>
        ) : null}
      </div>
      {due && !todo.completed ? (
        <span className={cn("hidden text-xs sm:block", dueToneClasses[due.tone])}>
          {due.label}
        </span>
      ) : null}
      <PriorityBadge priority={todo.priority} />
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onEdit}
          aria-label="Edit to-do"
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-red-500"
          onClick={onDelete}
          aria-label="Delete to-do"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
