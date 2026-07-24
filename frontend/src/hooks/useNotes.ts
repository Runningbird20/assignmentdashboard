import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as notesApi from "@/api/notes";
import type { NotePayload } from "@/types";

export function useNotes(classId: number) {
  return useQuery({
    queryKey: ["notes", classId],
    queryFn: () => notesApi.fetchNotes(classId),
  });
}

export function useCreateNote(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotePayload) => notesApi.createNote(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes", classId] }),
  });
}

export function useUpdateNote(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<NotePayload> }) =>
      notesApi.updateNote(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes", classId] }),
  });
}

export function useDeleteNote(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notesApi.deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes", classId] }),
  });
}
