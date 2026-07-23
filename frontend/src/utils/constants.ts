import type { AssignmentStatus, EventType, Priority } from "@/types";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const CLASS_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#64748b",
];

export const STATUS_LABELS: Record<AssignmentStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  waiting: "Waiting",
  complete: "Complete",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  exam: "Exam",
  meeting: "Meeting",
  social: "Social",
  other: "Other",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  exam: "#ef4444",
  meeting: "#3b82f6",
  social: "#10b981",
  other: "#64748b",
};

export const STATUS_OPTIONS = (
  Object.entries(STATUS_LABELS) as [AssignmentStatus, string][]
).map(([value, label]) => ({ value, label }));

export const PRIORITY_OPTIONS = (
  Object.entries(PRIORITY_LABELS) as [Priority, string][]
).map(([value, label]) => ({ value, label }));

export const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
