import { api } from "@/api/client";
import type { ClassPayload, SchoolClass } from "@/types";

export const fetchClasses = () => api.get<SchoolClass[]>("/classes");

export const fetchClass = (id: number) => api.get<SchoolClass>(`/classes/${id}`);

export const createClass = (payload: ClassPayload) =>
  api.post<SchoolClass>("/classes", payload);

export const updateClass = (id: number, payload: Partial<ClassPayload>) =>
  api.put<SchoolClass>(`/classes/${id}`, payload);

export const deleteClass = (id: number) => api.delete(`/classes/${id}`);
