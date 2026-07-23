import { api } from "@/api/client";
import type { EventItem } from "@/types";

export const fetchEvents = () => api.get<EventItem[]>("/events");
