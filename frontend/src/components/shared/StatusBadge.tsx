import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { AssignmentStatus } from "@/types";
import { STATUS_LABELS } from "@/utils/constants";

const statusVariants: Record<AssignmentStatus, BadgeProps["variant"]> = {
  todo: "secondary",
  in_progress: "info",
  waiting: "warning",
  complete: "success",
};

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  return <Badge variant={statusVariants[status]}>{STATUS_LABELS[status]}</Badge>;
}
