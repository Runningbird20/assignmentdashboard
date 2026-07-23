import { useQuery } from "@tanstack/react-query";

import * as eventsApi from "@/api/events";

export function useEvents() {
  return useQuery({ queryKey: ["events"], queryFn: eventsApi.fetchEvents });
}
