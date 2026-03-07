/**
 * Mock opportunity data for Browse Opportunities widget.
 * In production, this will be replaced by a Supabase query.
 */

export type OpportunityType =
  | "learnership"
  | "job"
  | "gig"
  | "programme"
  | "apprenticeship"
  | "bursary";

export type OpportunityCategory =
  | "ICT"
  | "Construction"
  | "Finance"
  | "Health"
  | "Education"
  | "Engineering"
  | "Agriculture"
  | "Hospitality";

export interface Opportunity {
  id: string;
  title: string;
  organisation: string;
  type: OpportunityType;
  category: OpportunityCategory;
  location: string;
  stipend?: string;          // monthly stipend / salary
  duration?: string;         // e.g. "12 months"
  closingDate: string;       // ISO date
  seta?: string;             // accrediting SETA
  bbbeePoints?: boolean;     // qualifies for B-BBEE
  verified: boolean;
  featured: boolean;         // first 3 are freely visible; rest are gated on starter
  description: string;
  tags: string[];
}

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-001",
    title: "ICT Systems Support Learnership",
    organisation: "TechCorp SA",
    type: "learnership",
    category: "ICT",
    location: "Cape Town, WC",
    stipend: "R 4 200 / month",
    duration: "12 months",
    closingDate: "2026-04-30",
    seta: "MICT SETA",
    bbbeePoints: true,
    verified: true,
    featured: true,
    description: "Join our NQF Level 4 ICT: Systems Support learnership. Gain hands-on experience in networking, hardware maintenance and IT support.",
    tags: ["NQF 4", "IT Support", "Networking"],
  },
  {
    id: "opp-002",
    title: "Finance & Accounting Graduate Programme",
    organisation: "CapitalEdge Group",
    type: "programme",
    category: "Finance",
    location: "Sandton, GP",
    stipend: "R 12 000 / month",
    duration: "24 months",
    closingDate: "2026-05-15",
    seta: "FASSET",
    bbbeePoints: true,
    verified: true,
    featured: true,
    description: "A structured 2-year graduate programme for BCom graduates. Rotations through audit, tax, and advisory business units.",
    tags: ["BCom", "Graduate", "Finance"],
  },
  {
    id: "opp-003",
    title: "Construction Site Supervisor Apprenticeship",
    organisation: "BuildRight Contractors",
    type: "apprenticeship",
    category: "Construction",
    location: "Durban, KZN",
    stipend: "R 6 500 / month",
    duration: "18 months",
    closingDate: "2026-04-10",
    seta: "CETA",
    bbbeePoints: false,
    verified: true,
    featured: true,
    description: "Hands-on apprenticeship combining on-site learning with technical college attendance. Leads to trade test certification.",
    tags: ["Trade", "NQF 3", "Site Management"],
  },
  {
    id: "opp-004",
    title: "Healthcare Support Worker Learnership",
    organisation: "MediLearn Foundation",
    type: "learnership",
    category: "Health",
    location: "Pretoria, GP",
    stipend: "R 3 800 / month",
    duration: "12 months",
    closingDate: "2026-06-01",
    seta: "HWSETA",
    bbbeePoints: true,
    verified: true,
    featured: false,
    description: "NQF Level 3 Healthcare Support learnership. Theory and workplace experience across clinics and hospitals.",
    tags: ["Healthcare", "NQF 3", "Community Health"],
  },
  {
    id: "opp-005",
    title: "Digital Marketing Specialist (Contract Gig)",
    organisation: "PixelPulse Agency",
    type: "gig",
    category: "ICT",
    location: "Remote",
    stipend: "R 8 000 / project",
    duration: "3 months",
    closingDate: "2026-03-31",
    verified: false,
    featured: false,
    description: "Short-term contract for a digital marketing specialist. Focus on social media strategy, content creation and paid campaigns.",
    tags: ["Remote", "Contract", "Marketing"],
  },
  {
    id: "opp-006",
    title: "Agricultural Practices NQF 2 Learnership",
    organisation: "GreenField Agri",
    type: "learnership",
    category: "Agriculture",
    location: "Stellenbosch, WC",
    stipend: "R 3 200 / month",
    duration: "12 months",
    closingDate: "2026-05-30",
    seta: "AgriSeta",
    bbbeePoints: true,
    verified: true,
    featured: false,
    description: "Entry-level agri learnership covering crop management, soil science and sustainable farming practices.",
    tags: ["Agriculture", "NQF 2", "Rural"],
  },
  {
    id: "opp-007",
    title: "Early Childhood Development Bursary",
    organisation: "EduCare Trust",
    type: "bursary",
    category: "Education",
    location: "Nationwide",
    duration: "3 years",
    closingDate: "2026-04-15",
    seta: "ETDP SETA",
    bbbeePoints: false,
    verified: true,
    featured: false,
    description: "Full bursary covering tuition and accommodation for qualifying students pursuing a Diploma in Early Childhood Development.",
    tags: ["Bursary", "ECD", "Diploma"],
  },
  {
    id: "opp-008",
    title: "Electrical Engineering Learnership",
    organisation: "PowerGrid Utilities",
    type: "learnership",
    category: "Engineering",
    location: "Johannesburg, GP",
    stipend: "R 7 500 / month",
    duration: "24 months",
    closingDate: "2026-07-01",
    seta: "MERSETA",
    bbbeePoints: true,
    verified: true,
    featured: false,
    description: "NQF Level 4 Electrical Engineering learnership with focus on installation, maintenance and fault finding.",
    tags: ["Engineering", "NQF 4", "Trade"],
  },
];
