import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface NotificationSettings {
  assignmentReminders: boolean;
  dailyDigest: boolean;
}

export interface AppSettings {
  sheetUrl: string;
  notifications: NotificationSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  sheetUrl: "",
  notifications: {
    assignmentReminders: true,
    dailyDigest: false,
  },
};

export function useSettings() {
  const [stored, setStored] = useLocalStorage<AppSettings>(
    "studentos-settings",
    DEFAULT_SETTINGS,
  );

  // Merge with defaults so settings added in future versions get sane values.
  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications },
  };

  const update = (patch: Partial<AppSettings>) =>
    setStored((current) => ({ ...current, ...patch }));

  return { settings, update };
}
