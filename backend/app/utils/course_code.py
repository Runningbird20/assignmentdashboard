def extract_course_code(name: str) -> str:
    """The course code prefix from a "CODE: Title" class name.

    Mirrors frontend/src/utils/courseCode.ts's extractCourseCode — keep the
    two in sync. Falls back to the full name when there's no colon, so a
    class that doesn't follow the convention just counts as its own group.
    """
    colon_index = name.find(":")
    return name.strip() if colon_index == -1 else name[:colon_index].strip()
