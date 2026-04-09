import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Eye, Edit2, TrendingUp, Plus, Save, X, Trash2, Loader2, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Listing {
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
  status: string;
}

const CATEGORIES = [
  { key: "learning_material", label: "Materials" },
  { key: "furniture_equipment", label: "Furniture & Equipment" },
  { key: "reprographics", label: "Reprographics" },
  { key: "training_equipment", label: "Training Equipment" },
  { key: "venue_facility", label: "Venues & Facilities" },
  { key: "technology", label: "Technology" },
  { key: "consulting", label: "Consulting" },
];

const PRICING_MODELS: Record<string, string> = {
  project: "Per Project",
  hourly: "Hourly Rate",
  fixed: "Fixed Price",
  daily: "Per Day",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-500/15 text-green-600" },
  pending: { label: "Pending", color: "bg-accent/20 text-accent-foreground" },
  inactive: { label: "Inactive", color: "bg-muted text-muted-foreground" },
};

const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";

const BLANK = {
  title: "", category: "learning_material", description: "",
  pricing_model: "project", price_from: "", price_to: "",
  currency: "ZAR", location: "", certifications: "", services: "",
};

function formatPrice(l: Listing) {
  const from = l.price_from;
  const suffix = PRICING_MODELS[l.pricing_model] ? `/${l.pricing_model === "project" ? "project" : l.pricing_model === "hourly" ? "hr" : l.pricing_model === "daily" ? "day" : ""}` : "";
  if (from) return `R${from.toLocaleString()}${suffix}`;
  return "";
}

function categoryLabel(key: string) {
  return CATEGORIES.find(c => c.key === key)?.label ?? key.replace(/_/g, " ");
}

export function MarketplaceListingWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["my-provider-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_listings")
        .select("id, title, category, description, pricing_model, price_from, price_to, currency, location, certifications, services, rating_avg, review_count, status")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Listing[];
    },
  });

  const totalViews = 0; // views not tracked on provider_listings yet
  const totalInquiries = 0;

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        title: form.title,
        category: form.category,
        description: form.description || null,
        pricing_model: form.pricing_model,
        price_from: form.price_from ? parseFloat(form.price_from) : null,
        price_to: form.price_to ? parseFloat(form.price_to) : null,
        currency: form.currency,
        location: form.location || null,
        certifications: form.certifications ? form.certifications.split(",").map(s => s.trim()).filter(Boolean) : [],
        services: form.services ? form.services.split(",").map(s => s.trim()).filter(Boolean) : [],
        status: "active" as const,
      };
      if (editing) {
        const { error } = await supabase.from("provider_listings").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("provider_listings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-provider-listings"] });
      setShowForm(false);
      setEditing(null);
      setForm(BLANK);
      toast({ title: editing ? "Listing updated!" : "Listing published!" });
    },
    onError: (e) => toast({ title: "Save failed", description: String(e), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("provider_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-provider-listings"] });
      toast({ title: "Listing removed" });
    },
  });

  const startEdit = (l: Listing) => {
    setEditing(l.id);
    setForm({
      title: l.title,
      category: l.category,
      description: l.description ?? "",
      pricing_model: l.pricing_model,
      price_from: l.price_from?.toString() ?? "",
      price_to: l.price_to?.toString() ?? "",
      currency: l.currency,
      location: l.location ?? "",
      certifications: (l.certifications ?? []).join(", "),
      services: (l.services ?? []).join(", "),
    });
    setShowForm(true);
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{listings.length}</p>
          <p className="text-xs text-muted-foreground">Listings</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{totalViews}</p>
          <p className="text-xs text-muted-foreground">Total Views</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{totalInquiries}</p>
          <p className="text-xs text-muted-foreground">Inquiries</p>
        </div>
      </div>

      {/* Add / Cancel button */}
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm(v => !v); setEditing(null); setForm(BLANK); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Add Listing"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">{editing ? "Edit Listing" : "New Service Listing"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input {...field("title")} placeholder="Listing title *" className={INPUT} />
            <select {...field("category")} className={INPUT}>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <input {...field("location")} placeholder="Location / Remote" className={INPUT} />
            <select {...field("pricing_model")} className={INPUT}>
              {Object.entries(PRICING_MODELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input {...field("price_from")} type="number" placeholder="Price from (ZAR)" className={INPUT} />
            <input {...field("price_to")} type="number" placeholder="Price to (ZAR)" className={INPUT} />
          </div>
          <textarea {...field("description")} placeholder="Service description…" rows={3} className={`${INPUT} resize-none`} />
          <input {...field("services")} placeholder="Services offered (comma-separated)" className={INPUT} />
          <input {...field("certifications")} placeholder="Certifications (comma-separated)" className={INPUT} />
          <button
            onClick={() => save.mutate()}
            disabled={!form.title || save.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {editing ? "Save Changes" : "Publish Listing"}
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      )}

      {/* Empty */}
      {!isLoading && listings.length === 0 && !showForm && (
        <div className="text-center py-10 space-y-2">
          <Store className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No listings yet. Publish your first service to get discovered.</p>
        </div>
      )}

      {/* Listing cards */}
      <div className="space-y-2">
        {listings.map(listing => {
          const cfg = statusConfig[listing.status] ?? statusConfig.inactive;
          return (
            <div key={listing.id} className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">{categoryLabel(listing.category)} · {formatPrice(listing)}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    {listing.review_count > 0 && (
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-accent text-accent" />{listing.rating_avg.toFixed(1)}</span>
                    )}
                    {listing.location && <span>{listing.location}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(listing)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove.mutate(listing.id)} disabled={remove.isPending} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                      {remove.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
