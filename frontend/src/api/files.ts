import { api } from "@/api/client";
import type { ClassFile } from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const fetchFiles = (classId: number) =>
  api.get<ClassFile[]>(`/files?class_id=${classId}`);

export function uploadFile(classId: number, file: File) {
  const formData = new FormData();
  formData.append("class_id", String(classId));
  formData.append("file", file);
  return api.postForm<ClassFile>("/files", formData);
}

export const deleteFile = (id: number) => api.delete(`/files/${id}`);

export const fileDownloadUrl = (id: number) => `${BASE_URL}/files/${id}/download`;
