import { useEffect, useState, type FormEvent } from "react";

import { RecurrenceFields } from "@/components/shared/RecurrenceFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useCreateTodo, useUpdateTodo } from "@/hooks/useTodos";
import type { Priority, RecurrenceFrequency, Todo, TodoPayload } from "@/types";
import { PRIORITY_OPTIONS } from "@/utils/constants";

interface TodoFormState {
  title: string;
  description: string;
  due_date: string;
  priority: Priority;
  recurrence_frequency: RecurrenceFrequency | "";
  recurrence_interval: number;
}

const emptyForm: TodoFormState = {
  title: "",
  description: "",
  due_date: "",
  priority: "medium",
  recurrence_frequency: "",
  recurrence_interval: 1,
};

export function TodoFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Todo | null;
}) {
  const [form, setForm] = useState<TodoFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const { toast } = useToast();
  const isPending = createTodo.isPending || updateTodo.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              title: initial.title,
              description: initial.description ?? "",
              due_date: initial.due_date ?? "",
              priority: initial.priority,
              recurrence_frequency: initial.recurrence_frequency ?? "",
              recurrence_interval: initial.recurrence_interval,
            }
          : emptyForm,
      );
      setError(null);
    }
  }, [open, initial]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("A title is required.");
      return;
    }
    if (form.recurrence_frequency && !form.due_date) {
      setError("A due date is required for a repeating to-do.");
      return;
    }
    const payload: TodoPayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date || null,
      priority: form.priority,
      recurrence_frequency: form.recurrence_frequency || null,
      recurrence_interval: form.recurrence_interval,
    };
    const options = {
      onSuccess: () => {
        onOpenChange(false);
        toast({
          title: initial ? "To-do updated" : "To-do created",
          variant: "success" as const,
        });
      },
      onError: (mutationError: Error) => setError(mutationError.message),
    };
    if (initial) {
      updateTodo.mutate({ id: initial.id, payload }, options);
    } else {
      createTodo.mutate(payload, options);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit To-do" : "New To-do"}</DialogTitle>
          <DialogDescription>
            Personal tasks that aren't tied to a class.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-title">Title *</Label>
            <Input
              id="todo-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Pick up package"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="todo-due">Due Date</Label>
              <Input
                id="todo-due"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="todo-priority">Priority</Label>
              <Select
                id="todo-priority"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as Priority })
                }
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <RecurrenceFields
            frequency={form.recurrence_frequency}
            interval={form.recurrence_interval}
            onFrequencyChange={(recurrence_frequency) =>
              setForm({ ...form, recurrence_frequency })
            }
            onIntervalChange={(recurrence_interval) =>
              setForm({ ...form, recurrence_interval })
            }
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-description">Notes</Label>
            <Textarea
              id="todo-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {initial ? "Save Changes" : "Add To-do"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
