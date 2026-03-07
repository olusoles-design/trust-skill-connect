export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_id: string
          cover_note: string | null
          created_at: string
          id: string
          opportunity_id: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          cover_note?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          cover_note?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          created_at: string
          explanation: string | null
          factors: Json | null
          id: string
          opportunity_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          factors?: Json | null
          id?: string
          opportunity_id: string
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          factors?: Json | null
          id?: string
          opportunity_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_results_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_tasks: {
        Row: {
          accepted_by: string | null
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          employer: string | null
          escrow_held: number | null
          id: string
          location: string
          max_workers: number
          pay: string | null
          posted_by: string
          skills: string[] | null
          status: string
          title: string
          updated_at: string
          urgency: string
        }
        Insert: {
          accepted_by?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          employer?: string | null
          escrow_held?: number | null
          id?: string
          location?: string
          max_workers?: number
          pay?: string | null
          posted_by: string
          skills?: string[] | null
          status?: string
          title: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          accepted_by?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          employer?: string | null
          escrow_held?: number | null
          id?: string
          location?: string
          max_workers?: number
          pay?: string | null
          posted_by?: string
          skills?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          applications: number
          bbee_points: boolean | null
          category: string | null
          closing_date: string | null
          created_at: string
          demographics_target: Json | null
          description: string | null
          duration: string | null
          featured: boolean | null
          id: string
          languages_required: string[] | null
          location: string | null
          nqf_level_required: string | null
          organisation: string | null
          posted_by: string
          seta: string | null
          status: string
          stipend: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          verified: boolean | null
          views: number
        }
        Insert: {
          applications?: number
          bbee_points?: boolean | null
          category?: string | null
          closing_date?: string | null
          created_at?: string
          demographics_target?: Json | null
          description?: string | null
          duration?: string | null
          featured?: boolean | null
          id?: string
          languages_required?: string[] | null
          location?: string | null
          nqf_level_required?: string | null
          organisation?: string | null
          posted_by: string
          seta?: string | null
          status?: string
          stipend?: string | null
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          verified?: boolean | null
          views?: number
        }
        Update: {
          applications?: number
          bbee_points?: boolean | null
          category?: string | null
          closing_date?: string | null
          created_at?: string
          demographics_target?: Json | null
          description?: string | null
          duration?: string | null
          featured?: boolean | null
          id?: string
          languages_required?: string[] | null
          location?: string | null
          nqf_level_required?: string | null
          organisation?: string | null
          posted_by?: string
          seta?: string | null
          status?: string
          stipend?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          verified?: boolean | null
          views?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          demographics: Json | null
          first_name: string | null
          id: string
          id_number: string | null
          job_title: string | null
          languages: string[] | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          nqf_level: string | null
          phone: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          demographics?: Json | null
          first_name?: string | null
          id?: string
          id_number?: string | null
          job_title?: string | null
          languages?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          nqf_level?: string | null
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          demographics?: Json | null
          first_name?: string | null
          id?: string
          id_number?: string | null
          job_title?: string | null
          languages?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          nqf_level?: string | null
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      provider_listings: {
        Row: {
          category: string
          certifications: string[] | null
          created_at: string
          currency: string
          description: string | null
          id: string
          location: string | null
          portfolio_urls: string[] | null
          price_from: number | null
          price_to: number | null
          pricing_model: string
          rating_avg: number
          review_count: number
          services: string[] | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          certifications?: string[] | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          location?: string | null
          portfolio_urls?: string[] | null
          price_from?: number | null
          price_to?: number | null
          pricing_model?: string
          rating_avg?: number
          review_count?: number
          services?: string[] | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          certifications?: string[] | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          location?: string | null
          portfolio_urls?: string[] | null
          price_from?: number | null
          price_to?: number | null
          pricing_model?: string
          rating_avg?: number
          review_count?: number
          services?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "provider_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_responses: {
        Row: {
          created_at: string
          currency: string
          id: string
          listing_id: string | null
          proposal: string | null
          provider_id: string
          quote_amount: number | null
          rfq_id: string
          status: string
          timeline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          listing_id?: string | null
          proposal?: string | null
          provider_id: string
          quote_amount?: number | null
          rfq_id: string
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          listing_id?: string | null
          proposal?: string | null
          provider_id?: string
          quote_amount?: number | null
          rfq_id?: string
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_responses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "provider_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          budget_from: number | null
          budget_to: number | null
          buyer_id: string
          category: string | null
          created_at: string
          currency: string
          deadline: string | null
          description: string | null
          id: string
          requirements: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_from?: number | null
          budget_to?: number | null
          buyer_id: string
          category?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          description?: string | null
          id?: string
          requirements?: Json | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_from?: number | null
          budget_to?: number | null
          buyer_id?: string
          category?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          description?: string | null
          id?: string
          requirements?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          ratee_id: string
          rater_id: string
          rating: number
          role: string
          task_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          ratee_id: string
          rater_id: string
          rating: number
          role: string
          task_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          ratee_id?: string
          rater_id?: string
          rating?: number
          role?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_ratings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "micro_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          created_at: string
          earnings: number | null
          id: string
          proof_text: string | null
          proof_url: string | null
          quality_score: number | null
          reviewed_at: string | null
          reviewer_note: string | null
          started_at: string
          status: string
          submitted_at: string | null
          task_id: string
          timer_seconds: number
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          earnings?: number | null
          id?: string
          proof_text?: string | null
          proof_url?: string | null
          quality_score?: number | null
          reviewed_at?: string | null
          reviewer_note?: string | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          task_id: string
          timer_seconds?: number
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          earnings?: number | null
          id?: string
          proof_text?: string | null
          proof_url?: string | null
          quality_score?: number | null
          reviewed_at?: string | null
          reviewer_note?: string | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          task_id?: string
          timer_seconds?: number
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "micro_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "learner"
        | "sponsor"
        | "provider"
        | "practitioner"
        | "support_provider"
        | "admin"
        | "seta"
        | "government"
        | "fundi"
        | "employer"
      subscription_plan: "starter" | "professional" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "learner",
        "sponsor",
        "provider",
        "practitioner",
        "support_provider",
        "admin",
        "seta",
        "government",
        "fundi",
        "employer",
      ],
      subscription_plan: ["starter", "professional", "enterprise"],
    },
  },
} as const
