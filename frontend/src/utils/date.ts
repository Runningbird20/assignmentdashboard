export function formatDueDate(dueAt: string | null): string {
  if (!dueAt) {
    return "No due date";
  }
  const date = new Date(dueAt);
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
