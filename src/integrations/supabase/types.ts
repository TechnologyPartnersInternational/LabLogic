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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          previous_value: Json | null
          reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      methods: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          organization: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization?: string
        }
        Relationships: []
      }
      parameter_configs: {
        Row: {
          allowed_units: string[] | null
          canonical_unit: string
          created_at: string
          decimal_places: number
          id: string
          loq: number
          matrix: Database["public"]["Enums"]["matrix_type"]
          max_value: number | null
          mdl: number
          method_id: string
          min_value: number | null
          parameter_id: string
          report_below_mdl_as: string
          updated_at: string
        }
        Insert: {
          allowed_units?: string[] | null
          canonical_unit: string
          created_at?: string
          decimal_places?: number
          id?: string
          loq: number
          matrix: Database["public"]["Enums"]["matrix_type"]
          max_value?: number | null
          mdl: number
          method_id: string
          min_value?: number | null
          parameter_id: string
          report_below_mdl_as?: string
          updated_at?: string
        }
        Update: {
          allowed_units?: string[] | null
          canonical_unit?: string
          created_at?: string
          decimal_places?: number
          id?: string
          loq?: number
          matrix?: Database["public"]["Enums"]["matrix_type"]
          max_value?: number | null
          mdl?: number
          method_id?: string
          min_value?: number | null
          parameter_id?: string
          report_below_mdl_as?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parameter_configs_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parameter_configs_parameter_id_fkey"
            columns: ["parameter_id"]
            isOneToOne: false
            referencedRelation: "parameters"
            referencedColumns: ["id"]
          },
        ]
      }
      parameters: {
        Row: {
          abbreviation: string
          analyte_group: string
          cas_number: string | null
          created_at: string
          id: string
          lab_section: Database["public"]["Enums"]["lab_section"]
          name: string
          result_type: Database["public"]["Enums"]["result_type"]
        }
        Insert: {
          abbreviation: string
          analyte_group: string
          cas_number?: string | null
          created_at?: string
          id?: string
          lab_section: Database["public"]["Enums"]["lab_section"]
          name: string
          result_type?: Database["public"]["Enums"]["result_type"]
        }
        Update: {
          abbreviation?: string
          analyte_group?: string
          cas_number?: string | null
          created_at?: string
          id?: string
          lab_section?: Database["public"]["Enums"]["lab_section"]
          name?: string
          result_type?: Database["public"]["Enums"]["result_type"]
        }
        Relationships: []
      }
      pending_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          roles: Json
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          roles?: Json
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          roles?: Json
          token?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          analysis_end_date: string | null
          analysis_start_date: string | null
          client_id: string
          code: string
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          notes: string | null
          receipt_discrepancies: string | null
          received_by: string | null
          regulatory_program: string | null
          relinquished_by: string | null
          results_issued_date: string | null
          sample_collection_date: string | null
          sample_receipt_date: string | null
          sampler_company: string | null
          sampler_name: string | null
          special_instructions: string | null
          status: string
          tat: string | null
          title: string
          updated_at: string
        }
        Insert: {
          analysis_end_date?: string | null
          analysis_start_date?: string | null
          client_id: string
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          receipt_discrepancies?: string | null
          received_by?: string | null
          regulatory_program?: string | null
          relinquished_by?: string | null
          results_issued_date?: string | null
          sample_collection_date?: string | null
          sample_receipt_date?: string | null
          sampler_company?: string | null
          sampler_name?: string | null
          special_instructions?: string | null
          status?: string
          tat?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          analysis_end_date?: string | null
          analysis_start_date?: string | null
          client_id?: string
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          receipt_discrepancies?: string | null
          received_by?: string | null
          regulatory_program?: string | null
          relinquished_by?: string | null
          results_issued_date?: string | null
          sample_collection_date?: string | null
          sample_receipt_date?: string | null
          sampler_company?: string | null
          sampler_name?: string | null
          special_instructions?: string | null
          status?: string
          tat?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          analysis_date: string | null
          analyst_notes: string | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          batch_id: string | null
          canonical_unit: string | null
          canonical_value: number | null
          created_at: string
          entered_at: string | null
          entered_by: string | null
          entered_unit: string | null
          entered_value: string | null
          id: string
          instrument_id: string | null
          is_below_mdl: boolean | null
          parameter_config_id: string
          previous_value: string | null
          qualifier: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          revision_number: number | null
          revision_reason: string | null
          sample_id: string
          status: Database["public"]["Enums"]["result_status"]
          updated_at: string
        }
        Insert: {
          analysis_date?: string | null
          analyst_notes?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          canonical_unit?: string | null
          canonical_value?: number | null
          created_at?: string
          entered_at?: string | null
          entered_by?: string | null
          entered_unit?: string | null
          entered_value?: string | null
          id?: string
          instrument_id?: string | null
          is_below_mdl?: boolean | null
          parameter_config_id: string
          previous_value?: string | null
          qualifier?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number?: number | null
          revision_reason?: string | null
          sample_id: string
          status?: Database["public"]["Enums"]["result_status"]
          updated_at?: string
        }
        Update: {
          analysis_date?: string | null
          analyst_notes?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          canonical_unit?: string | null
          canonical_value?: number | null
          created_at?: string
          entered_at?: string | null
          entered_by?: string | null
          entered_unit?: string | null
          entered_value?: string | null
          id?: string
          instrument_id?: string | null
          is_below_mdl?: boolean | null
          parameter_config_id?: string
          previous_value?: string | null
          qualifier?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number?: number | null
          revision_reason?: string | null
          sample_id?: string
          status?: Database["public"]["Enums"]["result_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_parameter_config_id_fkey"
            columns: ["parameter_config_id"]
            isOneToOne: false
            referencedRelation: "parameter_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
        ]
      }
      samples: {
        Row: {
          collection_date: string
          collection_time: string | null
          container_count: number | null
          container_type: string[] | null
          created_at: string
          created_by: string | null
          depth: string | null
          field_id: string | null
          id: string
          location: string | null
          matrix: Database["public"]["Enums"]["matrix_type"]
          preservation_type: string | null
          project_id: string
          sample_condition: string | null
          sample_id: string
          sample_type: string
          status: Database["public"]["Enums"]["sample_status"]
          updated_at: string
        }
        Insert: {
          collection_date: string
          collection_time?: string | null
          container_count?: number | null
          container_type?: string[] | null
          created_at?: string
          created_by?: string | null
          depth?: string | null
          field_id?: string | null
          id?: string
          location?: string | null
          matrix: Database["public"]["Enums"]["matrix_type"]
          preservation_type?: string | null
          project_id: string
          sample_condition?: string | null
          sample_id: string
          sample_type?: string
          status?: Database["public"]["Enums"]["sample_status"]
          updated_at?: string
        }
        Update: {
          collection_date?: string
          collection_time?: string | null
          container_count?: number | null
          container_type?: string[] | null
          created_at?: string
          created_by?: string | null
          depth?: string | null
          field_id?: string | null
          id?: string
          location?: string | null
          matrix?: Database["public"]["Enums"]["matrix_type"]
          preservation_type?: string | null
          project_id?: string
          sample_condition?: string | null
          sample_id?: string
          sample_type?: string
          status?: Database["public"]["Enums"]["sample_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "samples_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_package_parameters: {
        Row: {
          id: string
          parameter_id: string
          test_package_id: string
        }
        Insert: {
          id?: string
          parameter_id: string
          test_package_id: string
        }
        Update: {
          id?: string
          parameter_id?: string
          test_package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_package_parameters_parameter_id_fkey"
            columns: ["parameter_id"]
            isOneToOne: false
            referencedRelation: "parameters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_package_parameters_test_package_id_fkey"
            columns: ["test_package_id"]
            isOneToOne: false
            referencedRelation: "test_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      test_packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lab_section: Database["public"]["Enums"]["lab_section"]
          matrices: Database["public"]["Enums"]["matrix_type"][]
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lab_section: Database["public"]["Enums"]["lab_section"]
          matrices: Database["public"]["Enums"]["matrix_type"][]
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lab_section?: Database["public"]["Enums"]["lab_section"]
          matrices?: Database["public"]["Enums"]["matrix_type"][]
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          lab_section: Database["public"]["Enums"]["lab_section"] | null
          role: Database["public"]["Enums"]["lab_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          lab_section?: Database["public"]["Enums"]["lab_section"] | null
          role: Database["public"]["Enums"]["lab_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          lab_section?: Database["public"]["Enums"]["lab_section"] | null
          role?: Database["public"]["Enums"]["lab_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_errors: {
        Row: {
          created_at: string
          error_code: string
          field: string | null
          id: string
          message: string
          override_reason: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          result_id: string
          severity: string
        }
        Insert: {
          created_at?: string
          error_code: string
          field?: string | null
          id?: string
          message: string
          override_reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          result_id: string
          severity: string
        }
        Update: {
          created_at?: string
          error_code?: string
          field?: string | null
          id?: string
          message?: string
          override_reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          result_id?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_errors_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_errors_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "results"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_lab_sections: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["lab_section"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["lab_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_analyst_for_section: {
        Args: {
          _section: Database["public"]["Enums"]["lab_section"]
          _user_id: string
        }
        Returns: boolean
      }
      is_lab_supervisor: { Args: { _user_id: string }; Returns: boolean }
      is_qa_officer: { Args: { _user_id: string }; Returns: boolean }
      is_result_editable: { Args: { _result_id: string }; Returns: boolean }
    }
    Enums: {
      lab_role:
        | "wet_chemistry_analyst"
        | "instrumentation_analyst"
        | "microbiology_analyst"
        | "lab_supervisor"
        | "qa_officer"
        | "admin"
      lab_section: "wet_chemistry" | "instrumentation" | "microbiology"
      matrix_type:
        | "water"
        | "wastewater"
        | "sediment"
        | "soil"
        | "air"
        | "sludge"
      result_status:
        | "draft"
        | "pending_review"
        | "reviewed"
        | "approved"
        | "rejected"
        | "revision_required"
      result_type: "numeric" | "presence_absence" | "mpn" | "cfu" | "text"
      sample_status: "received" | "in_progress" | "completed" | "released"
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
      lab_role: [
        "wet_chemistry_analyst",
        "instrumentation_analyst",
        "microbiology_analyst",
        "lab_supervisor",
        "qa_officer",
        "admin",
      ],
      lab_section: ["wet_chemistry", "instrumentation", "microbiology"],
      matrix_type: ["water", "wastewater", "sediment", "soil", "air", "sludge"],
      result_status: [
        "draft",
        "pending_review",
        "reviewed",
        "approved",
        "rejected",
        "revision_required",
      ],
      result_type: ["numeric", "presence_absence", "mpn", "cfu", "text"],
      sample_status: ["received", "in_progress", "completed", "released"],
    },
  },
} as const
