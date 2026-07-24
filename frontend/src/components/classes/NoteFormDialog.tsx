import { useEffect, useState, type FormEvent } from "react";

import { Markdown } from "@/components/shared/Markdown";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useCreateNote, useUpdateNote } from "@/hooks/useNotes";
import type { Note } from "@/types";
import { cn } from "@/utils/cn";

type ViewMode = "write" | "preview";

export function NoteFormDialog({
  open,
  onOpenChange,
  classId,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number;
  initial?: Note | null;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<ViewMode>("write");
  const [error, setError] = useState<string | null>(null);
  const createNote = useCreateNote(classId);
  const updateNote = useUpdateNote(classId);
  const { toast } = useToast();
  const isPending = createNote.isPending || updateNote.isPending;

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setBody(initial?.body ?? "");
      setMode("write");
      setError(null);
    }
  }, [open, initial]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    const options = {
      onSuccess: () => {
        onOpenChange(false);
        toast({
          title: initial ? "Note updated" : "Note created",
          variant: "success" as const,
        });
      },
      onError: (mutationError: Error) => setError(mutationError.message),
    };
    if (initial) {
      updateNote.mutate(
        { id: initial.id, payload: { title: title.trim(), body } },
        options,
      );
    } else {
      createNote.mutate({ class_id: classId, title: title.trim(), body }, options);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Note" : "New Note"}</DialogTitle>
          <DialogDescription>Markdown is supported.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note-title">Title *</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Midterm review topics"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="note-body">Body</Label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setMode("write")}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                    mode === "write"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setMode("preview")}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                    mode === "preview"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  Preview
                </button>
              </div>
            </div>
            {mode === "write" ? (
              <Textarea
                id="note-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="# Topics&#10;&#10;- Vectors&#10;- Eigenvalues"
                className="min-h-56 font-mono text-sm"
              />
            ) : (
              <div className="min-h-56 rounded-md border bg-muted/20 p-3">
                {body.trim() ? (
                  <Markdown>{body}</Markdown>
                ) : (
                  <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {initial ? "Save Changes" : "Add Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
