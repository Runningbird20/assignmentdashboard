import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import * as classesApi from "@/api/classes";
import type { ClassPayload } from "@/types";

function invalidateClassData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["classes"] });
  queryClient.invalidateQueries({ queryKey: ["assignments"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useClasses() {
  return useQuery({ queryKey: ["classes"], queryFn: classesApi.fetchClasses });
}

export function useClass(id: number) {
  return useQuery({
    queryKey: ["classes", id],
    queryFn: () => classesApi.fetchClass(id),
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClassPayload) => classesApi.createClass(payload),
    onSuccess: () => invalidateClassData(queryClient),
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ClassPayload> }) =>
      classesApi.updateClass(id, payload),
    onSuccess: () => invalidateClassData(queryClient),
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => classesApi.deleteClass(id),
    onSuccess: () => invalidateClassData(queryClient),
  });
}
