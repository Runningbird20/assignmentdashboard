import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { RecurrenceFrequency } from "@/types";
import { RECURRENCE_FREQUENCY_OPTIONS } from "@/utils/constants";

export function RecurrenceFields({
  frequency,
  interval,
  onFrequencyChange,
  onIntervalChange,
}: {
  frequency: RecurrenceFrequency | "";
  interval: number;
  onFrequencyChange: (frequency: RecurrenceFrequency | "") => void;
  onIntervalChange: (interval: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="recurrence-frequency">Repeat</Label>
      <div className="flex items-center gap-2">
        <Select
          id="recurrence-frequency"
          value={frequency}
          onChange={(e) => onFrequencyChange(e.target.value as RecurrenceFrequency | "")}
          className="w-44"
        >
          <option value="">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </Select>
        {frequency ? (
          <>
            <span className="shrink-0 text-sm text-muted-foreground">every</span>
            <Input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => onIntervalChange(Math.max(1, Number(e.target.value) || 1))}
              className="w-16"
              aria-label="Recurrence interval"
            />
            <span className="shrink-0 text-sm text-muted-foreground">
              {RECURRENCE_FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.label.toLowerCase()}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
