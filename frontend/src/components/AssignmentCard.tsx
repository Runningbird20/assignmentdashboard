import type { Assignment } from "../api/types";
import { formatDueDate } from "../utils/date";

interface Props {
  assignment: Assignment;
}

export function AssignmentCard({ assignment }: Props) {
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {assignment.course_name}
      </p>
      <h3 className="mt-1 font-semibold text-slate-900">{assignment.name}</h3>
      <p className="mt-2 text-sm text-slate-600">
        {formatDueDate(assignment.due_at)}
      </p>
    </>
  );

  const className =
    "block rounded-lg border border-slate-200 bg-white p-4 shadow-sm";

  if (assignment.html_url) {
    return (
      <a
        href={assignment.html_url}
        target="_blank"
        rel="noreferrer"
        className={`${className} hover:border-slate-300`}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}
