import { useEffect, useState, type FormEvent } from "react";

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
import { useToast } from "@/components/ui/toast";
import { useCreateClass, useUpdateClass } from "@/hooks/useClasses";
import type { ClassPayload, SchoolClass } from "@/types";
import { cn } from "@/utils/cn";
import { CLASS_COLORS, WEEKDAYS } from "@/utils/constants";

interface ClassFormState {
  name: string;
  professor: string;
  location: string;
  meeting_days: string[];
  meeting_time: string;
  office_hours: string;
  color: string;
}

const emptyForm: ClassFormState = {
  name: "",
  professor: "",
  location: "",
  meeting_days: [],
  meeting_time: "",
  office_hours: "",
  color: CLASS_COLORS[0],
};

function fromClass(schoolClass: SchoolClass): ClassFormState {
  return {
    name: schoolClass.name,
    professor: schoolClass.professor ?? "",
    location: schoolClass.location ?? "",
    meeting_days: schoolClass.meeting_days,
    meeting_time: schoolClass.meeting_time ?? "",
    office_hours: schoolClass.office_hours ?? "",
    color: schoolClass.color,
  };
}

export function ClassFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: SchoolClass | null;
}) {
  const [form, setForm] = useState<ClassFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const { toast } = useToast();
  const isPending = createClass.isPending || updateClass.isPending;

  useEffect(() => {
    if (open) {
      setForm(initial ? fromClass(initial) : emptyForm);
      setError(null);
    }
  }, [open, initial]);

  const toggleDay = (day: string) => {
    setForm((current) => ({
      ...current,
      meeting_days: current.meeting_days.includes(day)
        ? current.meeting_days.filter((d) => d !== day)
        : [...current.meeting_days, day],
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Class name is required.");
      return;
    }
    const payload: ClassPayload = {
      name: form.name.trim(),
      professor: form.professor.trim() || null,
      location: form.location.trim() || null,
      meeting_days: WEEKDAYS.filter((day) => form.meeting_days.includes(day)),
      meeting_time: form.meeting_time.trim() || null,
      office_hours: form.office_hours.trim() || null,
      color: form.color,
    };
    const options = {
      onSuccess: () => {
        onOpenChange(false);
        toast({
          title: initial ? "Class updated" : "Class created",
          variant: "success" as const,
        });
      },
      onError: (mutationError: Error) => setError(mutationError.message),
    };
    if (initial) {
      updateClass.mutate({ id: initial.id, payload }, options);
    } else {
      createClass.mutate(payload, options);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Class" : "Add Class"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this class's details."
              : "Add a class to your schedule."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="class-name">Name *</Label>
            <Input
              id="class-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="CS 250: Data Structures"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="class-professor">Professor</Label>
              <Input
                id="class-professor"
                value={form.professor}
                onChange={(e) => setForm({ ...form, professor: e.target.value })}
                placeholder="Dr. Vasquez"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="class-location">Location</Label>
              <Input
                id="class-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Halligan Hall 102"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Meeting Days</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    form.meeting_days.includes(day)
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="class-time">Meeting Time</Label>
              <Input
                id="class-time"
                value={form.meeting_time}
                onChange={(e) => setForm({ ...form, meeting_time: e.target.value })}
                placeholder="10:00 – 10:50 AM"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="class-office-hours">Office Hours</Label>
              <Input
                id="class-office-hours"
                value={form.office_hours}
                onChange={(e) => setForm({ ...form, office_hours: e.target.value })}
                placeholder="Tue 2:00 – 4:00 PM"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CLASS_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    form.color === color
                      ? "scale-110 border-foreground"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                >
                  <span className="sr-only">{color}</span>
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {initial ? "Save Changes" : "Add Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
