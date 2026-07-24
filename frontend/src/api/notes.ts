import { api } from "@/api/client";
import type { Note, NotePayload } from "@/types";

export const fetchNotes = (classId: number) =>
  api.get<Note[]>(`/notes?class_id=${classId}`);

export const createNote = (payload: NotePayload) => api.post<Note>("/notes", payload);

export const updateNote = (id: number, payload: Partial<NotePayload>) =>
  api.put<Note>(`/notes/${id}`, payload);

export const deleteNote = (id: number) => api.delete(`/notes/${id}`);
