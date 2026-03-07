import { useState } from "react";
import { MapPin, Users, Calendar, Clock, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";

// Generate a simple 4-week calendar
const TODAY = new Date(2026, 0, 6); // Mon Jan 6 2026
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

interface Slot { date: Date; label: string; status: "available" | "booked" | "tentative"; client?: string; pax?: number; }
interface Venue { id: string; name: string; city: string; pax: number; rate: string; amenities: string[]; }

const VENUES: Venue[] = [
  { id:"v1", name:"Braamfontein Hub Room A",  city:"Johannesburg", pax:30, rate:"R2 800/day",  amenities:["Projector","WiFi","Catering","Whiteboard"] },
  { id:"v2", name:"Observatory Training Suite",city:"Cape Town",    pax:20, rate:"R2 200/day",  amenities:["Smart TV","WiFi","Kitchenette"] },
  { id:"v3", name:"Durban Skill Centre",       city:"Durban",       pax:40, rate:"R3 500/day",  amenities:["Projector","WiFi","Catering","Parking","AC"] },
];

function genSlots(venueId: string): Slot[] {
  const booked: Record<string, { client: string; pax: number; status: "booked" | "tentative" }> = {
    v1: { client:"Bytes Academy", pax:22, status:"booked" },
    v2: { client:"MerSETA", pax:18, status:"tentative" },
    v3: { client:"CHIETA", pax:35, status:"booked" },
  };
  const slots: Slot[] = [];
  for (let i = 0; i < 20; i++) {
    const d = addDays(TODAY, i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    const isBooked = (venueId === "v1" && i >= 1 && i <= 5) || (venueId === "v2" && i >= 3 && i <= 6) || (venueId === "v3" && i >= 0 && i <= 4);
    const isTent   = (venueId === "v1" && i >= 8 && i <= 9);
    slots.push({
      date: d,
      label: d.toLocaleDateString("en-ZA", { weekday:"short", day:"2-digit", month:"short" }),
      status: isBooked ? "booked" : isTent ? "tentative" : "available",
      ...((isBooked || isTent) ? booked[venueId] : {}),
    });
  }
  return slots;
}

const DAY_CFG = {
  available:  { color:"bg-emerald-500/15 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-700 cursor-pointer" },
  booked:     { color:"bg-destructive/10 border-destructive/20 text-destructive cursor-not-allowed" },
  tentative:  { color:"bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-700 cursor-pointer" },
};

export function FacilityBookingWidget() {
  const [venueId,    setVenueId]    = useState("v1");
  const [selected,   setSelected]   = useState<string | null>(null);

  const venue = VENUES.find(v => v.id === venueId)!;
  const slots = genSlots(venueId);

  const avail   = slots.filter(s => s.status === "available").length;
  const booked  = slots.filter(s => s.status === "booked").length;

  function handleBook(slot: Slot) {
    if (slot.status === "booked") return;
    setSelected(slot.label);
    toast.success(`Booking requested: ${venue.name} · ${slot.label}`, {
      description: "You'll receive confirmation within 2 hours.",
    });
  }

  return (
    <div className="space-y-4">
      {/* Venue selector */}
      <div className="grid grid-cols-3 gap-2">
        {VENUES.map(v => (
          <button
            key={v.id}
            onClick={() => { setVenueId(v.id); setSelected(null); }}
            className={`p-2.5 rounded-xl border text-left transition-all ${venueId === v.id ? "border-primary/50 bg-primary/10" : "border-border bg-card hover:border-primary/30"}`}
          >
            <p className="text-[10px] font-bold text-foreground truncate">{v.name}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5"><MapPin className="w-2.5 h-2.5" />{v.city}</p>
            <p className="text-[10px] font-semibold text-primary mt-0.5">{v.rate}</p>
          </button>
        ))}
      </div>

      {/* Venue detail strip */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border text-xs">
        <span className="flex items-center gap-1 text-muted-foreground"><Users className="w-3.5 h-3.5" />Max {venue.pax} pax</span>
        <div className="flex flex-wrap gap-1">
          {venue.amenities.map(a => <span key={a} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{a}</span>)}
        </div>
      </div>

      {/* Availability stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-center">
          <p className="text-lg font-black text-foreground">{slots.length}</p>
          <p className="text-[10px] text-muted-foreground">Work Days</p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-lg font-black text-emerald-600">{avail}</p>
          <p className="text-[10px] text-emerald-600/70">Available</p>
        </div>
        <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
          <p className="text-lg font-black text-destructive">{booked}</p>
          <p className="text-[10px] text-destructive/70">Booked</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">4-Week Availability</p>
        <div className="grid grid-cols-5 gap-1.5">
          {slots.map(slot => {
            const cfg = DAY_CFG[slot.status];
            return (
              <button
                key={slot.label}
                onClick={() => handleBook(slot)}
                className={`p-2 rounded-lg border text-center transition-all text-[10px] leading-tight ${cfg.color} ${selected === slot.label ? "ring-2 ring-primary" : ""}`}
                title={slot.client ? `${slot.client} · ${slot.pax} pax` : "Available"}
              >
                <span className="block font-semibold">{slot.date.getDate()}</span>
                <span className="block opacity-70">{slot.date.toLocaleDateString("en-ZA", { month:"short" })}</span>
                {slot.status === "booked" && <span className="block text-[8px] mt-0.5 truncate">Booked</span>}
                {slot.status === "available" && <span className="block text-[8px] mt-0.5">Free</span>}
                {slot.status === "tentative" && <span className="block text-[8px] mt-0.5">Option</span>}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/40 inline-block" />Available</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-500/40 inline-block" />Tentative</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-destructive/40 inline-block" />Booked</span>
        </div>
      </div>

      <button
        onClick={() => toast.info("Add venue form — coming soon")}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/30 text-xs font-semibold text-primary hover:bg-primary/5 transition-all"
      >
        <Plus className="w-3.5 h-3.5" /> Add My Venue
      </button>
    </div>
  );
}
