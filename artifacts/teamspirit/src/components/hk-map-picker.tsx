import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

export interface HKDistrict {
  id: string;
  name: string;
  region: 'NT' | 'KLN' | 'HKI' | 'ISL';
  x: number;
  y: number;
  w: number;
  h: number;
}

export const HK_DISTRICTS: HKDistrict[] = [
  { id: 'north',     name: '北區',   region: 'NT',  x: 360, y: 30,  w: 280, h: 90 },
  { id: 'tai-po',    name: '大埔',   region: 'NT',  x: 640, y: 70,  w: 240, h: 130 },
  { id: 'yuen-long', name: '元朗',   region: 'NT',  x: 90,  y: 130, w: 270, h: 110 },
  { id: 'sha-tin',   name: '沙田',   region: 'NT',  x: 440, y: 200, w: 200, h: 140 },
  { id: 'tuen-mun',  name: '屯門',   region: 'NT',  x: 50,  y: 240, w: 190, h: 140 },
  { id: 'sai-kung',  name: '西貢',   region: 'NT',  x: 640, y: 200, w: 240, h: 220 },
  { id: 'tsuen-wan', name: '荃灣',   region: 'NT',  x: 240, y: 240, w: 200, h: 130 },
  { id: 'kwai-tsing',name: '葵青',   region: 'NT',  x: 240, y: 370, w: 200, h: 90 },
  { id: 'ssp',       name: '深水埗', region: 'KLN', x: 270, y: 460, w: 160, h: 80 },
  { id: 'kc',        name: '九龍城', region: 'KLN', x: 430, y: 460, w: 150, h: 80 },
  { id: 'wts',       name: '黃大仙', region: 'KLN', x: 580, y: 460, w: 140, h: 80 },
  { id: 'kt',        name: '觀塘',   region: 'KLN', x: 720, y: 460, w: 160, h: 100 },
  { id: 'ytm',       name: '油尖旺', region: 'KLN', x: 270, y: 540, w: 310, h: 70 },
  { id: 'central',   name: '中西區', region: 'HKI', x: 270, y: 640, w: 170, h: 90 },
  { id: 'wch',       name: '灣仔',   region: 'HKI', x: 440, y: 640, w: 150, h: 90 },
  { id: 'east',      name: '東區',   region: 'HKI', x: 590, y: 640, w: 230, h: 90 },
  { id: 'south',     name: '南區',   region: 'HKI', x: 380, y: 730, w: 360, h: 60 },
  { id: 'islands',   name: '離島',   region: 'ISL', x: 50,  y: 480, w: 200, h: 250 },
];

const REGION_COLORS: Record<HKDistrict['region'], { fill: string; stroke: string; label: string }> = {
  NT:  { fill: 'rgba(132, 204, 22, 0.10)', stroke: 'rgba(132, 204, 22, 0.35)', label: '新界' },
  KLN: { fill: 'rgba(59, 130, 246, 0.10)', stroke: 'rgba(59, 130, 246, 0.35)', label: '九龍' },
  HKI: { fill: 'rgba(245, 158, 11, 0.10)', stroke: 'rgba(245, 158, 11, 0.35)', label: '港島' },
  ISL: { fill: 'rgba(168, 85, 247, 0.10)', stroke: 'rgba(168, 85, 247, 0.35)', label: '離島' },
};

interface HKMapPickerProps {
  value?: string;
  onChange: (districtName: string) => void;
}

export function HKMapPicker({ value, onChange }: HKMapPickerProps) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-[10px] font-bold tracking-widest uppercase">
        {(['NT', 'KLN', 'HKI', 'ISL'] as const).map(r => (
          <div key={r} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: REGION_COLORS[r].fill, border: `1px solid ${REGION_COLORS[r].stroke}` }} />
            <span className="text-muted-foreground">{REGION_COLORS[r].label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-black/40 border border-border p-3">
        <svg viewBox="0 0 940 800" className="w-full h-auto" style={{ maxHeight: 380 }}>
          {/* Subtle grid backdrop */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="940" height="800" fill="url(#grid)" />

          {/* Region zone halos */}
          <text x="470" y="22" textAnchor="middle" fill="rgba(132,204,22,0.45)" fontSize="14" fontWeight="700" letterSpacing="6">NEW TERRITORIES</text>
          <text x="470" y="448" textAnchor="middle" fill="rgba(59,130,246,0.45)" fontSize="14" fontWeight="700" letterSpacing="6">KOWLOON</text>
          <text x="470" y="630" textAnchor="middle" fill="rgba(245,158,11,0.45)" fontSize="14" fontWeight="700" letterSpacing="6">HONG KONG ISLAND</text>
          <text x="150" y="475" textAnchor="middle" fill="rgba(168,85,247,0.45)" fontSize="12" fontWeight="700" letterSpacing="4">ISLANDS</text>

          {/* Districts */}
          {HK_DISTRICTS.map(d => {
            const selected = value === d.name;
            const isHover = hover === d.id;
            const colors = REGION_COLORS[d.region];
            return (
              <g
                key={d.id}
                onClick={() => onChange(d.name)}
                onMouseEnter={() => setHover(d.id)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={d.x}
                  y={d.y}
                  width={d.w}
                  height={d.h}
                  rx={10}
                  fill={selected ? 'hsl(var(--primary))' : isHover ? colors.stroke : colors.fill}
                  fillOpacity={selected ? 0.85 : isHover ? 0.5 : 1}
                  stroke={selected ? 'hsl(var(--primary))' : colors.stroke}
                  strokeWidth={selected ? 2.5 : 1.5}
                  filter={selected ? 'url(#glow)' : undefined}
                  style={{ transition: 'all 0.15s ease' }}
                />
                <text
                  x={d.x + d.w / 2}
                  y={d.y + d.h / 2 + 6}
                  textAnchor="middle"
                  fill={selected ? '#000' : '#fff'}
                  fontSize={Math.min(20, d.w / 4)}
                  fontWeight="700"
                  pointerEvents="none"
                  style={{ userSelect: 'none' }}
                >
                  {d.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {value && (
        <div className="flex items-center gap-2 text-sm bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">已揀主場：</span>
          <span className="font-bold text-primary">{value}</span>
        </div>
      )}
    </div>
  );
}
