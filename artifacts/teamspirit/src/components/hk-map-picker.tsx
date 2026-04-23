import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

type Region = 'NT' | 'KLN' | 'HKI' | 'ISL';
type Color = 'red' | 'green' | 'blue' | 'yellow';

export interface HKDistrict {
  id: string;
  name: string;
  region: Region;
  color: Color;
  points: string;
  labelX: number;
  labelY: number;
  fontSize?: number;
}

export const HK_DISTRICTS: HKDistrict[] = [
  // 新界 (New Territories)
  { id: 'north',     name: '北區',   region: 'NT', color: 'blue',
    points: '380,40 580,30 660,60 690,105 660,140 580,150 470,148 400,125 360,80',
    labelX: 520, labelY: 95 },
  { id: 'yuen-long', name: '元朗區', region: 'NT', color: 'green',
    points: '90,150 280,135 360,170 380,230 320,260 220,265 120,250 70,210',
    labelX: 230, labelY: 210 },
  { id: 'tai-po',    name: '大埔區', region: 'NT', color: 'green',
    points: '660,140 820,155 875,205 865,265 825,295 750,298 690,275 660,215',
    labelX: 765, labelY: 230 },
  { id: 'tuen-mun',  name: '屯門區', region: 'NT', color: 'blue',
    points: '60,260 190,260 215,315 195,385 130,405 55,375 28,315',
    labelX: 130, labelY: 335 },
  { id: 'tsuen-wan', name: '荃灣區', region: 'NT', color: 'red',
    points: '280,270 405,268 428,330 380,378 295,372 245,320',
    labelX: 335, labelY: 325 },
  { id: 'sha-tin',   name: '沙田區', region: 'NT', color: 'red',
    points: '470,210 640,205 668,290 600,360 500,355 442,302 440,245',
    labelX: 555, labelY: 290 },
  { id: 'sai-kung',  name: '西貢區', region: 'NT', color: 'green',
    points: '750,215 890,225 920,305 902,385 878,442 800,462 728,442 680,395 672,320 705,260',
    labelX: 800, labelY: 345 },
  { id: 'kwai-tsing',name: '葵青區', region: 'NT', color: 'green',
    points: '248,378 392,378 402,442 320,462 242,442',
    labelX: 320, labelY: 420 },

  // 九龍 (Kowloon)
  { id: 'ssp',  name: '深水埗區', region: 'KLN', color: 'red',
    points: '302,488 418,488 432,542 372,562 312,556',
    labelX: 372, labelY: 525, fontSize: 14 },
  { id: 'kc',   name: '九龍城區', region: 'KLN', color: 'red',
    points: '432,488 538,488 558,548 472,562 428,542',
    labelX: 488, labelY: 525, fontSize: 14 },
  { id: 'wts',  name: '黃大仙區', region: 'KLN', color: 'green',
    points: '558,472 660,472 688,538 602,548 562,520',
    labelX: 615, labelY: 510, fontSize: 14 },
  { id: 'kt',   name: '觀塘區',   region: 'KLN', color: 'yellow',
    points: '688,488 802,492 832,562 778,602 698,592 672,542',
    labelX: 745, labelY: 545 },
  { id: 'ytm',  name: '油尖旺區', region: 'KLN', color: 'red',
    points: '302,562 482,568 498,618 362,628 292,618',
    labelX: 395, labelY: 600, fontSize: 14 },

  // 港島 (HK Island)
  { id: 'central', name: '中西區', region: 'HKI', color: 'red',
    points: '272,652 412,652 426,702 322,712 272,692',
    labelX: 348, labelY: 685 },
  { id: 'wch',     name: '灣仔區', region: 'HKI', color: 'red',
    points: '426,652 542,652 558,702 462,712 426,696',
    labelX: 488, labelY: 685 },
  { id: 'east',    name: '東區',   region: 'HKI', color: 'red',
    points: '558,652 722,652 748,708 602,718 558,696',
    labelX: 650, labelY: 685 },
  { id: 'south',   name: '南區',   region: 'HKI', color: 'green',
    points: '352,720 702,720 690,778 378,778',
    labelX: 528, labelY: 755 },

  // 離島 (Islands)
  { id: 'islands', name: '離島區', region: 'ISL', color: 'green',
    points: '40,442 232,462 252,582 200,652 90,668 28,582',
    labelX: 135, labelY: 555 },
];

const COLOR_MAP: Record<Color, string> = {
  red:    '#ef4444',
  green:  '#22c55e',
  blue:   '#3b82f6',
  yellow: '#facc15',
};

const COLOR_DARK: Record<Color, string> = {
  red:    '#b91c1c',
  green:  '#15803d',
  blue:   '#1d4ed8',
  yellow: '#a16207',
};

interface HKMapPickerProps {
  value?: string;
  onChange: (districtName: string) => void;
}

export function HKMapPicker({ value, onChange }: HKMapPickerProps) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-[#cfe9ff] border-2 border-[#7ab8e0] p-3 shadow-inner">
        <svg viewBox="0 0 950 800" className="w-full h-auto" style={{ maxHeight: 420 }}>
          {/* Sea / background subtle wave */}
          <defs>
            <pattern id="wave" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 20 Q 10 14 20 20 T 40 20" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="950" height="800" fill="url(#wave)" />

          {/* Districts */}
          {HK_DISTRICTS.map(d => {
            const selected = value === d.name;
            const isHover = hover === d.id;
            const base = COLOR_MAP[d.color];
            const dark = COLOR_DARK[d.color];
            return (
              <g
                key={d.id}
                onClick={() => onChange(d.name)}
                onMouseEnter={() => setHover(d.id)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <polygon
                  points={d.points}
                  fill={selected ? '#84cc16' : isHover ? dark : base}
                  stroke="#ffffff"
                  strokeWidth={selected ? 4 : 2.5}
                  strokeLinejoin="round"
                  style={{ transition: 'fill 0.15s ease', filter: selected ? 'drop-shadow(0 0 12px rgba(132,204,22,0.7))' : undefined }}
                />
                <text
                  x={d.labelX}
                  y={d.labelY}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={d.fontSize ?? 17}
                  fontWeight="800"
                  pointerEvents="none"
                  style={{ userSelect: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  paintOrder="stroke"
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth="0.6"
                >
                  {d.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {value ? (
        <div className="flex items-center gap-2 text-sm bg-primary/10 border border-primary/40 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">已揀主場：</span>
          <span className="font-bold text-primary">{value}</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center">點一下地圖上嘅地區揀你嘅主場</p>
      )}
    </div>
  );
}
