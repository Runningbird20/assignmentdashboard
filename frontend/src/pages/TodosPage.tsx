import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/Spinner";
import { TodoFormDialog } from "@/components/todos/TodoFormDialog";
import { TodoItem } from "@/components/todos/TodoItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  useCreateTodo,
  useDeleteTodo,
  useReorderTodos,
  useTodos,
  useUpdateTodo,
} from "@/hooks/useTodos";
import type { Todo } from "@/types";

export function TodosPage() {
  const { data: todos = [], isLoading } = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const reorderTodos = useReorderTodos();
  const { toast } = useToast();

  const [quickTitle, setQuickTitle] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [deleting, setDeleting] = useState<Todo | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [deleteCompletedOpen, setDeleteCompletedOpen] = useState(false);
  const [deletingCompleted, setDeletingCompleted] = useState(false);

  const active = todos.filter((todo) => !todo.completed);
  const completed = todos.filter((todo) => todo.completed);

  const handleQuickAdd = (event: FormEvent) => {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    createTodo.mutate(
      { title, priority: "medium" },
      {
        onSuccess: () => setQuickTitle(""),
        onError: (error: Error) =>
          toast({ title: "Could not add to-do", description: error.message, variant: "destructive" }),
      },
    );
  };

  const handleToggle = (todo: Todo) => {
    updateTodo.mutate({ id: todo.id, payload: { completed: !todo.completed } });
  };

  const handleDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) {
      setDragId(null);
      return;
    }
    const ids = active.map((todo) => todo.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    setDragId(null);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ...ids.splice(from, 1));
    reorderTodos.mutate([...ids, ...completed.map((todo) => todo.id)]);
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteTodo.mutate(deleting.id, {
      onSuccess: () => toast({ title: "To-do deleted", variant: "success" }),
      onError: (error: Error) =>
        toast({ title: "Delete failed", description: error.message, variant: "destructive" }),
    });
  };

  const handleDeleteAllCompleted = async () => {
    setDeletingCompleted(true);
    let deleted = 0;
    const errors: string[] = [];

    for (const todo of completed) {
      try {
        await deleteTodo.mutateAsync(todo.id);
        deleted += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed";
        errors.push(`${todo.title}: ${message}`);
      }
    }

    setDeletingCompleted(false);
    toast({
      title: `${deleted} of ${completed.length} completed to-dos deleted`,
      description: errors.length > 0 ? errors.join(" · ") : undefined,
      variant: errors.length > 0 ? "destructive" : "success",
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="To-dos"
        description="Personal tasks outside of school. Drag to reorder."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            New To-do
          </Button>
        }
      />

      <form onSubmit={handleQuickAdd} className="mb-4 flex gap-2">
        <Input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Quick add a to-do and press Enter…"
          className="max-w-md"
        />
        <Button type="submit" variant="secondary" disabled={createTodo.isPending}>
          Add
        </Button>
      </form>

      {todos.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No to-dos yet"
          description="Add personal tasks like errands, appointments and reminders."
        />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <div className="flex flex-col gap-2">
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">All caught up.</p>
            ) : (
              active.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  draggable
                  isDragging={dragId === todo.id}
                  onToggle={() => handleToggle(todo)}
                  onEdit={() => {
                    setEditing(todo);
                    setFormOpen(true);
                  }}
                  onDelete={() => setDeleting(todo)}
                  onDragStart={() => setDragId(todo.id)}
                  onDragEnd={() => setDragId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(todo.id)}
                />
              ))
            )}
          </div>

          {completed.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Completed ({completed.length})
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 text-xs text-muted-foreground hover:text-red-500"
                  disabled={deletingCompleted}
                  onClick={() => setDeleteCompletedOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  {deletingCompleted ? "Deleting…" : "Delete Completed"}
                </Button>
              </div>
              {completed.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={() => handleToggle(todo)}
                  onEdit={() => {
                    setEditing(todo);
                    setFormOpen(true);
                  }}
                  onDelete={() => setDeleting(todo)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <TodoFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete "${deleting?.title ?? "to-do"}"?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={deleteCompletedOpen}
        onOpenChange={setDeleteCompletedOpen}
        title={`Delete all ${completed.length} completed to-dos?`}
        description="This cannot be undone."
        confirmLabel="Delete All"
        destructive
        onConfirm={handleDeleteAllCompleted}
      />
    </div>
  );
}
