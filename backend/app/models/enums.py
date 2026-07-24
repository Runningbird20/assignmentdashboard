from enum import Enum


class AssignmentStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    COMPLETE = "complete"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class EventType(str, Enum):
    EXAM = "exam"
    MEETING = "meeting"
    SOCIAL = "social"
    OTHER = "other"


class SectionType(str, Enum):
    LECTURE = "lecture"
    LAB = "lab"
    RECITATION = "recitation"
    EXAM = "exam"
    OTHER = "other"


class RecurrenceFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
