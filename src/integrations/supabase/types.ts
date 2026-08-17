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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          betting_enabled: boolean | null
          football_data_mode: string | null
          global_margin_percentage: number | null
          id: string
          max_payout: number | null
          max_stake: number | null
          max_ticket_selections: number | null
          min_stake: number | null
          updated_at: string | null
        }
        Insert: {
          betting_enabled?: boolean | null
          football_data_mode?: string | null
          global_margin_percentage?: number | null
          id?: string
          max_payout?: number | null
          max_stake?: number | null
          max_ticket_selections?: number | null
          min_stake?: number | null
          updated_at?: string | null
        }
        Update: {
          betting_enabled?: boolean | null
          football_data_mode?: string | null
          global_margin_percentage?: number | null
          id?: string
          max_payout?: number | null
          max_stake?: number | null
          max_ticket_selections?: number | null
          min_stake?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      betting_ticket_items: {
        Row: {
          created_at: string | null
          fixture_id: string
          id: string
          market_name: string
          odd: number
          selection_name: string
          status: Database["public"]["Enums"]["selection_status"] | null
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          fixture_id: string
          id?: string
          market_name: string
          odd: number
          selection_name: string
          status?: Database["public"]["Enums"]["selection_status"] | null
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          fixture_id?: string
          id?: string
          market_name?: string
          odd?: number
          selection_name?: string
          status?: Database["public"]["Enums"]["selection_status"] | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "betting_ticket_items_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betting_ticket_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "betting_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      betting_tickets: {
        Row: {
          created_at: string | null
          id: string
          idempotency_key: string | null
          potential_return: number
          stake: number
          status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_code: string
          total_odd: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          potential_return: number
          stake: number
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_code: string
          total_odd: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          potential_return?: number
          stake?: number
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_code?: string
          total_odd?: number
          user_id?: string
        }
        Relationships: []
      }
      competitions: {
        Row: {
          country: string | null
          country_code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_simulated: boolean | null
          last_provider_update: string | null
          logo_url: string | null
          name: string
          provider_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_simulated?: boolean | null
          last_provider_update?: string | null
          logo_url?: string | null
          name: string
          provider_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_simulated?: boolean | null
          last_provider_update?: string | null
          logo_url?: string | null
          name?: string
          provider_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fixtures: {
        Row: {
          away_score: number | null
          away_team_id: string
          competition_id: string
          created_at: string | null
          home_score: number | null
          home_team_id: string
          id: string
          is_simulated: boolean | null
          last_provider_update: string | null
          last_sync: string | null
          provider_id: string | null
          round: string | null
          start_time: string
          status: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          competition_id: string
          created_at?: string | null
          home_score?: number | null
          home_team_id: string
          id?: string
          is_simulated?: boolean | null
          last_provider_update?: string | null
          last_sync?: string | null
          provider_id?: string | null
          round?: string | null
          start_time: string
          status?: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          competition_id?: string
          created_at?: string | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          is_simulated?: boolean | null
          last_provider_update?: string | null
          last_sync?: string | null
          provider_id?: string | null
          round?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      market_options: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          market_id: string
          name: string
          odd: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          market_id: string
          name: string
          odd: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          market_id?: string
          name?: string
          odd?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_options_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          category: string | null
          created_at: string | null
          fixture_id: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          fixture_id: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          fixture_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "markets_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_mappings: {
        Row: {
          created_at: string | null
          entity_type: string
          id: string
          internal_id: string
          provider: string
          provider_entity_id: string
        }
        Insert: {
          created_at?: string | null
          entity_type: string
          id?: string
          internal_id: string
          provider: string
          provider_entity_id: string
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          id?: string
          internal_id?: string
          provider?: string
          provider_entity_id?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          competition_id: string
          created_at: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          start_date: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          start_date?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          start_date?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          error_message: string | null
          errors_count: number | null
          finished_at: string | null
          id: string
          provider: string
          records_created: number | null
          records_received: number | null
          records_updated: number | null
          started_at: string | null
          status: string
          sync_type: string
        }
        Insert: {
          error_message?: string | null
          errors_count?: number | null
          finished_at?: string | null
          id?: string
          provider: string
          records_created?: number | null
          records_received?: number | null
          records_updated?: number | null
          started_at?: string | null
          status: string
          sync_type: string
        }
        Update: {
          error_message?: string | null
          errors_count?: number | null
          finished_at?: string | null
          id?: string
          provider?: string
          records_created?: number | null
          records_received?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          is_simulated: boolean | null
          logo_url: string | null
          name: string
          provider_id: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          is_simulated?: boolean | null
          logo_url?: string | null
          name: string
          provider_id?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          is_simulated?: boolean | null
          logo_url?: string | null
          name?: string
          provider_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          currency: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_deposit: { Args: { p_deposit_id: string }; Returns: boolean }
      approve_withdrawal: {
        Args: { p_withdrawal_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_bet: {
        Args: {
          p_idempotency_key: string
          p_selections: Json
          p_stake: number
          p_user_id: string
        }
        Returns: string
      }
      reject_withdrawal: { Args: { p_withdrawal_id: string }; Returns: boolean }
      request_withdrawal: {
        Args: { p_amount: number; p_user_id: string }
        Returns: string
      }
      settle_fixture: {
        Args: {
          p_away_score: number
          p_cards?: number
          p_corners?: number
          p_fixture_id: string
          p_home_score: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      selection_status: "pending" | "won" | "lost" | "void"
      ticket_status: "PENDING" | "WON" | "LOST" | "VOID" | "CANCELLED"
      transaction_type:
        | "deposit"
        | "bet"
        | "win"
        | "withdrawal"
        | "refund"
        | "adjustment"
        | "chargeback"
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
      app_role: ["admin", "user"],
      selection_status: ["pending", "won", "lost", "void"],
      ticket_status: ["PENDING", "WON", "LOST", "VOID", "CANCELLED"],
      transaction_type: [
        "deposit",
        "bet",
        "win",
        "withdrawal",
        "refund",
        "adjustment",
        "chargeback",
      ],
    },
  },
} as const
