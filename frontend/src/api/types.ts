export interface Assignment {
  id: number;
  canvas_id: number;
  course_id: number;
  course_name: string;
  name: string;
  due_at: string | null;
  unlock_at: string | null;
  html_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  first_seen: string;
  last_seen: string;
}

export interface SyncResult {
  courses: number;
  seen: number;
  new: number;
  new_assignment_names: string[];
}
