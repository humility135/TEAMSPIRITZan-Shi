import React, { useState } from "react";
import { Check, ChevronsUpDown, Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Venue } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

interface VenueSelectorProps {
  venues: Venue[];
  onSelect: (venue: Venue) => void;
  selectedVenueId?: string;
  className?: string;
}

export function VenueSelector({ venues, onSelect, selectedVenueId, className }: VenueSelectorProps) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  const vName = (v: Venue) => lang === 'en' ? (v.nameEn || v.name) : v.name;
  const vDistrict = (v: Venue) => lang === 'en' ? (v.districtEn || v.district) : v.district;
  const vAddr = (v: Venue) => lang === 'en' ? (v.addressEn || v.address) : v.address;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto py-3 px-4 bg-black/20 border-white/10 hover:bg-black/40 text-left", className)}
        >
          <div className="flex items-start gap-3 truncate">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 truncate">
              <span className={cn("font-bold truncate", !selectedVenue && "text-muted-foreground font-normal")}>
                {selectedVenue ? vName(selectedVenue) : t('venueSearchPlaceholder')}
              </span>
              {selectedVenue && (
                <span className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
                  {vDistrict(selectedVenue)} · {vAddr(selectedVenue)}
                </span>
              )}
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-950 border-zinc-800" align="start">
        <Command className="bg-transparent">
          <CommandInput placeholder={t('venueSearchInputPlaceholder')} className="h-12 border-none focus:ring-0" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">{t('venueNotFound')}</CommandEmpty>
            <CommandGroup>
              {venues.map((venue) => (
                <CommandItem
                  key={venue.id}
                  value={`${venue.name} ${venue.nameEn || ''} ${venue.district} ${venue.districtEn || ''} ${venue.address} ${venue.addressEn || ''}`}
                  onSelect={() => {
                    onSelect(venue);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-primary/10 aria-selected:bg-primary/20"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm">{vName(venue)}</span>
                    {selectedVenueId === venue.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary uppercase tracking-tighter">
                      {vDistrict(venue)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground truncate">{vAddr(venue)}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
