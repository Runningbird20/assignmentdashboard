import { CalendarDays, Clock, MapPin, Pencil, Trash2, User } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SchoolClass } from "@/types";

function DetailRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span className="truncate">{children}</span>
    </div>
  );
}

export function ClassCard({
  schoolClass,
  onEdit,
  onDelete,
}: {
  schoolClass: SchoolClass;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: schoolClass.color }} />
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/classes/${schoolClass.id}`}
            className="font-semibold leading-snug hover:text-primary hover:underline"
          >
            {schoolClass.name}
          </Link>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={onEdit} aria-label="Edit class">
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-red-500"
              onClick={onDelete}
              aria-label="Delete class"
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {schoolClass.professor && (
            <DetailRow icon={<User className="size-3.5 shrink-0" />}>
              {schoolClass.professor}
            </DetailRow>
          )}
          {schoolClass.location && (
            <DetailRow icon={<MapPin className="size-3.5 shrink-0" />}>
              {schoolClass.location}
            </DetailRow>
          )}
          {schoolClass.meeting_days.length > 0 && (
            <DetailRow icon={<CalendarDays className="size-3.5 shrink-0" />}>
              {schoolClass.meeting_days.join(", ")}
              {schoolClass.meeting_time ? ` · ${schoolClass.meeting_time}` : ""}
            </DetailRow>
          )}
          {schoolClass.office_hours && (
            <DetailRow icon={<Clock className="size-3.5 shrink-0" />}>
              Office hours: {schoolClass.office_hours}
            </DetailRow>
          )}
        </div>
      </div>
    </Card>
  );
}
