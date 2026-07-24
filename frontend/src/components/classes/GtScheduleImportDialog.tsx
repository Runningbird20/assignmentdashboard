import { AlertTriangle, FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

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
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useCreateClass } from "@/hooks/useClasses";
import { useImportGtSchedule } from "@/hooks/useImportGtSchedule";
import type { ParsedClassPreview, SectionType } from "@/types";
import { cn } from "@/utils/cn";
import {
  CLASS_COLORS,
  SECTION_TYPE_LABELS,
  SECTION_TYPE_OPTIONS,
  WEEKDAYS,
} from "@/utils/constants";

interface EditableRow extends ParsedClassPreview {
  included: boolean;
}

type Stage = "upload" | "review";

function toRows(classes: ParsedClassPreview[]): EditableRow[] {
  return classes.map((c) => ({ ...c, included: true }));
}

/** The name a row will actually be saved with: repeated course codes are
 * disambiguated by their confirmed section type, not by meeting days. */
function finalName(row: EditableRow): string {
  if (row.needs_section_type && row.section_type) {
    return `${row.name} (${SECTION_TYPE_LABELS[row.section_type]})`;
  }
  return row.name;
}

export function GtScheduleImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [stage, setStage] = useState<Stage>("upload");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [skippedEvents, setSkippedEvents] = useState(0);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseIcs = useImportGtSchedule();
  const createClass = useCreateClass();
  const { toast } = useToast();

  const reset = () => {
    setStage("upload");
    setRows([]);
    setSkippedEvents(0);
    setParseWarnings([]);
    setError(null);
    setReviewError(null);
    setImporting(false);
  };

  const handleFile = (file: File) => {
    setError(null);
    parseIcs.mutate(file, {
      onSuccess: (result) => {
        if (result.classes.length === 0) {
          setError(
            result.warnings[0] ??
              "No classes were found in that .ics file.",
          );
          return;
        }
        setRows(toRows(result.classes));
        setSkippedEvents(result.skipped_events);
        setParseWarnings(result.warnings);
        setStage("review");
      },
      onError: (parseError: Error) => setError(parseError.message),
    });
  };

  const updateRow = (index: number, patch: Partial<EditableRow>) => {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const toggleDay = (index: number, day: string) => {
    setRows((current) =>
      current.map((row, i) => {
        if (i !== index) return row;
        const meeting_days = row.meeting_days.includes(day)
          ? row.meeting_days.filter((d) => d !== day)
          : [...row.meeting_days, day];
        return { ...row, meeting_days };
      }),
    );
  };

  const handleImport = async () => {
    const included = rows.filter((row) => row.included);
    if (included.length === 0) return;

    const missingType = included.find(
      (row) => row.needs_section_type && !row.section_type,
    );
    if (missingType) {
      setReviewError(
        `"${missingType.name}" shares a course code with another section — choose whether it's the Lecture, Lab, Recitation, or Exam before importing.`,
      );
      return;
    }
    setReviewError(null);

    setImporting(true);
    let created = 0;
    const errors: string[] = [];

    for (const row of included) {
      try {
        await createClass.mutateAsync({
          name: finalName(row),
          professor: row.professor,
          location: row.location,
          meeting_days: WEEKDAYS.filter((day) => row.meeting_days.includes(day)),
          meeting_time: row.meeting_time,
          color: row.color,
          section_type: row.section_type,
        });
        created += 1;
      } catch (mutationError) {
        const message =
          mutationError instanceof Error ? mutationError.message : "Import failed";
        errors.push(`${row.name}: ${message}`);
      }
    }

    setImporting(false);
    toast({
      title: `${created} of ${included.length} classes imported`,
      description: errors.length > 0 ? errors.join(" · ") : undefined,
      variant: errors.length > 0 ? "destructive" : "success",
    });
    if (errors.length === 0) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from GT Scheduler</DialogTitle>
          <DialogDescription>
            Upload the .ics file exported from GT Scheduler. Review and edit
            anything below before importing — professor names aren't included
            in the export, so add those manually if you'd like them.
          </DialogDescription>
        </DialogHeader>

        {stage === "upload" && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={parseIcs.isPending}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-60"
            >
              {parseIcs.isPending ? (
                <>
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Reading your schedule…
                  </p>
                </>
              ) : (
                <>
                  <FileUp className="size-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload an .ics file</p>
                  <p className="text-xs text-muted-foreground">
                    Exported from GT Scheduler, up to 5 MB
                  </p>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
                event.target.value = "";
              }}
            />
            {error ? (
              <p className="flex items-start gap-2 text-sm text-red-500">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            ) : null}
          </div>
        )}

        {stage === "review" && (
          <div className="flex flex-col gap-4">
            {(skippedEvents > 0 || parseWarnings.length > 0) && (
              <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                {skippedEvents > 0 && (
                  <p>
                    Ignored {skippedEvents} event{skippedEvents === 1 ? "" : "s"}{" "}
                    that didn't look like a class.
                  </p>
                )}
                {parseWarnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            )}

            <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto pr-1">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border p-3",
                    !row.included && "opacity-50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.included}
                      onChange={(e) => updateRow(index, { included: e.target.checked })}
                      className="size-4 shrink-0 cursor-pointer accent-primary"
                      aria-label={`Include ${row.name || "this class"}`}
                    />
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(index, { name: e.target.value })}
                      placeholder="Class name"
                      className="font-medium"
                    />
                    <div className="flex shrink-0 gap-1">
                      {CLASS_COLORS.slice(0, 5).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateRow(index, { color })}
                          className={cn(
                            "size-6 rounded-full border-2 transition-transform",
                            row.color === color
                              ? "scale-110 border-foreground"
                              : "border-transparent",
                          )}
                          style={{ backgroundColor: color }}
                        >
                          <span className="sr-only">{color}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Professor
                      </Label>
                      <Input
                        value={row.professor ?? ""}
                        onChange={(e) =>
                          updateRow(index, { professor: e.target.value || null })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Location
                      </Label>
                      <Input
                        value={row.location ?? ""}
                        onChange={(e) =>
                          updateRow(index, { location: e.target.value || null })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">
                        Meeting Time
                      </Label>
                      <Input
                        value={row.meeting_time ?? ""}
                        onChange={(e) =>
                          updateRow(index, { meeting_time: e.target.value || null })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(index, day)}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                          row.meeting_days.includes(day)
                            ? "border-primary bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  {row.needs_section_type ? (
                    <div className="flex flex-col gap-1 rounded-md border border-amber-300 bg-amber-50 p-2 dark:border-amber-900 dark:bg-amber-950/40">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        This course code has more than one section — what is
                        this one?
                      </p>
                      <Select
                        value={row.section_type ?? ""}
                        onChange={(e) =>
                          updateRow(index, {
                            section_type: (e.target.value || null) as
                              | SectionType
                              | null,
                          })
                        }
                        className="max-w-48"
                      >
                        <option value="">Select a type…</option>
                        {SECTION_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      {row.section_type ? (
                        <p className="text-xs text-muted-foreground">
                          Will be saved as "{finalName(row)}"
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {row.warning ? (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      {row.warning}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            {reviewError ? (
              <p className="flex items-start gap-2 text-sm text-red-500">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {reviewError}
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {stage === "review" && (
            <Button
              onClick={handleImport}
              disabled={importing || rows.every((row) => !row.included)}
            >
              {importing
                ? "Importing…"
                : `Import ${rows.filter((r) => r.included).length} Classes`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
