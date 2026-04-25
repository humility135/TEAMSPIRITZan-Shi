import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DISTRICTS = [
  '中西區', '東區', '南區', '灣仔區',
  '九龍城區', '觀塘區', '深水埗區', '黃大仙區', '油尖旺區',
  '離島區', '葵青區', '北區', '西貢區', '沙田區',
  '大埔區', '荃灣區', '屯門區', '元朗區'
];

export function extractDistrict(address: string): string | null {
  if (!address) return null;
  // Match full district names
  for (const d of DISTRICTS) {
    if (address.includes(d)) return d;
  }
  // Match abbreviations without "區"
  for (const d of DISTRICTS) {
    const short = d.replace('區', '');
    if (address.includes(short)) return d;
  }
  return null;
}
