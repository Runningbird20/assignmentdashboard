import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AssignmentFormDialog } from "@/components/assignments/AssignmentFormDialog";
import { ClassFilesTab } from "@/components/classes/ClassFilesTab";
import { ClassFormDialog } from "@/components/classes/ClassFormDialog";
import { ClassNotesTab } from "@/components/classes/ClassNotesTab";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionTypeBadge } from "@/components/shared/SectionTypeBadge";
import { PageLoader } from "@/components/shared/Spinner";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAssignments } from "@/hooks/useAssignments";
import { useClass, useClasses, useDeleteClass } from "@/hooks/useClasses";
import type { Assignment, SchoolClass } from "@/types";
import { cn } from "@/utils/cn";
import { courseGroupHeading, extractCourseCode, stripSectionTypeSuffix } from "@/utils/courseCode";
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

function SectionRow({
  section,
  onEdit,
  onDelete,
}: {
  section: SchoolClass;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4">
      <span
        className="mt-1 size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: section.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {section.section_type ? (
            <SectionTypeBadge sectionType={section.section_type} />
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Type not set
            </Badge>
          )}
        </div>
        <div className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground">
          {section.meeting_days.length > 0 && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-3 shrink-0" />
              {section.meeting_days.join(", ")}
              {section.meeting_time ? ` · ${section.meeting_time}` : ""}
            </div>
          )}
          {section.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3 shrink-0" />
              {section.location}
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onEdit}
          aria-label={`Edit ${section.name}`}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-red-500"
          onClick={onDelete}
          aria-label={`Delete ${section.name}`}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

export function ClassDetailPage() {
  const { classId } = useParams();
  const id = Number(classId);
  const { data: schoolClass, isLoading, isError } = useClass(id);
  const { data: allClasses = [] } = useClasses();
  const { data: assignments = [] } = useAssignments();
  const deleteClass = useDeleteClass();
  const { toast } = useToast();

  const [tab, setTab] = useState<TabKey>("assignments");
  const [editingSection, setEditingSection] = useState<SchoolClass | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingSection, setDeletingSection] = useState<SchoolClass | null>(null);
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

  // Lecture/lab/recitation/exam sections of the same course share a code
  // (e.g. "MATH 1554: ...") — this page always shows the whole course, not
  // an isolated single section, no matter which section's URL got you here.
  const courseCode = extractCourseCode(schoolClass.name);
  const sections = allClasses.filter(
    (c) => extractCourseCode(c.name).toLowerCase() === courseCode.toLowerCase(),
  );
  const isGrouped = sections.length > 1;
  const primarySection = sections[0] ?? schoolClass;
  const sectionIds = new Set(sections.map((section) => section.id));

  const heading = isGrouped
    ? courseGroupHeading(primarySection, courseCode)
    : stripSectionTypeSuffix(schoolClass.name, schoolClass.section_type);

  const openEditFor = (section: SchoolClass) => {
    setEditingSection(section);
    setEditOpen(true);
  };

  const handleDeleteSection = () => {
    if (!deletingSection) return;
    deleteClass.mutate(deletingSection.id, {
      onSuccess: () => toast({ title: "Section deleted", variant: "success" }),
      onError: (error: Error) =>
        toast({ title: "Could not delete section", description: error.message, variant: "destructive" }),
    });
  };

  const classAssignments = assignments.filter((assignment) =>
    sectionIds.has(assignment.class_id),
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

        {isGrouped ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Layers className="size-5 shrink-0 text-muted-foreground" />
              <h1 className="text-xl font-semibold tracking-tight">{heading}</h1>
              <Badge variant="secondary">{sections.length} sections</Badge>
            </div>
            <Card className="mt-4 divide-y">
              {sections.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  onEdit={() => openEditFor(section)}
                  onDelete={() => setDeletingSection(section)}
                />
              ))}
            </Card>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: schoolClass.color }}
                />
                <h1 className="text-xl font-semibold tracking-tight">{heading}</h1>
                {schoolClass.section_type ? (
                  <SectionTypeBadge sectionType={schoolClass.section_type} />
                ) : null}
              </div>
              <Button variant="outline" onClick={() => openEditFor(schoolClass)}>
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
          </>
        )}
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
                  {isGrouped && (
                    <span className="hidden max-w-32 truncate text-xs text-muted-foreground sm:block">
                      {assignment.class_name}
                    </span>
                  )}
                  <StatusBadge status={assignment.status} />
                  <PriorityBadge priority={assignment.priority} />
                </button>
              ))}
            </Card>
          )}
        </div>
      )}

      {tab === "notes" && <ClassNotesTab classId={primarySection.id} />}
      {tab === "files" && <ClassFilesTab classId={primarySection.id} />}
      {tab === "exams" && (
        <EmptyState
          icon={CalendarClock}
          title="Exam tracking is coming soon"
          description="For now, add exams as events — they show up on the Calendar and Dashboard."
        />
      )}

      <ClassFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={editingSection}
      />
      <ConfirmDialog
        open={deletingSection !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingSection(null);
        }}
        title={`Delete ${deletingSection?.name ?? "this section"}?`}
        description="This also deletes every assignment in this section. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteSection}
      />
      <AssignmentFormDialog
        open={assignmentFormOpen}
        onOpenChange={setAssignmentFormOpen}
        initial={editingAssignment}
        defaultClassId={primarySection.id}
      />
    </div>
  );
}
