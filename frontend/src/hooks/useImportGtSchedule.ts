import { useMutation } from "@tanstack/react-query";

import { parseGtScheduleIcs } from "@/api/icsImport";

export function useImportGtSchedule() {
  return useMutation({
    mutationFn: (file: File) => parseGtScheduleIcs(file),
  });
}
