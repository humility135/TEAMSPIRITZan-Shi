import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const HK_DISTRICTS = [
  '中西區', '東區', '南區', '灣仔區',
  '九龍城區', '觀塘區', '深水埗區', '黃大仙區', '油尖旺區',
  '離島區', '葵青區', '北區', '西貢區', '沙田區', '大埔區', '荃灣區', '屯門區', '元朗區'
] as const;

export type HKDistrict = typeof HK_DISTRICTS[number];

export function extractDistrict(address: string): HKDistrict | null {
  if (!address || typeof address !== 'string') return null;
  
  for (const district of HK_DISTRICTS) {
    if (address.includes(district)) return district;
    const shortName = district.replace('區', '');
    if (shortName.length >= 2 && address.includes(shortName)) return district;
  }
  return null;
}
