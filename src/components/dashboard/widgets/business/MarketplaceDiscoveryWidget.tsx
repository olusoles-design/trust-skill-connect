import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Store, Star, MapPin, Search, Phone, Globe, Loader2, AlertCircle,
} from "lucide-react";

interface ProviderListing {
  id: string;
  title: string;
  category: string;
  description: string | null;
  pricing_model: string;
  price_from: number | null;
  price_to: number | null;
  currency: string;
  location: string | null;
  certifications: string[] | null;
  services: string[] | null;
  rating_avg: number;
  review_count: number;
}

const CATEGORIES = [
  { key: "all",                  label: "All Services" },
  { key: "learning_material",   label: "Learning Materials" },
  { key: "furniture_equipment", label: "Furniture & Equipment" },
  { key: "reprographics",       label: "Reprographics" },
  { key: "training_equipment",  label: "Training Equipment" },
  { key: "venue_facility",      label: "Venues & Facilities" },
  { key: "technology",          label: "Technology" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.round(rating) ? "text-gold fill-gold" : "text-muted stroke-muted-foreground fill-none"}`}
        />
      ))}
    </div>
  );
}

function formatPrice(from: number | null, to: number | null, currency: string, model: string) {
  if (!from && !to) return "Contact for pricing";
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;
  if (model === "hourly") return `${fmt(from ?? 0)}/hr${to ? ` – ${fmt(to)}/hr` : ""}`;
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  return fmt(from ?? to ?? 0);
}

export function MarketplaceDiscoveryWidget() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const { data: listings = [], isLoading, error } = useQuery({
    queryKey: ["provider-listings", category],
    queryFn: async () => {
      let q = supabase
        .from("provider_listings" as never)
        .select("id, title, category, description, pricing_model, price_from, price_to, currency, location, certifications, services, rating_avg, review_count")
        .eq("status", "active")
        .order("rating_avg", { ascending: false });
      if (category !== "all") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ProviderListing[];
    },
  });

  const filtered = listings.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
    (l.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search support providers…"
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
              category === cat.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">{filtered.length} provider{filtered.length !== 1 ? "s" : ""} found</p>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" /> Failed to load providers
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-10 space-y-2">
          <Store className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No providers listed in this category yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {filtered.map(listing => (
          <div key={listing.id} className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-all space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                  {listing.category.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <StarRating rating={listing.rating_avg} />
                <span className="text-[10px] text-muted-foreground">({listing.review_count})</span>
              </div>
            </div>

            {listing.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
            )}

            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                {listing.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.location}</span>
                )}
                <span className="font-semibold text-foreground">
                  {formatPrice(listing.price_from, listing.price_to, listing.currency, listing.pricing_model)}
                </span>
              </div>
              <button className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all">
                Contact
              </button>
            </div>

            {listing.services && listing.services.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {listing.services.slice(0, 4).map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                ))}
                {listing.services.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">+{listing.services.length - 4} more</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
