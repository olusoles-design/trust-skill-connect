import { useState } from "react";
import { Search, Filter, UserPlus, MapPin, BookOpen, Star } from "lucide-react";
import { toast } from "sonner";

interface Candidate {
  id: string;
  name: string;
  nqfLevel: number;
  qualifications: string[];
  province: string;
  gender: "M" | "F";
  race: string;
  age: number;
  experience: string;
  status: "available" | "placed" | "pending";
  rating: number;
  completedProgrammes: number;
}

const MOCK: Candidate[] = [
  { id:"1", name:"Aisha Khumalo",   nqfLevel:4, qualifications:["Data Analytics","IT Support"], province:"Gauteng",   gender:"F", race:"African",  age:24, experience:"1 yr",   status:"available", rating:4.8, completedProgrammes:2 },
  { id:"2", name:"Sipho Ndlovu",    nqfLevel:3, qualifications:["Business Admin"],              province:"Gauteng",   gender:"M", race:"African",  age:22, experience:"0 yrs",  status:"available", rating:4.2, completedProgrammes:1 },
  { id:"3", name:"Zanele Mokoena",  nqfLevel:4, qualifications:["Customer Service","Sales"],    province:"KZN",       gender:"F", race:"African",  age:26, experience:"2 yrs",  status:"available", rating:4.9, completedProgrammes:3 },
  { id:"4", name:"Thabo Dlamini",   nqfLevel:3, qualifications:["IT Support"],                 province:"W. Cape",  gender:"M", race:"African",  age:21, experience:"0 yrs",  status:"pending",   rating:3.7, completedProgrammes:1 },
  { id:"5", name:"Nomvula Sithole", nqfLevel:3, qualifications:["Admin","Reception"],          province:"Mpumalanga",gender:"F", race:"African",  age:23, experience:"1 yr",   status:"available", rating:4.4, completedProgrammes:2 },
  { id:"6", name:"Kagiso Motsepe",  nqfLevel:5, qualifications:["Management","Leadership"],    province:"Gauteng",   gender:"M", race:"Coloured", age:29, experience:"3 yrs",  status:"available", rating:4.7, completedProgrammes:2 },
  { id:"7", name:"Lerato Phiri",    nqfLevel:4, qualifications:["Finance","Bookkeeping"],      province:"Free State",gender:"F", race:"African",  age:27, experience:"2 yrs",  status:"available", rating:4.6, completedProgrammes:2 },
];

const STATUS_CFG = {
  available: "bg-emerald-500/10 text-emerald-600",
  placed:    "bg-primary/10 text-primary",
  pending:   "bg-muted text-muted-foreground",
};

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} className={`w-2.5 h-2.5 ${i <= Math.round(n) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />)}
      <span className="text-[10px] text-muted-foreground ml-1">{n}</span>
    </span>
  );
}

export function LearnerRecruitmentWidget() {
  const [search,   setSearch]   = useState("");
  const [province, setProvince] = useState("All");
  const [nqf,      setNqf]      = useState("All");
  const [gender,   setGender]   = useState("All");

  const provinces  = ["All", ...Array.from(new Set(MOCK.map(c => c.province)))];
  const nqfLevels  = ["All", "3", "4", "5"];

  const filtered = MOCK.filter(c =>
    (search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.qualifications.some(q => q.toLowerCase().includes(search.toLowerCase()))) &&
    (province === "All" || c.province === province) &&
    (nqf === "All" || c.nqfLevel === Number(nqf)) &&
    (gender === "All" || c.gender === gender) &&
    c.status !== "placed"
  );

  return (
    <div className="space-y-4">
      {/* Pool stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-black text-foreground">{MOCK.filter(c => c.status === "available").length}</p>
          <p className="text-[10px] text-muted-foreground">Available Now</p>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
          <p className="text-xl font-black text-primary">{MOCK.filter(c => c.gender === "F").length}</p>
          <p className="text-[10px] text-primary/70">Female</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-black text-foreground">{MOCK.filter(c => c.nqfLevel >= 4).length}</p>
          <p className="text-[10px] text-muted-foreground">NQF 4+</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-32">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        {[
          { label:"Province", val:province, set:setProvince, opts:provinces },
          { label:"NQF",      val:nqf,      set:setNqf,      opts:nqfLevels },
          { label:"Gender",   val:gender,   set:setGender,   opts:["All","M","F"] },
        ].map(f => (
          <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30">
            {f.opts.map(o => <option key={o} value={o}>{f.label === "NQF" && o !== "All" ? `NQF ${o}` : o}</option>)}
          </select>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">{filtered.length} candidates match your filters</p>

      {/* Candidate cards */}
      <div className="space-y-2.5">
        {filtered.map(c => (
          <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all group">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {c.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold text-foreground">{c.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_CFG[c.status]}`}>{c.status}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {c.qualifications.map(q => (
                  <span key={q} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-0.5">
                    <BookOpen className="w-2.5 h-2.5" />{q}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{c.province}</span>
                <span>NQF {c.nqfLevel}</span>
                <span>{c.gender === "F" ? "Female" : "Male"} · {c.race}</span>
                <span>{c.experience} exp</span>
              </div>
              <div className="mt-1"><Stars n={c.rating} /></div>
            </div>
            <button
              onClick={() => toast.success(`Shortlisted ${c.name}`)}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold transition-all flex-shrink-0"
            >
              <UserPlus className="w-3 h-3" /> Shortlist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
