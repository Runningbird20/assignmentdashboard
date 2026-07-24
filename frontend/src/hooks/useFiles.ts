import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as filesApi from "@/api/files";

export function useFiles(classId: number) {
  return useQuery({
    queryKey: ["files", classId],
    queryFn: () => filesApi.fetchFiles(classId),
  });
}

export function useUploadFile(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => filesApi.uploadFile(classId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", classId] }),
  });
}

export function useDeleteFile(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => filesApi.deleteFile(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", classId] }),
  });
}
