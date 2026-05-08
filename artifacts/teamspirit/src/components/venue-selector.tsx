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

interface VenueSelectorProps {
  venues: Venue[];
  onSelect: (venue: Venue) => void;
  selectedVenueId?: string;
  className?: string;
}

export function VenueSelector({ venues, onSelect, selectedVenueId, className }: VenueSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

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
                {selectedVenue ? selectedVenue.name : "搜尋球場 (例如：摩士公園...)"}
              </span>
              {selectedVenue && (
                <span className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
                  {selectedVenue.district} · {selectedVenue.address}
                </span>
              )}
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-950 border-zinc-800" align="start">
        <Command className="bg-transparent">
          <CommandInput placeholder="輸入球場名稱或區域搜尋..." className="h-12 border-none focus:ring-0" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">搵唔到相關球場。</CommandEmpty>
            <CommandGroup>
              {venues.map((venue) => (
                <CommandItem
                  key={venue.id}
                  value={`${venue.name} ${venue.district} ${venue.address}`}
                  onSelect={() => {
                    onSelect(venue);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-primary/10 aria-selected:bg-primary/20"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm">{venue.name}</span>
                    {selectedVenueId === venue.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary uppercase tracking-tighter">
                      {venue.district}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground truncate">{venue.address}</span>
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
