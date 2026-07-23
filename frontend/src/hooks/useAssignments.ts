import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import * as assignmentsApi from "@/api/assignments";
import type { AssignmentPayload } from "@/types";

function invalidateAssignmentData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["assignments"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useAssignments() {
  return useQuery({
    queryKey: ["assignments"],
    queryFn: assignmentsApi.fetchAssignments,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignmentPayload) =>
      assignmentsApi.createAssignment(payload),
    onSuccess: () => invalidateAssignmentData(queryClient),
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<AssignmentPayload>;
    }) => assignmentsApi.updateAssignment(id, payload),
    onSuccess: () => invalidateAssignmentData(queryClient),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => assignmentsApi.deleteAssignment(id),
    onSuccess: () => invalidateAssignmentData(queryClient),
  });
}
