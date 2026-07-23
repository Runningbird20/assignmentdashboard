import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useImportSheet } from "@/hooks/useImportSheet";
import { useSettings } from "@/hooks/useSettings";
import type { ImportSummary } from "@/types";

export function ImportSheetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, update } = useSettings();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const importSheet = useImportSheet();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setUrl(settings.sheetUrl);
      setResult(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleImport = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste your Google Sheet URL first.");
      return;
    }
    setError(null);
    setResult(null);
    importSheet.mutate(trimmed, {
      onSuccess: (summary) => {
        setResult(summary);
        update({ sheetUrl: trimmed });
        toast({
          title: "Import finished",
          description: `${summary.created} new, ${summary.updated} updated, ${summary.skipped} unchanged.`,
          variant: "success",
        });
      },
      onError: (importError: Error) => setError(importError.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Google Sheet</DialogTitle>
          <DialogDescription>
            The first row must contain the headers Class, Assignment Name and Due
            Date. Extra columns are ignored. The sheet must be shared as “Anyone
            with the link can view”.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sheet-url">Sheet URL</Label>
            <Input
              id="sheet-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
            />
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {result ? (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p>
                <span className="font-medium">{result.created}</span> new ·{" "}
                <span className="font-medium">{result.updated}</span> due dates
                updated · <span className="font-medium">{result.skipped}</span>{" "}
                unchanged
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-xs text-amber-600 dark:text-amber-400">
                  {result.errors.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleImport} disabled={importSheet.isPending}>
            {importSheet.isPending ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
