import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Pencil, Repeat, RotateCcw, Trash2 } from "lucide-react";

import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Assignment } from "@/types";
import { cn } from "@/utils/cn";
import { describeRecurrence } from "@/utils/constants";
import { describeDueDate, formatDate } from "@/utils/date";

export type AssignmentSortKey = "due_date" | "priority" | "class";

const dueToneClasses = {
  overdue: "text-red-600 dark:text-red-400",
  today: "text-amber-600 dark:text-amber-400",
  soon: "text-muted-foreground",
  normal: "text-muted-foreground",
};

function SortableHead({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: AssignmentSortKey;
  activeKey: AssignmentSortKey;
  direction: "asc" | "desc";
  onSort: (key: AssignmentSortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  const Icon = isActive ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          isActive && "text-foreground",
        )}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </TableHead>
  );
}

export function AssignmentsTable({
  assignments,
  sortKey,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  assignments: Assignment[];
  sortKey: AssignmentSortKey;
  sortDirection: "asc" | "desc";
  onSort: (key: AssignmentSortKey) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  onToggleComplete: (assignment: Assignment) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead
            label="Class"
            sortKey="class"
            activeKey={sortKey}
            direction={sortDirection}
            onSort={onSort}
          />
          <TableHead>Assignment</TableHead>
          <SortableHead
            label="Due Date"
            sortKey="due_date"
            activeKey={sortKey}
            direction={sortDirection}
            onSort={onSort}
          />
          <TableHead>Status</TableHead>
          <SortableHead
            label="Priority"
            sortKey="priority"
            activeKey={sortKey}
            direction={sortDirection}
            onSort={onSort}
          />
          <TableHead className="hidden lg:table-cell">Notes</TableHead>
          <TableHead className="w-28 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => {
          const due = describeDueDate(assignment.due_date);
          const isComplete = assignment.status === "complete";
          return (
            <TableRow key={assignment.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: assignment.class_color }}
                  />
                  <span className="max-w-40 truncate text-muted-foreground">
                    {assignment.class_name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "font-medium",
                      isComplete && "text-muted-foreground line-through",
                    )}
                  >
                    {assignment.name}
                  </span>
                  {assignment.recurrence_frequency ? (
                    <span
                      title={describeRecurrence(
                        assignment.recurrence_frequency,
                        assignment.recurrence_interval,
                      )}
                      className="shrink-0"
                    >
                      <Repeat className="size-3 text-muted-foreground" />
                    </span>
                  ) : null}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{formatDate(assignment.due_date)}</span>
                  {!isComplete && (
                    <span className={cn("text-xs", dueToneClasses[due.tone])}>
                      {due.label}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={assignment.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={assignment.priority} />
              </TableCell>
              <TableCell className="hidden max-w-52 lg:table-cell">
                <span className="block truncate text-muted-foreground">
                  {assignment.notes ?? "—"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onToggleComplete(assignment)}
                    aria-label={isComplete ? "Mark as todo" : "Mark complete"}
                    title={isComplete ? "Mark as todo" : "Mark complete"}
                  >
                    {isComplete ? (
                      <RotateCcw />
                    ) : (
                      <CheckCircle2 className="text-emerald-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onEdit(assignment)}
                    aria-label="Edit assignment"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-red-500"
                    onClick={() => onDelete(assignment)}
                    aria-label="Delete assignment"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
