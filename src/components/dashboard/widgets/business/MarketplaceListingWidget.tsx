import { Star, Eye, Edit2, TrendingUp } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  category: string;
  status: "active" | "pending" | "inactive";
  views: number;
  inquiries: number;
  rating: number;
  price: string;
}

const MOCK: Listing[] = [
  { id:"1", title:"Learning Material Development", category:"Materials",   status:"active",   views:234, inquiries:12, rating:4.8, price:"R8 500/project" },
  { id:"2", title:"SETA Accreditation Consulting",  category:"Consulting", status:"active",   views:188, inquiries:9,  rating:4.6, price:"R2 200/hr" },
  { id:"3", title:"Venue Hire — Cape Town CBD",      category:"Venue",     status:"pending",  views:56,  inquiries:3,  rating:0,   price:"R3 500/day" },
];

const statusConfig = {
  active:   { label:"Active",   color:"bg-green-500/15 text-green-600" },
  pending:  { label:"Pending",  color:"bg-accent/20 text-accent-foreground" },
  inactive: { label:"Inactive", color:"bg-muted text-muted-foreground" },
};

export function MarketplaceListingWidget() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{MOCK.length}</p>
          <p className="text-xs text-muted-foreground">Listings</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{MOCK.reduce((s,l)=>s+l.views,0)}</p>
          <p className="text-xs text-muted-foreground">Total Views</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{MOCK.reduce((s,l)=>s+l.inquiries,0)}</p>
          <p className="text-xs text-muted-foreground">Inquiries</p>
        </div>
      </div>

      <div className="space-y-2">
        {MOCK.map(listing => {
          const cfg = statusConfig[listing.status];
          return (
            <div key={listing.id} className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">{listing.category} · {listing.price}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.views}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{listing.inquiries} inquiries</span>
                    {listing.rating > 0 && (
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-accent text-accent" />{listing.rating}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
