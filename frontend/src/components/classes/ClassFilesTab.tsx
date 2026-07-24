import { FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoader } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { fileDownloadUrl } from "@/api/files";
import { useDeleteFile, useFiles, useUploadFile } from "@/hooks/useFiles";
import type { ClassFile } from "@/types";
import { formatDate } from "@/utils/date";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClassFilesTab({ classId }: { classId: number }) {
  const { data: files = [], isLoading } = useFiles(classId);
  const uploadFile = useUploadFile(classId);
  const deleteFile = useDeleteFile(classId);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<ClassFile | null>(null);

  const handleFile = (file: File) => {
    uploadFile.mutate(file, {
      onSuccess: () => toast({ title: "File uploaded", variant: "success" }),
      onError: (error: Error) =>
        toast({ title: "Upload failed", description: error.message, variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteFile.mutate(deleting.id, {
      onSuccess: () => toast({ title: "File deleted", variant: "success" }),
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
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadFile.isPending}
        >
          <Upload />
          {uploadFile.isPending ? "Uploading…" : "Upload File"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
            event.target.value = "";
          }}
        />
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No files yet"
          description="Upload a syllabus, slides, or other documents for this class."
        />
      ) : (
        <Card className="divide-y">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-4">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <a
                href={fileDownloadUrl(file.id)}
                className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary hover:underline"
              >
                {file.filename}
              </a>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {formatFileSize(file.size_bytes)}
              </span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {formatDate(file.created_at)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-red-500"
                onClick={() => setDeleting(file)}
                aria-label={`Delete ${file.filename}`}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </Card>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete "${deleting?.filename ?? "file"}"?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
