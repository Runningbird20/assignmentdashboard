import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { SectionType } from "@/types";
import { SECTION_TYPE_LABELS } from "@/utils/constants";

const sectionTypeVariants: Record<SectionType, BadgeProps["variant"]> = {
  lecture: "info",
  lab: "success",
  recitation: "warning",
  exam: "destructive",
  other: "secondary",
};

export function SectionTypeBadge({ sectionType }: { sectionType: SectionType }) {
  return (
    <Badge variant={sectionTypeVariants[sectionType]}>
      {SECTION_TYPE_LABELS[sectionType]}
    </Badge>
  );
}
