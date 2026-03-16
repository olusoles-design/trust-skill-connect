import { useState } from "react";
import { Database, Shield, Key, Link, Search, ChevronDown, ChevronRight, Eye, Lock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ─── Schema Data ──────────────────────────────────────────────────────────────

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

interface RLSPolicy {
  name: string;
  command: string;
  using?: string;
  check?: string;
}

interface ForeignKey {
  column: string;
  references: string;
}

interface TableDef {
  name: string;
  columns: Column[];
  rlsPolicies: RLSPolicy[];
  foreignKeys?: ForeignKey[];
  blocked?: string[]; // actions users can't do
}

const TABLES: TableDef[] = [
  {
    name: "accreditation_qualifications",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "accreditation_id", type: "uuid", nullable: false },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "title", type: "text", nullable: false },
      { name: "saqa_id", type: "text", nullable: true },
      { name: "nqf_level", type: "text", nullable: true },
      { name: "credits", type: "integer", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Admins manage qualifications", command: "ALL", using: "has_role(auth.uid(), 'admin')" },
      { name: "Users view own qualifications", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Users insert own qualifications", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users delete own qualifications", command: "DELETE", using: "auth.uid() = user_id" },
    ],
  },
  {
    name: "applications",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "applicant_id", type: "uuid", nullable: false },
      { name: "opportunity_id", type: "uuid", nullable: false },
      { name: "status", type: "text", nullable: false, default: "'pending'" },
      { name: "cover_note", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Applicant submits application", command: "INSERT", check: "auth.uid() = applicant_id" },
      { name: "Applicant views own applications", command: "SELECT", using: "auth.uid() = applicant_id" },
      { name: "Applicant can withdraw application", command: "DELETE", using: "auth.uid() = applicant_id" },
      { name: "Poster views applications on own listings", command: "SELECT", using: "opportunity posted_by = auth.uid()" },
      { name: "Poster updates application status", command: "UPDATE", using: "opportunity posted_by = auth.uid()" },
    ],
  },
  {
    name: "audit_logs",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "actor_id", type: "uuid", nullable: false },
      { name: "actor_role", type: "text", nullable: false },
      { name: "action", type: "text", nullable: false },
      { name: "entity_type", type: "text", nullable: false },
      { name: "entity_id", type: "text", nullable: false },
      { name: "entity_label", type: "text", nullable: true },
      { name: "before_data", type: "jsonb", nullable: true },
      { name: "after_data", type: "jsonb", nullable: true },
      { name: "metadata", type: "jsonb", nullable: false, default: "'{}'" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Actors insert own audit logs", command: "INSERT", check: "auth.uid() = actor_id" },
      { name: "Admins read all audit logs", command: "SELECT", using: "has_role(auth.uid(), 'admin')" },
      { name: "SETA reads audit logs", command: "SELECT", using: "has_role(auth.uid(), 'seta')" },
      { name: "Government reads audit logs", command: "SELECT", using: "has_role(auth.uid(), 'government')" },
      { name: "Users read own audit trail", command: "SELECT", using: "auth.uid() = actor_id" },
    ],
    blocked: ["UPDATE", "DELETE"],
  },
  {
    name: "company_participants",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "opportunity_id", type: "uuid", nullable: false },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "company_name", type: "text", nullable: false },
      { name: "role", type: "text", nullable: false },
      { name: "status", type: "text", nullable: false, default: "'active'" },
      { name: "cost_share_percentage", type: "numeric", nullable: true, default: "0" },
      { name: "bbbee_points_allocated", type: "numeric", nullable: true, default: "0" },
      { name: "agreement_document_url", type: "text", nullable: true },
      { name: "notes", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Admins manage all participants", command: "ALL", using: "has_role(auth.uid(), 'admin')" },
      { name: "Participant views own record", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Poster manages participants on own opportunity", command: "ALL", using: "opportunity posted_by = auth.uid()" },
    ],
  },
  {
    name: "document_vault",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "label", type: "text", nullable: false },
      { name: "doc_type", type: "text", nullable: false },
      { name: "file_name", type: "text", nullable: false },
      { name: "file_url", type: "text", nullable: false },
      { name: "file_size", type: "bigint", nullable: true },
      { name: "mime_type", type: "text", nullable: true },
      { name: "status", type: "text", nullable: false, default: "'pending'" },
      { name: "expires_at", type: "date", nullable: true },
      { name: "reviewed_by", type: "uuid", nullable: true },
      { name: "reviewed_at", type: "timestamptz", nullable: true },
      { name: "reviewer_note", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Users insert own documents", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users view own documents", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Users delete own pending documents", command: "DELETE", using: "auth.uid() = user_id AND status = 'pending'" },
      { name: "Admins view all documents", command: "SELECT", using: "has_role(admin) OR has_role(seta)" },
      { name: "Admins update document status", command: "UPDATE", using: "has_role(admin) OR has_role(seta)" },
    ],
  },
  {
    name: "eoi_submissions",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "provider_id", type: "uuid", nullable: false },
      { name: "funding_opp_id", type: "uuid", nullable: false },
      { name: "status", type: "text", nullable: false, default: "'pending'" },
      { name: "message", type: "text", nullable: true },
      { name: "accreditations", type: "jsonb", nullable: false, default: "'[]'" },
      { name: "proposed_start", type: "date", nullable: true },
      { name: "reviewed_at", type: "timestamptz", nullable: true },
      { name: "reviewer_note", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Provider submits EOI", command: "INSERT", check: "auth.uid() = provider_id" },
      { name: "Provider views own EOIs", command: "SELECT", using: "auth.uid() = provider_id" },
      { name: "Provider updates own pending EOI", command: "UPDATE", using: "auth.uid() = provider_id AND status = 'pending'" },
      { name: "Provider withdraws own pending EOI", command: "DELETE", using: "auth.uid() = provider_id AND status = 'pending'" },
      { name: "Sponsor views EOIs on own opportunities", command: "SELECT", using: "funding_opp sponsor_id = auth.uid()" },
      { name: "Admins manage all EOIs", command: "ALL", using: "has_role(auth.uid(), 'admin')" },
    ],
  },
  {
    name: "funding_opportunities",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "sponsor_id", type: "uuid", nullable: false },
      { name: "title", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "programme_type", type: "text", nullable: false, default: "'learnership'" },
      { name: "status", type: "text", nullable: false, default: "'open'" },
      { name: "seats_available", type: "integer", nullable: false, default: "1" },
      { name: "total_budget", type: "numeric", nullable: true },
      { name: "budget_per_learner", type: "numeric", nullable: true },
      { name: "currency", type: "text", nullable: false, default: "'ZAR'" },
      { name: "nqf_level", type: "text", nullable: true },
      { name: "sector", type: "text", nullable: true },
      { name: "province", type: "text", nullable: true },
      { name: "start_date", type: "date", nullable: true },
      { name: "application_deadline", type: "date", nullable: true },
      { name: "duration", type: "text", nullable: true },
      { name: "requirements", type: "jsonb", nullable: false, default: "'[]'" },
      { name: "awarded_to", type: "uuid", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Sponsor inserts own funding opportunities", command: "INSERT", check: "auth.uid() = sponsor_id" },
      { name: "Sponsor views own funding opportunities", command: "SELECT", using: "auth.uid() = sponsor_id" },
      { name: "Sponsor updates own funding opportunities", command: "UPDATE", using: "auth.uid() = sponsor_id" },
      { name: "Sponsor deletes own funding opportunities", command: "DELETE", using: "auth.uid() = sponsor_id" },
      { name: "Public view open funding opportunities", command: "SELECT", using: "status = 'open'" },
      { name: "Admins manage all funding opportunities", command: "ALL", using: "has_role(auth.uid(), 'admin')" },
    ],
  },
  {
    name: "match_results",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "opportunity_id", type: "uuid", nullable: false },
      { name: "score", type: "integer", nullable: false, default: "0" },
      { name: "explanation", type: "text", nullable: true },
      { name: "factors", type: "jsonb", nullable: true, default: "'{}'" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Users upsert own matches", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users view own matches", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Users update own matches", command: "UPDATE", using: "auth.uid() = user_id" },
    ],
    blocked: ["DELETE"],
  },
  {
    name: "micro_tasks",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "posted_by", type: "uuid", nullable: false },
      { name: "title", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "category", type: "text", nullable: true },
      { name: "status", type: "text", nullable: false, default: "'available'" },
      { name: "location", type: "text", nullable: false, default: "'Remote'" },
      { name: "pay", type: "text", nullable: true },
      { name: "duration", type: "text", nullable: true },
      { name: "urgency", type: "text", nullable: false, default: "'Flexible'" },
      { name: "skills", type: "text[]", nullable: true },
      { name: "employer", type: "text", nullable: true },
      { name: "max_workers", type: "integer", nullable: false, default: "1" },
      { name: "accepted_by", type: "uuid", nullable: true },
      { name: "escrow_held", type: "numeric", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Poster inserts own micro_task", command: "INSERT", check: "auth.uid() = posted_by" },
      { name: "Poster views own tasks", command: "SELECT", using: "auth.uid() = posted_by" },
      { name: "Poster updates own micro_task", command: "UPDATE", using: "auth.uid() = posted_by" },
      { name: "Poster deletes own micro_task", command: "DELETE", using: "auth.uid() = posted_by" },
      { name: "Learners browse available tasks", command: "SELECT", using: "status = 'available' AND has_role(learner)" },
      { name: "Admins view all micro_tasks", command: "SELECT", using: "has_role(auth.uid(), 'admin')" },
    ],
  },
  {
    name: "opportunities",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "posted_by", type: "uuid", nullable: false },
      { name: "title", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "type", type: "text", nullable: false, default: "'job'" },
      { name: "category", type: "text", nullable: true },
      { name: "organisation", type: "text", nullable: true },
      { name: "location", type: "text", nullable: true },
      { name: "status", type: "text", nullable: false, default: "'active'" },
      { name: "stipend", type: "text", nullable: true },
      { name: "duration", type: "text", nullable: true },
      { name: "seta", type: "text", nullable: true },
      { name: "nqf_level_required", type: "text", nullable: true },
      { name: "closing_date", type: "date", nullable: true },
      { name: "applications", type: "integer", nullable: false, default: "0" },
      { name: "views", type: "integer", nullable: false, default: "0" },
      { name: "featured", type: "boolean", nullable: true, default: "false" },
      { name: "verified", type: "boolean", nullable: true, default: "false" },
      { name: "bbee_points", type: "boolean", nullable: true, default: "false" },
      { name: "tags", type: "text[]", nullable: true },
      { name: "languages_required", type: "text[]", nullable: true, default: "'{}'" },
      { name: "demographics_target", type: "jsonb", nullable: true, default: "'{}'" },
      { name: "regulatory_body_id", type: "uuid", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Poster can insert own opportunity", command: "INSERT", check: "auth.uid() = posted_by" },
      { name: "Anyone can view active opportunities", command: "SELECT", using: "status = 'active'" },
      { name: "Poster can update own opportunity", command: "UPDATE", using: "auth.uid() = posted_by" },
      { name: "Poster can delete own opportunity", command: "DELETE", using: "auth.uid() = posted_by" },
    ],
    foreignKeys: [{ column: "regulatory_body_id", references: "regulatory_bodies.id" }],
  },
  {
    name: "payment_transactions",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "type", type: "text", nullable: false },
      { name: "gateway", type: "text", nullable: false },
      { name: "amount", type: "numeric", nullable: false },
      { name: "currency", type: "text", nullable: false, default: "'ZAR'" },
      { name: "status", type: "text", nullable: false, default: "'pending'" },
      { name: "gateway_ref", type: "text", nullable: true },
      { name: "metadata", type: "jsonb", nullable: true, default: "'{}'" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Service inserts transactions", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users view own transactions", command: "SELECT", using: "auth.uid() = user_id" },
    ],
    blocked: ["UPDATE", "DELETE"],
  },
  {
    name: "practitioner_accreditations",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "seta_body", type: "text", nullable: false },
      { name: "role_type", type: "text", nullable: false },
      { name: "registration_number", type: "text", nullable: true },
      { name: "status", type: "text", nullable: false, default: "'active'" },
      { name: "valid_from", type: "date", nullable: true },
      { name: "valid_to", type: "date", nullable: true },
      { name: "document_url", type: "text", nullable: true },
      { name: "id_number", type: "text", nullable: true },
      { name: "raw_extracted", type: "jsonb", nullable: true, default: "'{}'" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Users insert own accreditations", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users view own accreditations", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Users update own accreditations", command: "UPDATE", using: "auth.uid() = user_id" },
      { name: "Users delete own accreditations", command: "DELETE", using: "auth.uid() = user_id" },
      { name: "Authenticated users view active accreditations", command: "SELECT", using: "status = 'active'" },
      { name: "Admins manage all accreditations", command: "ALL", using: "has_role(auth.uid(), 'admin')" },
    ],
  },
  {
    name: "practitioner_listings",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "first_name", type: "text", nullable: false },
      { name: "last_name", type: "text", nullable: false },
      { name: "job_title", type: "text", nullable: true },
      { name: "bio", type: "text", nullable: true },
      { name: "location", type: "text", nullable: true },
      { name: "province", type: "text", nullable: true },
      { name: "availability", type: "text", nullable: true, default: "'flexible'" },
      { name: "nqf_level", type: "text", nullable: true },
      { name: "years_exp", type: "integer", nullable: true },
      { name: "skills", type: "text[]", nullable: true, default: "'{}'" },
      { name: "languages", type: "text[]", nullable: true, default: "'{}'" },
      { name: "avatar_url", type: "text", nullable: true },
      { name: "email", type: "text", nullable: true },
      { name: "phone", type: "text", nullable: true },
      { name: "linkedin_url", type: "text", nullable: true },
      { name: "status", type: "text", nullable: false, default: "'active'" },
      { name: "is_verified", type: "boolean", nullable: false, default: "false" },
      { name: "is_featured", type: "boolean", nullable: false, default: "false" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Owner manages own listing", command: "ALL", using: "auth.uid() = user_id" },
      { name: "Public view active practitioner listings", command: "SELECT", using: "status = 'active'" },
      { name: "Admins manage practitioner listings", command: "ALL", using: "has_role(auth.uid(), 'admin')" },
    ],
  },
  {
    name: "practitioner_listing_accreds",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "listing_id", type: "uuid", nullable: false },
      { name: "seta_body", type: "text", nullable: false },
      { name: "role_type", type: "text", nullable: false },
      { name: "reg_number", type: "text", nullable: true },
      { name: "status", type: "text", nullable: false, default: "'active'" },
      { name: "valid_from", type: "date", nullable: true },
      { name: "valid_to", type: "date", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Public view practitioner listing accreds", command: "SELECT", using: "true" },
      { name: "Admins manage practitioner listing accreds", command: "ALL", using: "has_role(auth.uid(), 'admin')" },
    ],
    foreignKeys: [{ column: "listing_id", references: "practitioner_listings.id" }],
  },
  {
    name: "profiles",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "first_name", type: "text", nullable: true },
      { name: "last_name", type: "text", nullable: true },
      { name: "username", type: "text", nullable: true },
      { name: "bio", type: "text", nullable: true },
      { name: "avatar_url", type: "text", nullable: true },
      { name: "job_title", type: "text", nullable: true },
      { name: "company_name", type: "text", nullable: true },
      { name: "location", type: "text", nullable: true },
      { name: "phone", type: "text", nullable: true },
      { name: "linkedin_url", type: "text", nullable: true },
      { name: "website_url", type: "text", nullable: true },
      { name: "nqf_level", type: "text", nullable: true },
      { name: "availability", type: "text", nullable: true, default: "'flexible'" },
      { name: "id_number", type: "text", nullable: true },
      { name: "skills", type: "text[]", nullable: true },
      { name: "languages", type: "text[]", nullable: true, default: "'{}'" },
      { name: "demographics", type: "jsonb", nullable: true, default: "'{}'" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Users can insert their own profile", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users can view their own profile", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Users can update their own profile", command: "UPDATE", using: "auth.uid() = user_id" },
      { name: "Authenticated users view profiles", command: "SELECT", using: "true (authenticated)" },
    ],
    blocked: ["DELETE"],
  },
  {
    name: "provider_listings",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "title", type: "text", nullable: false },
      { name: "category", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "pricing_model", type: "text", nullable: false, default: "'project'" },
      { name: "price_from", type: "numeric", nullable: true },
      { name: "price_to", type: "numeric", nullable: true },
      { name: "currency", type: "text", nullable: false, default: "'ZAR'" },
      { name: "location", type: "text", nullable: true },
      { name: "services", type: "text[]", nullable: true },
      { name: "certifications", type: "text[]", nullable: true },
      { name: "portfolio_urls", type: "text[]", nullable: true },
      { name: "status", type: "text", nullable: false, default: "'active'" },
      { name: "rating_avg", type: "numeric", nullable: false, default: "0" },
      { name: "review_count", type: "integer", nullable: false, default: "0" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Owner inserts listing", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Owner views own listings", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Owner updates listing", command: "UPDATE", using: "auth.uid() = user_id" },
      { name: "Owner deletes listing", command: "DELETE", using: "auth.uid() = user_id" },
      { name: "Anyone views active provider listings", command: "SELECT", using: "status = 'active'" },
    ],
  },
  {
    name: "provider_reviews",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "listing_id", type: "uuid", nullable: false },
      { name: "reviewer_id", type: "uuid", nullable: false },
      { name: "rating", type: "integer", nullable: false },
      { name: "comment", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Authenticated users add reviews", command: "INSERT", check: "auth.uid() = reviewer_id" },
      { name: "Anyone views reviews", command: "SELECT", using: "true" },
      { name: "Reviewer deletes own review", command: "DELETE", using: "auth.uid() = reviewer_id" },
    ],
    blocked: ["UPDATE"],
    foreignKeys: [{ column: "listing_id", references: "provider_listings.id" }],
  },
  {
    name: "regulatory_bodies",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "acronym", type: "text", nullable: false },
      { name: "full_name", type: "text", nullable: false },
      { name: "body_type", type: "text", nullable: false },
      { name: "sector", type: "text", nullable: true },
      { name: "is_active", type: "boolean", nullable: false, default: "true" },
      { name: "is_levy_funded", type: "boolean", nullable: false, default: "false" },
      { name: "website_url", type: "text", nullable: true },
      { name: "doc_rules", type: "jsonb", nullable: false, default: "'[]'" },
      { name: "reporting_formats", type: "jsonb", nullable: false, default: "'[]'" },
      { name: "notes", type: "text", nullable: true },
      { name: "sort_order", type: "integer", nullable: false, default: "0" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Public read active regulatory bodies", command: "SELECT", using: "is_active = true" },
      { name: "Admins manage regulatory bodies", command: "ALL", using: "has_role(auth.uid(), 'admin')" },
    ],
  },
  {
    name: "reports",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "regulatory_body_id", type: "uuid", nullable: true },
      { name: "report_type", type: "text", nullable: false },
      { name: "financial_year", type: "text", nullable: false },
      { name: "status", type: "text", nullable: false, default: "'generated'" },
      { name: "data_snapshot", type: "jsonb", nullable: false, default: "'{}'" },
      { name: "output_url", type: "text", nullable: true },
      { name: "submission_notes", type: "text", nullable: true },
      { name: "generated_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "submitted_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Users create own reports", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users view own reports", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Users update own reports", command: "UPDATE", using: "auth.uid() = user_id" },
      { name: "Admins manage all reports", command: "ALL", using: "has_role(auth.uid(), 'admin')" },
    ],
    foreignKeys: [{ column: "regulatory_body_id", references: "regulatory_bodies.id" }],
  },
  {
    name: "rfqs",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "buyer_id", type: "uuid", nullable: false },
      { name: "title", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "category", type: "text", nullable: true },
      { name: "status", type: "text", nullable: false, default: "'open'" },
      { name: "budget_from", type: "numeric", nullable: true },
      { name: "budget_to", type: "numeric", nullable: true },
      { name: "currency", type: "text", nullable: false, default: "'ZAR'" },
      { name: "deadline", type: "date", nullable: true },
      { name: "requirements", type: "jsonb", nullable: true, default: "'{}'" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Buyer manages own RFQs", command: "ALL", using: "auth.uid() = buyer_id" },
      { name: "Providers view open RFQs", command: "SELECT", using: "status = 'open'" },
    ],
  },
  {
    name: "rfq_responses",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "rfq_id", type: "uuid", nullable: false },
      { name: "provider_id", type: "uuid", nullable: false },
      { name: "listing_id", type: "uuid", nullable: true },
      { name: "proposal", type: "text", nullable: true },
      { name: "quote_amount", type: "numeric", nullable: true },
      { name: "currency", type: "text", nullable: false, default: "'ZAR'" },
      { name: "timeline", type: "text", nullable: true },
      { name: "status", type: "text", nullable: false, default: "'pending'" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Provider manages own responses", command: "ALL", using: "auth.uid() = provider_id" },
      { name: "Buyer views responses to own RFQs", command: "SELECT", using: "rfq buyer_id = auth.uid()" },
      { name: "Buyer updates response status", command: "UPDATE", using: "rfq buyer_id = auth.uid()" },
    ],
    foreignKeys: [
      { column: "rfq_id", references: "rfqs.id" },
      { column: "listing_id", references: "provider_listings.id" },
    ],
  },
  {
    name: "sponsor_profiles",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "company_name", type: "text", nullable: false },
      { name: "tagline", type: "text", nullable: true },
      { name: "description", type: "text", nullable: true },
      { name: "logo_url", type: "text", nullable: true },
      { name: "website_url", type: "text", nullable: true },
      { name: "linkedin_url", type: "text", nullable: true },
      { name: "contact_email", type: "text", nullable: true },
      { name: "contact_phone", type: "text", nullable: true },
      { name: "annual_budget", type: "text", nullable: true },
      { name: "programme_types", type: "text[]", nullable: true, default: "'{}'" },
      { name: "sectors", type: "text[]", nullable: true, default: "'{}'" },
      { name: "provinces", type: "text[]", nullable: true, default: "'{}'" },
      { name: "is_public", type: "boolean", nullable: false, default: "true" },
      { name: "verified", type: "boolean", nullable: false, default: "false" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Sponsor inserts own profile", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Sponsor views own profile", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Sponsor updates own profile", command: "UPDATE", using: "auth.uid() = user_id" },
      { name: "Sponsor deletes own profile", command: "DELETE", using: "auth.uid() = user_id" },
      { name: "Public view published sponsor profiles", command: "SELECT", using: "is_public = true" },
      { name: "Admins manage all sponsor profiles", command: "ALL", using: "has_role(auth.uid(), 'admin')" },
    ],
  },
  {
    name: "subscriptions",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "plan", type: "subscription_plan", nullable: false, default: "'starter'" },
      { name: "is_active", type: "boolean", nullable: false, default: "true" },
      { name: "trial_ends_at", type: "timestamptz", nullable: true, default: "now() + 30 days" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Users can insert their own subscription", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users can view their own subscription", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Users can update their own subscription", command: "UPDATE", using: "auth.uid() = user_id" },
    ],
    blocked: ["DELETE"],
  },
  {
    name: "task_ratings",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "task_id", type: "uuid", nullable: false },
      { name: "rater_id", type: "uuid", nullable: false },
      { name: "ratee_id", type: "uuid", nullable: false },
      { name: "role", type: "text", nullable: false },
      { name: "rating", type: "smallint", nullable: false },
      { name: "comment", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Authenticated users create ratings", command: "INSERT", check: "auth.uid() = rater_id" },
      { name: "Anyone views task ratings", command: "SELECT", using: "true" },
    ],
    blocked: ["UPDATE", "DELETE"],
    foreignKeys: [{ column: "task_id", references: "micro_tasks.id" }],
  },
  {
    name: "task_submissions",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "task_id", type: "uuid", nullable: false },
      { name: "worker_id", type: "uuid", nullable: false },
      { name: "status", type: "text", nullable: false, default: "'in_progress'" },
      { name: "started_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "submitted_at", type: "timestamptz", nullable: true },
      { name: "reviewed_at", type: "timestamptz", nullable: true },
      { name: "timer_seconds", type: "integer", nullable: false, default: "0" },
      { name: "proof_url", type: "text", nullable: true },
      { name: "proof_text", type: "text", nullable: true },
      { name: "quality_score", type: "smallint", nullable: true },
      { name: "earnings", type: "numeric", nullable: true },
      { name: "reviewer_note", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Worker inserts own submission", command: "INSERT", check: "auth.uid() = worker_id" },
      { name: "Worker views own submissions", command: "SELECT", using: "auth.uid() = worker_id" },
      { name: "Worker updates in_progress submission", command: "UPDATE", using: "auth.uid() = worker_id" },
      { name: "Poster views submissions on own tasks", command: "SELECT", using: "task posted_by = auth.uid()" },
      { name: "Poster reviews submissions on own tasks", command: "UPDATE", using: "task posted_by = auth.uid()" },
    ],
    blocked: ["DELETE"],
    foreignKeys: [{ column: "task_id", references: "micro_tasks.id" }],
  },
  {
    name: "user_roles",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "role", type: "app_role", nullable: false },
    ],
    rlsPolicies: [
      { name: "Users can insert their own roles", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users can view their own roles", command: "SELECT", using: "auth.uid() = user_id" },
    ],
    blocked: ["UPDATE", "DELETE"],
  },
  {
    name: "wallets",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "balance", type: "numeric", nullable: false, default: "0" },
      { name: "escrow_balance", type: "numeric", nullable: false, default: "0" },
      { name: "currency", type: "text", nullable: false, default: "'ZAR'" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Users insert own wallet", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users view own wallet", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Users update own wallet", command: "UPDATE", using: "auth.uid() = user_id" },
    ],
    blocked: ["DELETE"],
  },
  {
    name: "withdrawal_requests",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "amount", type: "numeric", nullable: false },
      { name: "currency", type: "text", nullable: false, default: "'ZAR'" },
      { name: "method", type: "text", nullable: false },
      { name: "status", type: "text", nullable: false, default: "'pending'" },
      { name: "bank_name", type: "text", nullable: true },
      { name: "account_holder", type: "text", nullable: true },
      { name: "account_number", type: "text", nullable: true },
      { name: "mobile_number", type: "text", nullable: true },
      { name: "rejection_reason", type: "text", nullable: true },
      { name: "processed_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    rlsPolicies: [
      { name: "Users insert own withdrawals", command: "INSERT", check: "auth.uid() = user_id" },
      { name: "Users view own withdrawals", command: "SELECT", using: "auth.uid() = user_id" },
      { name: "Users update own withdrawals", command: "UPDATE", using: "auth.uid() = user_id AND status = 'pending'" },
    ],
  },
];

// ─── Enums ────────────────────────────────────────────────────────────────────

const ENUMS = [
  {
    name: "app_role",
    values: ["learner", "sponsor", "provider", "practitioner", "support_provider", "admin", "seta", "government", "fundi", "employer"],
  },
  {
    name: "subscription_plan",
    values: ["starter", "professional", "enterprise"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMMAND_COLORS: Record<string, string> = {
  ALL:    "bg-primary/10 text-primary border-primary/20",
  SELECT: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  INSERT: "bg-green-500/10 text-green-600 border-green-500/20",
  UPDATE: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

const TYPE_COLOR: Record<string, string> = {
  uuid:        "text-violet-600",
  text:        "text-sky-600",
  integer:     "text-orange-500",
  numeric:     "text-orange-500",
  bigint:      "text-orange-500",
  smallint:    "text-orange-500",
  boolean:     "text-emerald-600",
  date:        "text-rose-500",
  timestamptz: "text-rose-500",
  jsonb:       "text-amber-600",
  "text[]":    "text-sky-500",
  app_role:          "text-primary",
  subscription_plan: "text-primary",
};

function typeColor(t: string) {
  return TYPE_COLOR[t] ?? "text-muted-foreground";
}

// ─── Table Card ───────────────────────────────────────────────────────────────

function TableCard({ table }: { table: TableDef }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<"columns" | "rls">("columns");

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/10 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-mono font-semibold text-foreground text-sm">{table.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {table.columns.length} columns · {table.rlsPolicies.length} RLS policies
              {table.foreignKeys?.length ? ` · ${table.foreignKeys.length} FK${table.foreignKeys.length > 1 ? "s" : ""}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {table.blocked?.map(b => (
            <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium hidden sm:inline">
              no {b}
            </span>
          ))}
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-border">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["columns", "rls"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors capitalize ${
                  tab === t
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "rls" ? "RLS Policies" : "Columns"}
              </button>
            ))}
          </div>

          {tab === "columns" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-1/3">Column</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-1/5">Type</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-1/6">Nullable</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {table.columns.map(col => (
                    <tr key={col.name} className="hover:bg-muted/10">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          {col.name === "id" && <Key className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                          {col.name.endsWith("_id") && col.name !== "id" && <Link className="w-3 h-3 text-violet-400 flex-shrink-0" />}
                          <span className="font-mono font-medium text-foreground">{col.name}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-2 font-mono ${typeColor(col.type)}`}>{col.type}</td>
                      <td className="px-4 py-2 text-muted-foreground">{col.nullable ? "yes" : <span className="text-foreground font-medium">no</span>}</td>
                      <td className="px-4 py-2 font-mono text-muted-foreground text-[10px]">{col.default ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Foreign keys */}
              {table.foreignKeys && table.foreignKeys.length > 0 && (
                <div className="px-4 py-3 border-t border-border bg-muted/10">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Link className="w-3 h-3" /> FOREIGN KEYS
                  </p>
                  <div className="space-y-1">
                    {table.foreignKeys.map(fk => (
                      <div key={fk.column} className="flex items-center gap-2 text-[11px]">
                        <span className="font-mono text-violet-600">{fk.column}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-mono text-primary">{fk.references}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {table.rlsPolicies.map(policy => (
                <div key={policy.name} className="rounded-xl border border-border bg-muted/10 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${COMMAND_COLORS[policy.command] ?? "text-muted-foreground"}`}>
                      {policy.command}
                    </Badge>
                    <span className="text-xs font-medium text-foreground">{policy.name}</span>
                  </div>
                  {policy.using && (
                    <p className="text-[10px] font-mono text-muted-foreground bg-muted/30 rounded px-2 py-1">
                      USING: {policy.using}
                    </p>
                  )}
                  {policy.check && (
                    <p className="text-[10px] font-mono text-muted-foreground bg-green-500/5 rounded px-2 py-1">
                      CHECK: {policy.check}
                    </p>
                  )}
                </div>
              ))}
              {table.blocked && table.blocked.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Blocked for all users: <strong>{table.blocked.join(", ")}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Schema() {
  const [search, setSearch] = useState("");

  const filtered = TABLES.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.columns.some(c => c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Database className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Database Schema</h1>
              <p className="text-[11px] text-muted-foreground">{TABLES.length} tables · 2 enums · RLS enabled</p>
            </div>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tables or columns…"
              className="pl-9 text-xs h-9"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Tables",       value: TABLES.length,                                     icon: Database, color: "text-primary bg-primary/10"        },
            { label: "Total Columns",value: TABLES.reduce((a, t) => a + t.columns.length, 0),  icon: Eye,      color: "text-blue-600 bg-blue-500/10"       },
            { label: "RLS Policies", value: TABLES.reduce((a, t) => a + t.rlsPolicies.length, 0), icon: Shield, color: "text-green-600 bg-green-500/10"   },
            { label: "Enums",        value: ENUMS.length,                                       icon: Key,      color: "text-amber-600 bg-amber-500/10"    },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 space-y-1.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Security notice */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5 text-xs">
          <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-foreground">
            Row Level Security (RLS) is <strong>enabled on all tables</strong>. All data access is gated by JWT-based
            auth policies. The <code className="font-mono text-xs bg-muted/50 px-1 rounded">has_role()</code> security-definer function
            prevents privilege escalation by querying <code className="font-mono text-xs bg-muted/50 px-1 rounded">user_roles</code> safely.
          </span>
        </div>

        {/* Tables */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tables {search && `— ${filtered.length} match${filtered.length !== 1 ? "es" : ""}`}
          </h2>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No tables match your search.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(t => <TableCard key={t.name} table={t} />)}
            </div>
          )}
        </div>

        {/* Enums */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Enums</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {ENUMS.map(e => (
              <div key={e.name} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-amber-500" />
                  <p className="font-mono font-semibold text-sm text-foreground">{e.name}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {e.values.map(v => (
                    <span key={v} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted/40 text-foreground border border-border">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-foreground mb-3">Legend</p>
          <div className="grid sm:grid-cols-2 gap-y-2 gap-x-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><Key className="w-3.5 h-3.5 text-amber-500" /> Primary key (id)</div>
            <div className="flex items-center gap-2"><Link className="w-3.5 h-3.5 text-violet-400" /> Foreign key reference</div>
            <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-green-600" /> RLS policy</div>
            <div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-destructive" /> Blocked operation</div>
            <div className="flex items-center gap-2"><span className="font-mono text-violet-600 text-[11px]">uuid</span> UUID identifier</div>
            <div className="flex items-center gap-2"><span className="font-mono text-amber-600 text-[11px]">jsonb</span> JSON column</div>
          </div>
        </div>

      </div>
    </div>
  );
}
