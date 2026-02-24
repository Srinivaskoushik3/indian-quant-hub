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
      dashboard_preferences: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          ux_mode: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          ux_mode?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          ux_mode?: string
        }
        Relationships: []
      }
      dividend_records: {
        Row: {
          created_at: string
          dividend_amount: number
          dividend_yield: number | null
          ex_date: string | null
          id: string
          payment_date: string | null
          stock_symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dividend_amount?: number
          dividend_yield?: number | null
          ex_date?: string | null
          id?: string
          payment_date?: string | null
          stock_symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          dividend_amount?: number
          dividend_yield?: number | null
          ex_date?: string | null
          id?: string
          payment_date?: string | null
          stock_symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_simulations: {
        Row: {
          buy_date: string
          buy_price: number
          created_at: string
          id: string
          ltcg: number | null
          net_profit: number | null
          quantity: number
          sell_date: string
          sell_price: number
          stcg: number | null
          stock_symbol: string
          tax_liability: number | null
          user_id: string
        }
        Insert: {
          buy_date: string
          buy_price: number
          created_at?: string
          id?: string
          ltcg?: number | null
          net_profit?: number | null
          quantity: number
          sell_date: string
          sell_price: number
          stcg?: number | null
          stock_symbol: string
          tax_liability?: number | null
          user_id: string
        }
        Update: {
          buy_date?: string
          buy_price?: number
          created_at?: string
          id?: string
          ltcg?: number | null
          net_profit?: number | null
          quantity?: number
          sell_date?: string
          sell_price?: number
          stcg?: number | null
          stock_symbol?: string
          tax_liability?: number | null
          user_id?: string
        }
        Relationships: []
      }
      trade_logs: {
        Row: {
          id: string
          price: number | null
          recommendation: string
          stock_symbol: string
          timestamp: string
          user_id: string
        }
        Insert: {
          id?: string
          price?: number | null
          recommendation: string
          stock_symbol: string
          timestamp?: string
          user_id: string
        }
        Update: {
          id?: string
          price?: number | null
          recommendation?: string
          stock_symbol?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          added_at: string
          id: string
          stock_symbol: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          stock_symbol: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          stock_symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_snapshots: {
        Row: {
          best_stock: string | null
          created_at: string
          id: string
          portfolio_volatility: number | null
          sharpe_ratio: number | null
          snapshot_data: Json | null
          total_return: number | null
          user_id: string
          week_end: string
          week_start: string
          worst_stock: string | null
        }
        Insert: {
          best_stock?: string | null
          created_at?: string
          id?: string
          portfolio_volatility?: number | null
          sharpe_ratio?: number | null
          snapshot_data?: Json | null
          total_return?: number | null
          user_id: string
          week_end: string
          week_start: string
          worst_stock?: string | null
        }
        Update: {
          best_stock?: string | null
          created_at?: string
          id?: string
          portfolio_volatility?: number | null
          sharpe_ratio?: number | null
          snapshot_data?: Json | null
          total_return?: number | null
          user_id?: string
          week_end?: string
          week_start?: string
          worst_stock?: string | null
        }
        Relationships: []
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
