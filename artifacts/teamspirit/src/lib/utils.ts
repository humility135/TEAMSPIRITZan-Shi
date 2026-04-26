import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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

export function formatDate(dateStr: string | Date): string {
  const d = safeDate(dateStr);
  return d.toLocaleDateString('zh-HK', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Hong_Kong'
  });
}
