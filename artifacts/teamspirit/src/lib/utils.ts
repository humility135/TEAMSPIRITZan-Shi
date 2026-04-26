import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeDate(dateStr: string | Date | undefined | null): Date {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatTime(dateStr: string | Date): string {
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  
  // If the date object is created without a timezone string, it might be off by the local timezone.
  // We parse the string manually to ensure absolute accuracy if it's an ISO string.
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    // extract "HH:mm" from "YYYY-MM-DDTHH:mm:00.000Z" or similar
    const match = dateStr.match(/T(\d{2}:\d{2})/);
    if (match) return match[1];
  }

  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Hong_Kong'
  });
}

export function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('zh-HK', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Hong_Kong'
  });
}
