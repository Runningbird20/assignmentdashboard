import { CalendarDays, Layers, MapPin, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { SectionTypeBadge } from "@/components/shared/SectionTypeBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SchoolClass } from "@/types";
import { courseGroupHeading } from "@/utils/courseCode";

/** Multiple sections (lecture/lab/recitation/exam) of the same course code,
 * stacked into one card since GT Scheduler blocks these out as separate
 * events but they belong together. */
export function ClassCardGroup({
  courseCode,
  schoolClasses,
  onEdit,
  onDelete,
}: {
  courseCode: string;
  schoolClasses: SchoolClass[];
  onEdit: (schoolClass: SchoolClass) => void;
  onDelete: (schoolClass: SchoolClass) => void;
}) {
  const primary = schoolClasses[0];
  const heading = courseGroupHeading(primary, courseCode);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-5 py-3">
        <Layers className="size-4 shrink-0 text-muted-foreground" />
        <Link
          to={`/classes/${primary.id}`}
          className="truncate font-semibold leading-snug hover:text-primary hover:underline"
        >
          {heading}
        </Link>
        <Badge variant="secondary" className="ml-auto">
          {schoolClasses.length} sections
        </Badge>
      </div>
      <div className="divide-y">
        {schoolClasses.map((schoolClass) => (
          <div key={schoolClass.id} className="flex items-start gap-3 p-4">
            <span
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: schoolClass.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {schoolClass.section_type ? (
                  <SectionTypeBadge sectionType={schoolClass.section_type} />
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Type not set
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground">
                {schoolClass.meeting_days.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3 shrink-0" />
                    {schoolClass.meeting_days.join(", ")}
                    {schoolClass.meeting_time ? ` · ${schoolClass.meeting_time}` : ""}
                  </div>
                )}
                {schoolClass.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3 shrink-0" />
                    {schoolClass.location}
                  </div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onEdit(schoolClass)}
                aria-label={`Edit ${schoolClass.name}`}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-red-500"
                onClick={() => onDelete(schoolClass)}
                aria-label={`Delete ${schoolClass.name}`}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
