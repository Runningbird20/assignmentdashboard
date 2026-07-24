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
import { useCreateAssignment, useUpdateAssignment } from "@/hooks/useAssignments";
import { useClasses } from "@/hooks/useClasses";
import type {
  Assignment,
  AssignmentPayload,
  AssignmentStatus,
  Priority,
  RecurrenceFrequency,
} from "@/types";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/utils/constants";

interface AssignmentFormState {
  class_id: string;
  name: string;
  due_date: string;
  status: AssignmentStatus;
  priority: Priority;
  notes: string;
  recurrence_frequency: RecurrenceFrequency | "";
  recurrence_interval: number;
}

const emptyForm: AssignmentFormState = {
  class_id: "",
  name: "",
  due_date: "",
  status: "todo",
  priority: "medium",
  notes: "",
  recurrence_frequency: "",
  recurrence_interval: 1,
};

function fromAssignment(assignment: Assignment): AssignmentFormState {
  return {
    class_id: String(assignment.class_id),
    name: assignment.name,
    due_date: assignment.due_date,
    status: assignment.status,
    priority: assignment.priority,
    notes: assignment.notes ?? "",
    recurrence_frequency: assignment.recurrence_frequency ?? "",
    recurrence_interval: assignment.recurrence_interval,
  };
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  initial,
  defaultClassId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Assignment | null;
  defaultClassId?: number;
}) {
  const { data: classes = [] } = useClasses();
  const [form, setForm] = useState<AssignmentFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const { toast } = useToast();
  const isPending = createAssignment.isPending || updateAssignment.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? fromAssignment(initial)
          : { ...emptyForm, class_id: defaultClassId ? String(defaultClassId) : "" },
      );
      setError(null);
    }
  }, [open, initial, defaultClassId]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.class_id) {
      setError("Choose a class.");
      return;
    }
    if (!form.name.trim()) {
      setError("Assignment name is required.");
      return;
    }
    if (!form.due_date) {
      setError("A due date is required.");
      return;
    }
    const payload: AssignmentPayload = {
      class_id: Number(form.class_id),
      name: form.name.trim(),
      due_date: form.due_date,
      status: form.status,
      priority: form.priority,
      notes: form.notes.trim() || null,
      recurrence_frequency: form.recurrence_frequency || null,
      recurrence_interval: form.recurrence_interval,
    };
    const options = {
      onSuccess: () => {
        onOpenChange(false);
        toast({
          title: initial ? "Assignment updated" : "Assignment created",
          variant: "success" as const,
        });
      },
      onError: (mutationError: Error) => setError(mutationError.message),
    };
    if (initial) {
      updateAssignment.mutate({ id: initial.id, payload }, options);
    } else {
      createAssignment.mutate(payload, options);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Assignment" : "New Assignment"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this assignment's details."
              : "Track a new assignment for one of your classes."}
          </DialogDescription>
        </DialogHeader>
        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You need at least one class before adding assignments. Create one on the
            Classes page first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignment-class">Class *</Label>
              <Select
                id="assignment-class"
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              >
                <option value="" disabled>
                  Select a class…
                </option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignment-name">Name *</Label>
              <Input
                id="assignment-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Problem Set 4"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assignment-due">Due Date *</Label>
                <Input
                  id="assignment-due"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assignment-status">Status</Label>
                <Select
                  id="assignment-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as AssignmentStatus })
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assignment-priority">Priority</Label>
                <Select
                  id="assignment-priority"
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
              <Label htmlFor="assignment-notes">Notes</Label>
              <Textarea
                id="assignment-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Anything worth remembering…"
              />
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {initial ? "Save Changes" : "Create Assignment"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
