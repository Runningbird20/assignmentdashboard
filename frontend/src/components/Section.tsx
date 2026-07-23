import type { Assignment } from "../api/types";
import { AssignmentCard } from "./AssignmentCard";

interface Props {
  title: string;
  assignments: Assignment[];
}

export function Section({ title, assignments }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <span className="text-sm text-slate-400">{assignments.length}</span>
      </div>
      {assignments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-400">
          Nothing here.
        </p>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </section>
  );
}
