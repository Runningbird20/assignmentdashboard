import { useMutation, useQueryClient } from "@tanstack/react-query";

import * as importApi from "@/api/importSheet";

export function useImportSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sheetUrl: string) => importApi.importGoogleSheet(sheetUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
