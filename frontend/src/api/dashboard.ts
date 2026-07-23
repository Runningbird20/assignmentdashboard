import { api } from "@/api/client";
import type { DashboardData } from "@/types";

export const fetchDashboard = () => api.get<DashboardData>("/dashboard");
