import { useNavigate } from "react-router-dom";

import type { CalendarEntry } from "@/components/calendar/types";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReactNode } from "react";
import { EVENT_TYPE_LABELS } from "@/utils/constants";
import { formatDate, formatDateTime, formatTime } from "@/utils/date";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

function EntryBody({
  entry,
  onClose,
}: {
  entry: CalendarEntry;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const title = (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        {entry.title}
      </DialogTitle>
    </DialogHeader>
  );

  switch (entry.kind) {
    case "class":
      return (
        <>
          {title}
          <div className="divide-y">
            <DetailRow label="Professor">{entry.data.professor ?? "—"}</DetailRow>
            <DetailRow label="Location">{entry.data.location ?? "—"}</DetailRow>
            <DetailRow label="Meets">
              {entry.data.meeting_days.join(", ") || "—"}
              {entry.data.meeting_time ? ` · ${entry.data.meeting_time}` : ""}
            </DetailRow>
            <DetailRow label="Office Hours">{entry.data.office_hours ?? "—"}</DetailRow>
          </div>
          <DialogFooter>
            <Button onClick={() => goTo(`/classes/${entry.data.id}`)}>View Class</Button>
          </DialogFooter>
        </>
      );
    case "assignment":
      return (
        <>
          {title}
          <div className="divide-y">
            <DetailRow label="Class">{entry.data.class_name}</DetailRow>
            <DetailRow label="Due">{formatDate(entry.data.due_date)}</DetailRow>
            <DetailRow label="Status">
              <StatusBadge status={entry.data.status} />
            </DetailRow>
            <DetailRow label="Priority">
              <PriorityBadge priority={entry.data.priority} />
            </DetailRow>
            {entry.data.notes ? (
              <DetailRow label="Notes">{entry.data.notes}</DetailRow>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={() => goTo("/assignments")}>Open Assignments</Button>
          </DialogFooter>
        </>
      );
    case "todo":
      return (
        <>
          {title}
          <div className="divide-y">
            <DetailRow label="Due">
              {entry.data.due_date ? formatDate(entry.data.due_date) : "—"}
            </DetailRow>
            <DetailRow label="Priority">
              <PriorityBadge priority={entry.data.priority} />
            </DetailRow>
            <DetailRow label="Status">
              {entry.data.completed ? "Completed" : "Open"}
            </DetailRow>
            {entry.data.description ? (
              <DetailRow label="Notes">{entry.data.description}</DetailRow>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={() => goTo("/todos")}>Open To-dos</Button>
          </DialogFooter>
        </>
      );
    case "event":
      return (
        <>
          {title}
          <div className="divide-y">
            <DetailRow label="Type">
              <Badge variant="secondary">{EVENT_TYPE_LABELS[entry.data.type]}</Badge>
            </DetailRow>
            <DetailRow label="When">
              {formatDateTime(entry.data.start_time)}
              {entry.data.end_time ? ` – ${formatTime(entry.data.end_time)}` : ""}
            </DetailRow>
            <DetailRow label="Location">{entry.data.location ?? "—"}</DetailRow>
          </div>
        </>
      );
  }
}

export function EntryDetailsDialog({
  entry,
  onClose,
}: {
  entry: CalendarEntry | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={entry !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        {entry ? <EntryBody entry={entry} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
