import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FolderOpen,
  Pencil,
  Plus,
  StickyNote,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AssignmentFormDialog } from "@/components/assignments/AssignmentFormDialog";
import { ClassFormDialog } from "@/components/classes/ClassFormDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoader } from "@/components/shared/Spinner";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAssignments } from "@/hooks/useAssignments";
import { useClass } from "@/hooks/useClasses";
import type { Assignment } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/date";

type TabKey = "assignments" | "notes" | "files" | "exams";

const tabs: { key: TabKey; label: string }[] = [
  { key: "assignments", label: "Assignments" },
  { key: "notes", label: "Notes" },
  { key: "files", label: "Files" },
  { key: "exams", label: "Upcoming Exams" },
];

function MetaItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function ClassDetailPage() {
  const { classId } = useParams();
  const id = Number(classId);
  const { data: schoolClass, isLoading, isError } = useClass(id);
  const { data: assignments = [] } = useAssignments();
  const [tab, setTab] = useState<TabKey>("assignments");
  const [editOpen, setEditOpen] = useState(false);
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  if (isLoading) return <PageLoader />;

  if (isError || !schoolClass) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Class not found"
        description="It may have been deleted."
        action={
          <Button variant="outline">
            <Link to="/classes" className="flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Back to Classes
            </Link>
          </Button>
        }
      />
    );
  }

  const classAssignments = assignments.filter(
    (assignment) => assignment.class_id === id,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/classes"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All Classes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: schoolClass.color }}
            />
            <h1 className="text-xl font-semibold tracking-tight">
              {schoolClass.name}
            </h1>
          </div>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit Class
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetaItem label="Professor" value={schoolClass.professor} />
          <MetaItem label="Location" value={schoolClass.location} />
          <MetaItem
            label="Meets"
            value={
              schoolClass.meeting_days.length > 0
                ? `${schoolClass.meeting_days.join(", ")}${
                    schoolClass.meeting_time ? ` · ${schoolClass.meeting_time}` : ""
                  }`
                : null
            }
          />
          <MetaItem label="Office Hours" value={schoolClass.office_hours} />
        </div>
      </div>

      <div className="border-b">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                tab === item.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "assignments" && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingAssignment(null);
                setAssignmentFormOpen(true);
              }}
            >
              <Plus />
              New Assignment
            </Button>
          </div>
          {classAssignments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No assignments for this class"
              description="Add one here or import from your Google Sheet."
            />
          ) : (
            <Card className="divide-y">
              {classAssignments.map((assignment) => (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() => {
                    setEditingAssignment(assignment);
                    setAssignmentFormOpen(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm font-medium",
                      assignment.status === "complete" &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {assignment.name}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {formatDate(assignment.due_date)}
                  </span>
                  <StatusBadge status={assignment.status} />
                  <PriorityBadge priority={assignment.priority} />
                </button>
              ))}
            </Card>
          )}
        </div>
      )}

      {tab === "notes" && (
        <EmptyState
          icon={StickyNote}
          title="Notes are coming soon"
          description="Per-class notes are planned for a future release."
        />
      )}
      {tab === "files" && (
        <EmptyState
          icon={FolderOpen}
          title="Files are coming soon"
          description="Document uploads per class are planned for a future release."
        />
      )}
      {tab === "exams" && (
        <EmptyState
          icon={CalendarClock}
          title="Exam tracking is coming soon"
          description="For now, add exams as events — they show up on the Calendar and Dashboard."
        />
      )}

      <ClassFormDialog open={editOpen} onOpenChange={setEditOpen} initial={schoolClass} />
      <AssignmentFormDialog
        open={assignmentFormOpen}
        onOpenChange={setAssignmentFormOpen}
        initial={editingAssignment}
        defaultClassId={id}
      />
    </div>
  );
}
