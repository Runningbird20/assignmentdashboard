import { FileUp, GraduationCap, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ClassCard } from "@/components/classes/ClassCard";
import { ClassCardGroup } from "@/components/classes/ClassCardGroup";
import { ClassFormDialog } from "@/components/classes/ClassFormDialog";
import { GtScheduleImportDialog } from "@/components/classes/GtScheduleImportDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useClasses, useDeleteClass } from "@/hooks/useClasses";
import type { SchoolClass } from "@/types";
import { extractCourseCode, groupByCourseCode } from "@/utils/courseCode";

export function ClassesPage() {
  const { data: classes = [], isLoading } = useClasses();
  const deleteClass = useDeleteClass();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [deleting, setDeleting] = useState<SchoolClass | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const groups = useMemo(() => groupByCourseCode(classes), [classes]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (schoolClass: SchoolClass) => {
    setEditing(schoolClass);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteClass.mutate(deleting.id, {
      onSuccess: () => toast({ title: "Class deleted", variant: "success" }),
      onError: (error: Error) =>
        toast({ title: "Could not delete class", description: error.message, variant: "destructive" }),
    });
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    let deleted = 0;
    const errors: string[] = [];

    for (const schoolClass of classes) {
      try {
        await deleteClass.mutateAsync(schoolClass.id);
        deleted += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed";
        errors.push(`${schoolClass.name}: ${message}`);
      }
    }

    setDeletingAll(false);
    toast({
      title: `${deleted} of ${classes.length} classes deleted`,
      description: errors.length > 0 ? errors.join(" · ") : undefined,
      variant: errors.length > 0 ? "destructive" : "success",
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Your courses this term."
        actions={
          <>
            {classes.length > 0 && (
              <Button
                variant="outline"
                disabled={deletingAll}
                onClick={() => setDeleteAllOpen(true)}
              >
                <Trash2 />
                {deletingAll ? "Deleting…" : "Delete All"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp />
              Import from GT Scheduler
            </Button>
            <Button onClick={openCreate}>
              <Plus />
              Add Class
            </Button>
          </>
        }
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes yet"
          description="Add your first class to start tracking assignments and your schedule."
          action={
            <Button onClick={openCreate}>
              <Plus />
              Add Class
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from(groups.values()).map((group) =>
            group.length > 1 ? (
              <ClassCardGroup
                key={group[0].id}
                courseCode={extractCourseCode(group[0].name)}
                schoolClasses={group}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ) : (
              <ClassCard
                key={group[0].id}
                schoolClass={group[0]}
                onEdit={() => openEdit(group[0])}
                onDelete={() => setDeleting(group[0])}
              />
            ),
          )}
        </div>
      )}

      <ClassFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      <GtScheduleImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete ${deleting?.name ?? "class"}?`}
        description="This also deletes every assignment in this class. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
        title={`Delete all ${classes.length} classes?`}
        description="This also deletes every assignment in every class. This cannot be undone."
        confirmLabel="Delete All"
        destructive
        onConfirm={handleDeleteAll}
      />
    </div>
  );
}
