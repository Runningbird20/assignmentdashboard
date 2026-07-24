export type Priority = "low" | "medium" | "high";
export type AssignmentStatus = "todo" | "in_progress" | "waiting" | "complete";
export type EventType = "exam" | "meeting" | "social" | "other";
export type SectionType = "lecture" | "lab" | "recitation" | "exam" | "other";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export interface SchoolClass {
  id: number;
  name: string;
  professor: string | null;
  location: string | null;
  meeting_days: string[];
  meeting_time: string | null;
  office_hours: string | null;
  color: string;
  section_type: SectionType | null;
  created_at: string;
  updated_at: string;
}

export interface ClassPayload {
  name: string;
  professor?: string | null;
  location?: string | null;
  meeting_days: string[];
  meeting_time?: string | null;
  office_hours?: string | null;
  color: string;
  section_type?: SectionType | null;
}

export interface Assignment {
  id: number;
  class_id: number;
  class_name: string;
  class_color: string;
  name: string;
  due_date: string;
  status: AssignmentStatus;
  priority: Priority;
  notes: string | null;
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_interval: number;
  created_at: string;
  updated_at: string;
}

export interface AssignmentPayload {
  class_id: number;
  name: string;
  due_date: string;
  status: AssignmentStatus;
  priority: Priority;
  notes?: string | null;
  recurrence_frequency?: RecurrenceFrequency | null;
  recurrence_interval?: number;
}

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  completed: boolean;
  due_date: string | null;
  sort_order: number;
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_interval: number;
  created_at: string;
  updated_at: string;
}

export interface TodoPayload {
  title: string;
  description?: string | null;
  priority: Priority;
  completed?: boolean;
  due_date?: string | null;
  recurrence_frequency?: RecurrenceFrequency | null;
  recurrence_interval?: number;
}

export interface EventItem {
  id: number;
  title: string;
  location: string | null;
  start_time: string;
  end_time: string | null;
  type: EventType;
}

export interface DashboardStats {
  total_classes: number;
  assignments_remaining: number;
  due_this_week: number;
  completed_assignments: number;
  todos_remaining: number;
  overdue_assignments: number;
}

export interface DashboardData {
  date: string;
  todays_schedule: SchoolClass[];
  todays_tasks: {
    assignments: Assignment[];
    todos: Todo[];
  };
  due_today: Assignment[];
  due_this_week: Assignment[];
  upcoming_events: EventItem[];
  stats: DashboardStats;
}

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface ParsedClassPreview {
  name: string;
  professor: string | null;
  location: string | null;
  meeting_days: string[];
  meeting_time: string | null;
  color: string;
  warning: string | null;
  section_type: SectionType | null;
  needs_section_type: boolean;
}

export interface IcsParseResult {
  classes: ParsedClassPreview[];
  skipped_events: number;
  warnings: string[];
}

export interface ClassFile {
  id: number;
  class_id: number;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  created_at: string;
}

export interface Note {
  id: number;
  class_id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface NotePayload {
  class_id: number;
  title: string;
  body?: string;
}
