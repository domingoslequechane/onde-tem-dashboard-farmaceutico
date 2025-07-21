export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_interactions: {
        Row: {
          ai_response: string
          client_id: string
          confidence_score: number | null
          consultation_id: string | null
          created_at: string
          id: string
          interaction_type: string
          ip_address: unknown | null
          session_id: string | null
          user_agent: string | null
          user_input: string
        }
        Insert: {
          ai_response: string
          client_id: string
          confidence_score?: number | null
          consultation_id?: string | null
          created_at?: string
          id?: string
          interaction_type: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_input: string
        }
        Update: {
          ai_response?: string
          client_id?: string
          confidence_score?: number | null
          consultation_id?: string | null
          created_at?: string
          id?: string
          interaction_type?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_input?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          allergies: string[] | null
          birth_date: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: string | null
          id: string
          is_anonymous: boolean
          medical_conditions: string[] | null
          phone: string | null
          profile_id: string | null
          region_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_anonymous?: boolean
          medical_conditions?: string[] | null
          phone?: string | null
          profile_id?: string | null
          region_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_anonymous?: boolean
          medical_conditions?: string[] | null
          phone?: string | null
          profile_id?: string | null
          region_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          ai_recommendation: string | null
          client_id: string
          consultation_type: string
          created_at: string
          feedback_comment: string | null
          feedback_rating: number | null
          id: string
          recommended_medicines: string[] | null
          status: string
          symptoms: string
          updated_at: string
          urgency_level: string
        }
        Insert: {
          ai_recommendation?: string | null
          client_id: string
          consultation_type?: string
          created_at?: string
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          recommended_medicines?: string[] | null
          status?: string
          symptoms: string
          updated_at?: string
          urgency_level: string
        }
        Update: {
          ai_recommendation?: string | null
          client_id?: string
          consultation_type?: string
          created_at?: string
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          recommended_medicines?: string[] | null
          status?: string
          symptoms?: string
          updated_at?: string
          urgency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_stocks: {
        Row: {
          batch_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          is_available: boolean
          medicine_id: string
          minimum_stock: number | null
          pharmacy_id: string
          price: number
          quantity: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_available?: boolean
          medicine_id: string
          minimum_stock?: number | null
          pharmacy_id: string
          price: number
          quantity?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_available?: boolean
          medicine_id?: string
          minimum_stock?: number | null
          pharmacy_id?: string
          price?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_stocks_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_stocks_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          active_ingredient: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          manufacturer: string | null
          name: string
          requires_prescription: boolean
          updated_at: string
        }
        Insert: {
          active_ingredient?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          manufacturer?: string | null
          name: string
          requires_prescription?: boolean
          updated_at?: string
        }
        Update: {
          active_ingredient?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          manufacturer?: string | null
          name?: string
          requires_prescription?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      pharmacies: {
        Row: {
          address: string
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          region_id: string
          updated_at: string
        }
        Insert: {
          address: string
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          region_id: string
          updated_at?: string
        }
        Update: {
          address?: string
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacies_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          country: string
          created_at: string
          id: string
          name: string
          state: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          name: string
          state: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          name?: string
          state?: string
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_resolved: boolean
          medicine_id: string
          pharmacy_id: string
          resolved_at: string | null
          threshold_value: number | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          medicine_id: string
          pharmacy_id: string
          resolved_at?: string | null
          threshold_value?: number | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          medicine_id?: string
          pharmacy_id?: string
          resolved_at?: string | null
          threshold_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
