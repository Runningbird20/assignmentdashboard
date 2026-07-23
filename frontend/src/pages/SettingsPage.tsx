import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useImportSheet } from "@/hooks/useImportSheet";
import { useSettings, type NotificationSettings } from "@/hooks/useSettings";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function NotificationRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 cursor-pointer accent-primary"
      />
    </label>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { settings, update } = useSettings();
  const [sheetUrl, setSheetUrl] = useState(settings.sheetUrl);
  const importSheet = useImportSheet();
  const { toast } = useToast();

  const saveSheetUrl = () => {
    update({ sheetUrl: sheetUrl.trim() });
    toast({ title: "Sheet URL saved", variant: "success" });
  };

  const importNow = () => {
    const url = sheetUrl.trim();
    if (!url) {
      toast({
        title: "No sheet URL",
        description: "Paste your Google Sheet URL first.",
        variant: "destructive",
      });
      return;
    }
    update({ sheetUrl: url });
    importSheet.mutate(url, {
      onSuccess: (summary) =>
        toast({
          title: "Import finished",
          description: `${summary.created} new, ${summary.updated} updated, ${summary.skipped} unchanged.`,
          variant: "success",
        }),
      onError: (error: Error) =>
        toast({ title: "Import failed", description: error.message, variant: "destructive" }),
    });
  };

  const setNotification = (patch: Partial<NotificationSettings>) => {
    update({ notifications: { ...settings.notifications, ...patch } });
  };

  return (
    <div>
      <PageHeader title="Settings" description="Personalize StudentOS." />

      <div className="flex max-w-2xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how StudentOS looks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors",
                    theme === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  <option.icon className="size-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google Sheets Import</CardTitle>
            <CardDescription>
              Keep a sheet with the columns Class, Assignment Name and Due Date, and
              import it any time. The sheet must be shared as “Anyone with the link
              can view”.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-sheet-url">Sheet URL</Label>
              <Input
                id="settings-sheet-url"
                value={sheetUrl}
                onChange={(event) => setSheetUrl(event.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveSheetUrl}>
                Save
              </Button>
              <Button onClick={importNow} disabled={importSheet.isPending}>
                {importSheet.isPending ? "Importing…" : "Import Now"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Preferences are saved locally. Delivery channels (email, Slack,
              Discord) are planned for a future release.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            <NotificationRow
              title="Assignment reminders"
              description="Remind me about assignments due soon."
              checked={settings.notifications.assignmentReminders}
              onChange={(checked) => setNotification({ assignmentReminders: checked })}
            />
            <NotificationRow
              title="Daily digest"
              description="A morning summary of the day's schedule and tasks."
              checked={settings.notifications.dailyDigest}
              onChange={(checked) => setNotification({ dailyDigest: checked })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
