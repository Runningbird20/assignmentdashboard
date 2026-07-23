import { ClipboardList, Plus, Sheet } from "lucide-react";
import { useMemo, useState } from "react";

import { AssignmentFormDialog } from "@/components/assignments/AssignmentFormDialog";
import {
  AssignmentsTable,
  type AssignmentSortKey,
} from "@/components/assignments/AssignmentsTable";
import { ImportSheetDialog } from "@/components/assignments/ImportSheetDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { PageLoader } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  useAssignments,
  useDeleteAssignment,
  useUpdateAssignment,
} from "@/hooks/useAssignments";
import type { Assignment, AssignmentStatus } from "@/types";
import { PRIORITY_RANK, STATUS_OPTIONS } from "@/utils/constants";

export function AssignmentsPage() {
  const { data: assignments = [], isLoading } = useAssignments();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "all">("all");
  const [sortKey, setSortKey] = useState<AssignmentSortKey>("due_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = assignments.filter((assignment) => {
      if (statusFilter !== "all" && assignment.status !== statusFilter) return false;
      if (!query) return true;
      return [assignment.name, assignment.class_name, assignment.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
    const compare = (a: Assignment, b: Assignment): number => {
      switch (sortKey) {
        case "due_date":
          return a.due_date.localeCompare(b.due_date);
        case "priority":
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case "class":
          return a.class_name.localeCompare(b.class_name);
      }
    };
    return matches.sort((a, b) => {
      const result = compare(a, b);
      return sortDirection === "asc" ? result : -result;
    });
  }, [assignments, search, statusFilter, sortKey, sortDirection]);

  const handleSort = (key: AssignmentSortKey) => {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleToggleComplete = (assignment: Assignment) => {
    const nextStatus = assignment.status === "complete" ? "todo" : "complete";
    updateAssignment.mutate(
      { id: assignment.id, payload: { status: nextStatus } },
      {
        onSuccess: () =>
          toast({
            title:
              nextStatus === "complete" ? "Marked complete" : "Moved back to todo",
            variant: "success",
          }),
        onError: (error: Error) =>
          toast({ title: "Update failed", description: error.message, variant: "destructive" }),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteAssignment.mutate(deleting.id, {
      onSuccess: () => toast({ title: "Assignment deleted", variant: "success" }),
      onError: (error: Error) =>
        toast({ title: "Delete failed", description: error.message, variant: "destructive" }),
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Everything due, across all classes."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Sheet />
              Import Google Sheet
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus />
              New Assignment
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search assignments…"
          className="w-full sm:w-72"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AssignmentStatus | "all")}
          className="w-40"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            assignments.length === 0 ? "No assignments yet" : "No matching assignments"
          }
          description={
            assignments.length === 0
              ? "Create one manually or import them from a Google Sheet."
              : "Try a different search or filter."
          }
        />
      ) : (
        <Card>
          <AssignmentsTable
            assignments={filtered}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={(assignment) => {
              setEditing(assignment);
              setFormOpen(true);
            }}
            onDelete={setDeleting}
            onToggleComplete={handleToggleComplete}
          />
        </Card>
      )}

      <AssignmentFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      <ImportSheetDialog open={importOpen} onOpenChange={setImportOpen} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete "${deleting?.name ?? "assignment"}"?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
