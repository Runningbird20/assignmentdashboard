import { api } from "@/api/client";
import type { ImportSummary } from "@/types";

export const importGoogleSheet = (sheetUrl: string) =>
  api.post<ImportSummary>("/import/google-sheet", { sheet_url: sheetUrl });
