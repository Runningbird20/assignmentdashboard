import type { SectionType } from "@/types";
import { SECTION_TYPE_LABELS } from "@/utils/constants";

/**
 * Extracts the course code prefix from a class name following this app's
 * "CODE: Title" naming convention (e.g. "CS 3001: Computing & Society" ->
 * "CS 3001"). Falls back to the full name when there's no colon, so classes
 * that don't follow the convention just end up in their own singleton group.
 * Mirrors backend/app/utils/course_code.py's extract_course_code — keep the
 * two in sync.
 */
export function extractCourseCode(name: string): string {
  const colonIndex = name.indexOf(":");
  return colonIndex === -1 ? name.trim() : name.slice(0, colonIndex).trim();
}

/** The part of the name after the course code, for compact display inside a group. */
export function stripCourseCode(name: string, courseCode: string): string {
  if (!name.toLowerCase().startsWith(`${courseCode.toLowerCase()}:`)) return name;
  return name.slice(courseCode.length + 1).trim();
}

/**
 * Repeated course-code sections are disambiguated by appending "(Lecture)"/
 * "(Lab)"/etc. to the stored name for uniqueness — a badge already shows the
 * same type, so strip it back off wherever the name is just being displayed.
 */
export function stripSectionTypeSuffix(
  name: string,
  sectionType: SectionType | null,
): string {
  if (!sectionType) return name;
  const suffix = ` (${SECTION_TYPE_LABELS[sectionType]})`;
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}

/**
 * "CODE: Title" heading for a group of sections sharing a course code —
 * the descriptive title is the same across sections (e.g. all "Linear
 * Algebra"), so the first one stands in for the group as a whole.
 */
export function courseGroupHeading(
  primary: { name: string; section_type: SectionType | null },
  courseCode: string,
): string {
  const title = stripSectionTypeSuffix(
    stripCourseCode(primary.name, courseCode),
    primary.section_type,
  );
  return title ? `${courseCode}: ${title}` : courseCode;
}

export function groupByCourseCode<T extends { name: string }>(
  items: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const code = extractCourseCode(item.name);
    const key = code.toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}
