import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useState, useEffect } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeDate(dateStr: string | Date | undefined | null): Date {
  if (!dateStr) return new Date();

  // Handle SQLite returning Unix timestamps as strings like "1778472000000.0"
  if (typeof dateStr === 'string' && /^\d+(\.\d+)?$/.test(dateStr)) {
    return new Date(parseFloat(dateStr));
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatTime(dateStr: string | Date): string {
  const d = safeDate(dateStr);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Hong_Kong'
  });
}

export function formatDate(dateStr: string | Date, locale: string = 'zh-HK'): string {
  const d = safeDate(dateStr);
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Hong_Kong'
  });
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function useNow(intervalMs: number = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
