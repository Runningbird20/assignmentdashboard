import { api } from "@/api/client";
import type { Assignment, AssignmentPayload } from "@/types";

export const fetchAssignments = () => api.get<Assignment[]>("/assignments");

export const createAssignment = (payload: AssignmentPayload) =>
  api.post<Assignment>("/assignments", payload);

export const updateAssignment = (id: number, payload: Partial<AssignmentPayload>) =>
  api.put<Assignment>(`/assignments/${id}`, payload);

export const deleteAssignment = (id: number) => api.delete(`/assignments/${id}`);
