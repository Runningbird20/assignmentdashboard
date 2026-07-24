import { api } from "@/api/client";
import type { IcsParseResult } from "@/types";

export function parseGtScheduleIcs(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return api.postForm<IcsParseResult>("/import/gt-schedule", formData);
}
