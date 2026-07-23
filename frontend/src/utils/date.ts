import {
  differenceInCalendarDays,
  format,
  isToday,
  isTomorrow,
  parseISO,
} from "date-fns";

export function formatDate(iso: string, pattern = "MMM d, yyyy"): string {
  return format(parseISO(iso), pattern);
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "EEE, MMM d · h:mm a");
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), "h:mm a");
}

export type DueTone = "overdue" | "today" | "soon" | "normal";

/** A short human label for a due date, plus a tone for styling. */
export function describeDueDate(iso: string): { label: string; tone: DueTone } {
  const due = parseISO(iso);
  const days = differenceInCalendarDays(due, new Date());
  if (days < 0) {
    return {
      label: days === -1 ? "1 day overdue" : `${-days} days overdue`,
      tone: "overdue",
    };
  }
  if (isToday(due)) return { label: "Today", tone: "today" };
  if (isTomorrow(due)) return { label: "Tomorrow", tone: "soon" };
  if (days <= 7) return { label: format(due, "EEEE"), tone: "soon" };
  return { label: format(due, "MMM d"), tone: "normal" };
}

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}
