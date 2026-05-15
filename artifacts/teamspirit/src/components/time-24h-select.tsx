import React, { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  value: string;
  onChange: (next: string) => void;
  minuteStep?: 5 | 10 | 15;
  disabled?: boolean;
  testId?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseTime(value: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return { hour: "", minute: "" };
  return { hour: m[1], minute: m[2] };
}

export function Time24hSelect({ value, onChange, minuteStep = 15, disabled, testId }: Props) {
  const { hour, minute } = useMemo(() => parseTime(value), [value]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => pad2(i)), []);
  const minutes = useMemo(() => {
    const step = Math.max(1, minuteStep);
    const values: string[] = [];
    for (let m = 0; m < 60; m += step) values.push(pad2(m));
    return values;
  }, [minuteStep]);

  const setHour = (h: string) => {
    const nextMinute = minute || "00";
    onChange(`${h}:${nextMinute}`);
  };

  const setMinute = (m: string) => {
    const nextHour = hour || "00";
    onChange(`${nextHour}:${m}`);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Select disabled={disabled} value={hour} onValueChange={setHour}>
        <SelectTrigger aria-label="Hour" data-testid={testId ? `${testId}-hour` : undefined}>
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select disabled={disabled} value={minute} onValueChange={setMinute}>
        <SelectTrigger aria-label="Minute" data-testid={testId ? `${testId}-minute` : undefined}>
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

