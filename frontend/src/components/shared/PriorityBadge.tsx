import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Priority } from "@/types";
import { PRIORITY_LABELS } from "@/utils/constants";

const priorityVariants: Record<Priority, BadgeProps["variant"]> = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge variant={priorityVariants[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}
