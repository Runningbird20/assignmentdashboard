import type { Assignment, EventItem, SchoolClass, Todo } from "@/types";

export type CalendarEntry =
  | { kind: "class"; key: string; title: string; color: string; data: SchoolClass }
  | { kind: "assignment"; key: string; title: string; color: string; data: Assignment }
  | { kind: "todo"; key: string; title: string; color: string; data: Todo }
  | { kind: "event"; key: string; title: string; color: string; data: EventItem };
