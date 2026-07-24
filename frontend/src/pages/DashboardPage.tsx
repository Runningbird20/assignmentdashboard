import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ListTodo,
  PartyPopper,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { SectionTypeBadge } from "@/components/shared/SectionTypeBadge";
import { PageLoader } from "@/components/shared/Spinner";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboard } from "@/hooks/useDashboard";
import type { Assignment } from "@/types";
import { cn } from "@/utils/cn";
import { EVENT_TYPE_LABELS } from "@/utils/constants";
import { stripSectionTypeSuffix } from "@/utils/courseCode";
import { describeDueDate, formatDate, formatDateTime, greeting } from "@/utils/date";

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">{children}</CardContent>
    </Card>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="py-2 text-sm text-muted-foreground">{text}</p>;
}

function AssignmentLine({ assignment }: { assignment: Assignment }) {
  const due = describeDueDate(assignment.due_date);
  return (
    <Link
      to="/assignments"
      className="flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-accent"
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: assignment.class_color }}
      />
      <span className="min-w-0 flex-1 truncate text-sm">{assignment.name}</span>
      <span
        className={cn(
          "shrink-0 text-xs",
          due.tone === "overdue"
            ? "text-red-600 dark:text-red-400"
            : due.tone === "today"
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground",
        )}
      >
        {due.label}
      </span>
    </Link>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) return <PageLoader />;

  const { stats } = data;
  const hasTasksToday =
    data.todays_tasks.assignments.length > 0 || data.todays_tasks.todos.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{greeting()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(data.date, "EEEE, MMMM d")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Classes" value={stats.total_classes} icon={BookOpen} />
        <StatCard
          label="Assignments Remaining"
          value={stats.assignments_remaining}
          icon={ClipboardList}
        />
        <StatCard
          label="Due This Week"
          value={stats.due_this_week}
          icon={CalendarClock}
        />
        <StatCard
          label="Completed"
          value={stats.completed_assignments}
          icon={CheckCircle2}
        />
        <StatCard label="To-dos Remaining" value={stats.todos_remaining} icon={ListTodo} />
        <StatCard
          label="Overdue"
          value={stats.overdue_assignments}
          icon={AlertTriangle}
          tone={stats.overdue_assignments > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <SectionCard title="Today's Schedule">
          {data.todays_schedule.length === 0 ? (
            <EmptyLine text="No classes today." />
          ) : (
            data.todays_schedule.map((schoolClass) => (
              <Link
                key={schoolClass.id}
                to={`/classes/${schoolClass.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 hover:bg-accent"
              >
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: schoolClass.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {stripSectionTypeSuffix(schoolClass.name, schoolClass.section_type)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[schoolClass.meeting_time, schoolClass.location]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {schoolClass.section_type ? (
                  <SectionTypeBadge sectionType={schoolClass.section_type} />
                ) : null}
              </Link>
            ))
          )}
        </SectionCard>

        <SectionCard title="Today's Tasks">
          {!hasTasksToday ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <PartyPopper className="size-4" />
              Nothing due today.
            </div>
          ) : (
            <>
              {data.todays_tasks.assignments.map((assignment) => (
                <AssignmentLine key={`a-${assignment.id}`} assignment={assignment} />
              ))}
              {data.todays_tasks.todos.map((todo) => (
                <Link
                  key={`t-${todo.id}`}
                  to="/todos"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-accent"
                >
                  <ListTodo className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm">{todo.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">To-do</span>
                </Link>
              ))}
            </>
          )}
        </SectionCard>

        <SectionCard title="Due Today">
          {data.due_today.length === 0 ? (
            <EmptyLine text="No assignments due today." />
          ) : (
            data.due_today.map((assignment) => (
              <AssignmentLine key={assignment.id} assignment={assignment} />
            ))
          )}
        </SectionCard>

        <SectionCard title="Due This Week">
          {data.due_this_week.length === 0 ? (
            <EmptyLine text="Nothing due in the next seven days." />
          ) : (
            data.due_this_week.map((assignment) => (
              <AssignmentLine key={assignment.id} assignment={assignment} />
            ))
          )}
        </SectionCard>

        <SectionCard title="Upcoming Events">
          {data.upcoming_events.length === 0 ? (
            <EmptyLine text="No events in the next seven days." />
          ) : (
            data.upcoming_events.map((event) => (
              <Link
                key={event.id}
                to="/calendar"
                className="flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 hover:bg-accent"
              >
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[formatDateTime(event.start_time), event.location]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Badge variant="secondary">{EVENT_TYPE_LABELS[event.type]}</Badge>
              </Link>
            ))
          )}
        </SectionCard>
      </div>
    </div>
  );
}
