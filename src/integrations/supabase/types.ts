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
      academic_credentials: {
        Row: {
          completion_year: number | null
          created_at: string
          document_url: string | null
          field_of_study: string | null
          id: string
          institution: string
          qualification_type: string
          shareable: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_year?: number | null
          created_at?: string
          document_url?: string | null
          field_of_study?: string | null
          id?: string
          institution: string
          qualification_type: string
          shareable?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_year?: number | null
          created_at?: string
          document_url?: string | null
          field_of_study?: string | null
          id?: string
          institution?: string
          qualification_type?: string
          shareable?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      access_logs: {
        Row: {
          access_token: string
          action: string
          created_at: string
          id: string
          metadata: Json
          viewer_id: string | null
        }
        Insert: {
          access_token: string
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          viewer_id?: string | null
        }
        Update: {
          access_token?: string
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          viewer_id?: string | null
        }
        Relationships: []
      }
      accreditation_qualifications: {
        Row: {
          accreditation_id: string
          created_at: string
          credits: number | null
          id: string
          nqf_level: string | null
          saqa_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          accreditation_id: string
          created_at?: string
          credits?: number | null
          id?: string
          nqf_level?: string | null
          saqa_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          accreditation_id?: string
          created_at?: string
          credits?: number | null
          id?: string
          nqf_level?: string | null
          saqa_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accreditation_qualifications_accreditation_id_fkey"
            columns: ["accreditation_id"]
            isOneToOne: false
            referencedRelation: "practitioner_accreditations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          actor_role: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string
          entity_label: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id: string
          actor_role: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id: string
          entity_label?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string
          actor_role?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string
          entity_label?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      cms_menu_items: {
        Row: {
          created_at: string
          icon_name: string | null
          id: string
          is_active: boolean
          item_type: string
          label: string
          menu_id: string
          open_in_new_tab: boolean
          parent_id: string | null
          sort_order: number
          target_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          item_type?: string
          label: string
          menu_id: string
          open_in_new_tab?: boolean
          parent_id?: string | null
          sort_order?: number
          target_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          item_type?: string
          label?: string
          menu_id?: string
          open_in_new_tab?: boolean
          parent_id?: string | null
          sort_order?: number
          target_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "cms_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_menus: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cms_page_blocks: {
        Row: {
          block_type: string
          config: Json
          content: string | null
          created_at: string
          id: string
          is_active: boolean
          page_id: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          block_type?: string
          config?: Json
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          page_id: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: string
          config?: Json
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          page_id?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_page_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_homepage: boolean
          is_published: boolean
          meta_desc: string | null
          meta_title: string | null
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_homepage?: boolean
          is_published?: boolean
          meta_desc?: string | null
          meta_title?: string | null
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_homepage?: boolean
          is_published?: boolean
          meta_desc?: string | null
          meta_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cms_role_menu_permissions: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          menu_id: string | null
          menu_item_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          menu_id?: string | null
          menu_item_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          menu_id?: string | null
          menu_item_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_role_menu_permissions_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "cms_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_role_menu_permissions_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "cms_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      company_participants: {
        Row: {
          agreement_document_url: string | null
          bbbee_points_allocated: number | null
          company_name: string
          cost_share_percentage: number | null
          created_at: string
          id: string
          notes: string | null
          opportunity_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agreement_document_url?: string | null
          bbbee_points_allocated?: number | null
          company_name: string
          cost_share_percentage?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opportunity_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agreement_document_url?: string | null
          bbbee_points_allocated?: number | null
          company_name?: string
          cost_share_percentage?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opportunity_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_participants_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      document_vault: {
        Row: {
          created_at: string
          doc_type: string
          expires_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          label: string
          mime_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          expires_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          label: string
          mime_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          expires_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          label?: string
          mime_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      eoi_submissions: {
        Row: {
          accreditations: Json
          created_at: string
          funding_opp_id: string
          id: string
          message: string | null
          proposed_start: string | null
          provider_id: string
          reviewed_at: string | null
          reviewer_note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accreditations?: Json
          created_at?: string
          funding_opp_id: string
          id?: string
          message?: string | null
          proposed_start?: string | null
          provider_id: string
          reviewed_at?: string | null
          reviewer_note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accreditations?: Json
          created_at?: string
          funding_opp_id?: string
          id?: string
          message?: string | null
          proposed_start?: string | null
          provider_id?: string
          reviewed_at?: string | null
          reviewer_note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eoi_submissions_funding_opp_id_fkey"
            columns: ["funding_opp_id"]
            isOneToOne: false
            referencedRelation: "funding_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_opportunities: {
        Row: {
          application_deadline: string | null
          awarded_to: string | null
          budget_per_learner: number | null
          created_at: string
          currency: string
          description: string | null
          duration: string | null
          id: string
          nqf_level: string | null
          programme_type: string
          province: string | null
          requirements: Json
          seats_available: number
          sector: string | null
          sponsor_id: string
          start_date: string | null
          status: string
          title: string
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          awarded_to?: string | null
          budget_per_learner?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          duration?: string | null
          id?: string
          nqf_level?: string | null
          programme_type?: string
          province?: string | null
          requirements?: Json
          seats_available?: number
          sector?: string | null
          sponsor_id: string
          start_date?: string | null
          status?: string
          title: string
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          awarded_to?: string | null
          budget_per_learner?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          duration?: string | null
          id?: string
          nqf_level?: string | null
          programme_type?: string
          province?: string | null
          requirements?: Json
          seats_available?: number
          sector?: string | null
          sponsor_id?: string
          start_date?: string | null
          status?: string
          title?: string
          total_budget?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      learner_programmes: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          modules_completed: number
          nqf_level: number
          progress_pct: number
          provider: string
          status: string
          title: string
          total_modules: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          modules_completed?: number
          nqf_level?: number
          progress_pct?: number
          provider: string
          status?: string
          title: string
          total_modules?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          modules_completed?: number
          nqf_level?: number
          progress_pct?: number
          provider?: string
          status?: string
          title?: string
          total_modules?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
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
          regulatory_body_id: string | null
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
          regulatory_body_id?: string | null
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
          regulatory_body_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "opportunities_regulatory_body_id_fkey"
            columns: ["regulatory_body_id"]
            isOneToOne: false
            referencedRelation: "regulatory_bodies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          gateway: string
          gateway_ref: string | null
          id: string
          metadata: Json | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          gateway: string
          gateway_ref?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          gateway?: string
          gateway_ref?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practitioner_accreditations: {
        Row: {
          created_at: string
          document_url: string | null
          id: string
          id_number: string | null
          raw_extracted: Json | null
          registration_number: string | null
          role_type: string
          seta_body: string
          shareable: boolean
          status: string
          updated_at: string
          user_id: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          id?: string
          id_number?: string | null
          raw_extracted?: Json | null
          registration_number?: string | null
          role_type: string
          seta_body: string
          shareable?: boolean
          status?: string
          updated_at?: string
          user_id: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          id?: string
          id_number?: string | null
          raw_extracted?: Json | null
          registration_number?: string | null
          role_type?: string
          seta_body?: string
          shareable?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      practitioner_contracts: {
        Row: {
          client_name: string
          created_at: string
          currency: string
          daily_rate: number
          end_date: string | null
          id: string
          notes: string | null
          practitioner_id: string
          practitioner_type: string
          programme: string
          start_date: string | null
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          currency?: string
          daily_rate?: number
          end_date?: string | null
          id?: string
          notes?: string | null
          practitioner_id: string
          practitioner_type?: string
          programme: string
          start_date?: string | null
          status?: string
          total_days?: number
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          currency?: string
          daily_rate?: number
          end_date?: string | null
          id?: string
          notes?: string | null
          practitioner_id?: string
          practitioner_type?: string
          programme?: string
          start_date?: string | null
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      practitioner_listing_accreds: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          reg_number: string | null
          role_type: string
          seta_body: string
          status: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          reg_number?: string | null
          role_type: string
          seta_body: string
          status?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          reg_number?: string | null
          role_type?: string
          seta_body?: string
          status?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_listing_accreds_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "practitioner_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_listings: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_featured: boolean
          is_verified: boolean
          job_title: string | null
          languages: string[] | null
          last_name: string
          linkedin_url: string | null
          location: string | null
          nqf_level: string | null
          phone: string | null
          province: string | null
          skills: string[] | null
          status: string
          updated_at: string
          user_id: string | null
          years_exp: number | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_featured?: boolean
          is_verified?: boolean
          job_title?: string | null
          languages?: string[] | null
          last_name: string
          linkedin_url?: string | null
          location?: string | null
          nqf_level?: string | null
          phone?: string | null
          province?: string | null
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string | null
          years_exp?: number | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_featured?: boolean
          is_verified?: boolean
          job_title?: string | null
          languages?: string[] | null
          last_name?: string
          linkedin_url?: string | null
          location?: string | null
          nqf_level?: string | null
          phone?: string | null
          province?: string | null
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string | null
          years_exp?: number | null
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
          sharing_settings: Json
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
          sharing_settings?: Json
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
          sharing_settings?: Json
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
      regulatory_bodies: {
        Row: {
          acronym: string
          body_type: string
          created_at: string
          doc_rules: Json
          full_name: string
          id: string
          is_active: boolean
          is_levy_funded: boolean
          notes: string | null
          reporting_formats: Json
          sector: string | null
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          acronym: string
          body_type: string
          created_at?: string
          doc_rules?: Json
          full_name: string
          id?: string
          is_active?: boolean
          is_levy_funded?: boolean
          notes?: string | null
          reporting_formats?: Json
          sector?: string | null
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          acronym?: string
          body_type?: string
          created_at?: string
          doc_rules?: Json
          full_name?: string
          id?: string
          is_active?: boolean
          is_levy_funded?: boolean
          notes?: string | null
          reporting_formats?: Json
          sector?: string | null
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          data_snapshot: Json
          financial_year: string
          generated_at: string
          id: string
          output_url: string | null
          regulatory_body_id: string | null
          report_type: string
          status: string
          submission_notes: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_snapshot?: Json
          financial_year: string
          generated_at?: string
          id?: string
          output_url?: string | null
          regulatory_body_id?: string | null
          report_type: string
          status?: string
          submission_notes?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_snapshot?: Json
          financial_year?: string
          generated_at?: string
          id?: string
          output_url?: string | null
          regulatory_body_id?: string | null
          report_type?: string
          status?: string
          submission_notes?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_regulatory_body_id_fkey"
            columns: ["regulatory_body_id"]
            isOneToOne: false
            referencedRelation: "regulatory_bodies"
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
      shared_access: {
        Row: {
          access_token: string
          created_at: string
          document_urls: Json
          expiry: string
          id: string
          request_id: string
          watermark: boolean
        }
        Insert: {
          access_token?: string
          created_at?: string
          document_urls?: Json
          expiry: string
          id?: string
          request_id: string
          watermark?: boolean
        }
        Update: {
          access_token?: string
          created_at?: string
          document_urls?: Json
          expiry?: string
          id?: string
          request_id?: string
          watermark?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "shared_access_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sharing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sharing_requests: {
        Row: {
          access_expiry: string | null
          approved_at: string | null
          created_at: string
          id: string
          message: string
          practitioner_id: string
          requested_types: Json
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          access_expiry?: string | null
          approved_at?: string | null
          created_at?: string
          id?: string
          message: string
          practitioner_id: string
          requested_types?: Json
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          access_expiry?: string | null
          approved_at?: string | null
          created_at?: string
          id?: string
          message?: string
          practitioner_id?: string
          requested_types?: Json
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsor_profiles: {
        Row: {
          annual_budget: string | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          linkedin_url: string | null
          logo_url: string | null
          programme_types: string[] | null
          provinces: string[] | null
          sectors: string[] | null
          tagline: string | null
          updated_at: string
          user_id: string
          verified: boolean
          website_url: string | null
        }
        Insert: {
          annual_budget?: string | null
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          linkedin_url?: string | null
          logo_url?: string | null
          programme_types?: string[] | null
          provinces?: string[] | null
          sectors?: string[] | null
          tagline?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          annual_budget?: string | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          linkedin_url?: string | null
          logo_url?: string | null
          programme_types?: string[] | null
          provinces?: string[] | null
          sectors?: string[] | null
          tagline?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
          website_url?: string | null
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
      vendor_credentials: {
        Row: {
          certification_name: string
          created_at: string
          credential_id: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          shareable: boolean
          updated_at: string
          user_id: string
          vendor: string
        }
        Insert: {
          certification_name: string
          created_at?: string
          credential_id?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          shareable?: boolean
          updated_at?: string
          user_id: string
          vendor: string
        }
        Update: {
          certification_name?: string
          created_at?: string
          credential_id?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          shareable?: boolean
          updated_at?: string
          user_id?: string
          vendor?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          escrow_balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          escrow_balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          escrow_balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_holder: string | null
          account_number: string | null
          amount: number
          bank_name: string | null
          created_at: string
          currency: string
          id: string
          method: string
          mobile_number: string | null
          processed_at: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          method: string
          mobile_number?: string | null
          processed_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: string
          mobile_number?: string | null
          processed_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
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
