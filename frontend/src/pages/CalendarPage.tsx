import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { EntryDetailsDialog } from "@/components/calendar/EntryDetailsDialog";
import type { CalendarEntry } from "@/components/calendar/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAssignments } from "@/hooks/useAssignments";
import { useClasses } from "@/hooks/useClasses";
import { useEvents } from "@/hooks/useEvents";
import { useTodos } from "@/hooks/useTodos";
import { cn } from "@/utils/cn";
import { EVENT_TYPE_COLORS } from "@/utils/constants";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MAX_VISIBLE_ENTRIES = 3;

function EntryChip({
  entry,
  onClick,
}: {
  entry: CalendarEntry;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] leading-tight hover:bg-accent"
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: entry.color }}
      />
      <span
        className={cn(
          "truncate",
          entry.kind === "todo" && entry.data.completed && "line-through opacity-60",
        )}
      >
        {entry.title}
      </span>
    </button>
  );
}

export function CalendarPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const { data: classes = [] } = useClasses();
  const { data: assignments = [] } = useAssignments();
  const { data: todos = [] } = useTodos();
  const { data: events = [] } = useEvents();

  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month],
  );

  const entriesByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    const push = (key: string, entry: CalendarEntry) => {
      const list = map.get(key);
      if (list) list.push(entry);
      else map.set(key, [entry]);
    };

    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      const abbrev = DAY_LABELS[getDay(day)];
      for (const schoolClass of classes) {
        if (schoolClass.meeting_days.includes(abbrev)) {
          push(key, {
            kind: "class",
            key: `class-${schoolClass.id}-${key}`,
            title: schoolClass.name,
            color: schoolClass.color,
            data: schoolClass,
          });
        }
      }
    }
    for (const assignment of assignments) {
      push(assignment.due_date, {
        kind: "assignment",
        key: `assignment-${assignment.id}`,
        title: assignment.name,
        color: assignment.class_color,
        data: assignment,
      });
    }
    for (const todo of todos) {
      if (!todo.due_date) continue;
      push(todo.due_date, {
        kind: "todo",
        key: `todo-${todo.id}`,
        title: todo.title,
        color: "#64748b",
        data: todo,
      });
    }
    for (const event of events) {
      push(format(parseISO(event.start_time), "yyyy-MM-dd"), {
        kind: "event",
        key: `event-${event.id}`,
        title: event.title,
        color: EVENT_TYPE_COLORS[event.type],
        data: event,
      });
    }
    return map;
  }, [days, classes, assignments, todos, events]);

  const selectedDayEntries = selectedDayKey
    ? (entriesByDay.get(selectedDayKey) ?? [])
    : [];

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Classes, assignments, to-dos and events in one month view."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMonth((current) => subMonths(current, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft />
            </Button>
            <span className="w-36 text-center text-sm font-medium">
              {format(month, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMonth((current) => addMonths(current, 1))}
              aria-label="Next month"
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              onClick={() => setMonth(startOfMonth(new Date()))}
            >
              Today
            </Button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl border bg-border">
        <div className="grid grid-cols-7 gap-px">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="bg-card px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const entries = entriesByDay.get(key) ?? [];
            const overflow = entries.length - MAX_VISIBLE_ENTRIES;
            return (
              <div
                key={key}
                className={cn(
                  "min-h-24 bg-card p-1.5 md:min-h-28",
                  !isSameMonth(day, month) && "bg-muted/40",
                )}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs",
                      isToday(day)
                        ? "bg-primary font-semibold text-primary-foreground"
                        : !isSameMonth(day, month)
                          ? "text-muted-foreground"
                          : "",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {entries.slice(0, MAX_VISIBLE_ENTRIES).map((entry) => (
                    <EntryChip
                      key={entry.key}
                      entry={entry}
                      onClick={() => setSelectedEntry(entry)}
                    />
                  ))}
                  {overflow > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDayKey(key)}
                      className="rounded px-1 py-0.5 text-left text-[11px] text-muted-foreground hover:bg-accent"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EntryDetailsDialog
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />

      <Dialog
        open={selectedDayKey !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDayKey(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDayKey
                ? format(parseISO(selectedDayKey), "EEEE, MMMM d")
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            {selectedDayEntries.map((entry) => (
              <EntryChip
                key={entry.key}
                entry={entry}
                onClick={() => {
                  setSelectedDayKey(null);
                  setSelectedEntry(entry);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
