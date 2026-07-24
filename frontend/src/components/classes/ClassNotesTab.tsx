import { Plus, StickyNote, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoader } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useDeleteNote, useNotes } from "@/hooks/useNotes";
import type { Note } from "@/types";
import { formatDate } from "@/utils/date";

import { NoteFormDialog } from "./NoteFormDialog";

/** A one-line plain-text snippet for the list view — strips common markdown
 * markers rather than rendering, so there's no HTML to worry about here. */
function previewText(body: string): string {
  const plain = body
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>~]/g, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 140 ? `${plain.slice(0, 140)}…` : plain;
}

export function ClassNotesTab({ classId }: { classId: number }) {
  const { data: notes = [], isLoading } = useNotes(classId);
  const deleteNote = useDeleteNote(classId);
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);

  const handleDelete = () => {
    if (!deleting) return;
    deleteNote.mutate(deleting.id, {
      onSuccess: () => toast({ title: "Note deleted", variant: "success" }),
      onError: (error: Error) =>
        toast({ title: "Delete failed", description: error.message, variant: "destructive" }),
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          New Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Jot down lecture notes, reminders, or anything worth keeping for this class."
        />
      ) : (
        <Card className="divide-y">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start gap-3 p-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(note);
                  setFormOpen(true);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium hover:text-primary">
                  {note.title}
                </p>
                {note.body.trim() && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {previewText(note.body)}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {formatDate(note.updated_at)}
                </p>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-red-500"
                onClick={() => setDeleting(note)}
                aria-label={`Delete ${note.title}`}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </Card>
      )}

      <NoteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        classId={classId}
        initial={editing}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete "${deleting?.title ?? "note"}"?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
