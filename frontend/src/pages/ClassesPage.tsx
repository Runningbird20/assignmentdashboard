import { GraduationCap, Plus } from "lucide-react";
import { useState } from "react";

import { ClassCard } from "@/components/classes/ClassCard";
import { ClassFormDialog } from "@/components/classes/ClassFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useClasses, useDeleteClass } from "@/hooks/useClasses";
import type { SchoolClass } from "@/types";

export function ClassesPage() {
  const { data: classes = [], isLoading } = useClasses();
  const deleteClass = useDeleteClass();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [deleting, setDeleting] = useState<SchoolClass | null>(null);

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

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Your courses this term."
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add Class
          </Button>
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
          {classes.map((schoolClass) => (
            <ClassCard
              key={schoolClass.id}
              schoolClass={schoolClass}
              onEdit={() => openEdit(schoolClass)}
              onDelete={() => setDeleting(schoolClass)}
            />
          ))}
        </div>
      )}

      <ClassFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
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
    </div>
  );
}
