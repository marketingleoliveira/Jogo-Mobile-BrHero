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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          admin_role: Database["public"]["Enums"]["admin_role"] | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          module: string
          reason: string | null
          target: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          module: string
          reason?: string | null
          target?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          module?: string
          reason?: string | null
          target?: string | null
        }
        Relationships: []
      }
      admin_module_entities: {
        Row: {
          created_at: string
          data: Json
          entity_id: string
          id: string
          module: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          data: Json
          entity_id: string
          id?: string
          module: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          entity_id?: string
          id?: string
          module?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      admin_user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      leaderboards: {
        Row: {
          category: string
          created_at: string
          display_name: string | null
          extra: Json
          id: string
          score: number
          season_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          display_name?: string | null
          extra?: Json
          id?: string
          score?: number
          season_key?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          display_name?: string | null
          extra?: Json
          id?: string
          score?: number
          season_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          client_consumed_at: string | null
          country: string | null
          created_at: string
          currency: string
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json
          offer_id: string
          offer_snapshot: Json
          provider: string
          provider_ref: string | null
          refunded_at: string | null
          reward_delivered: boolean
          reward_delivered_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          client_consumed_at?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          offer_id: string
          offer_snapshot?: Json
          provider?: string
          provider_ref?: string | null
          refunded_at?: string | null
          reward_delivered?: boolean
          reward_delivered_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          client_consumed_at?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          offer_id?: string
          offer_snapshot?: Json
          provider?: string
          provider_ref?: string | null
          refunded_at?: string | null
          reward_delivered?: boolean
          reward_delivered_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_referrals: {
        Row: {
          awarded_gems: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          awarded_gems?: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          awarded_gems?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      player_save_backups: {
        Row: {
          client_updated_at: string
          created_at: string
          essence: number
          gems: number
          id: string
          level: number
          max_stage: number
          prestige_level: number
          reason: string
          save_data: Json
          stage: number
          user_id: string
        }
        Insert: {
          client_updated_at?: string
          created_at?: string
          essence?: number
          gems?: number
          id?: string
          level?: number
          max_stage?: number
          prestige_level?: number
          reason?: string
          save_data: Json
          stage?: number
          user_id: string
        }
        Update: {
          client_updated_at?: string
          created_at?: string
          essence?: number
          gems?: number
          id?: string
          level?: number
          max_stage?: number
          prestige_level?: number
          reason?: string
          save_data?: Json
          stage?: number
          user_id?: string
        }
        Relationships: []
      }
      player_saves: {
        Row: {
          client_updated_at: string
          created_at: string
          essence: number
          gems: number
          level: number
          max_stage: number
          prestige_level: number
          save_data: Json
          save_version: number
          stage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_updated_at?: string
          created_at?: string
          essence?: number
          gems?: number
          level?: number
          max_stage?: number
          prestige_level?: number
          save_data: Json
          save_version?: number
          stage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_updated_at?: string
          created_at?: string
          essence?: number
          gems?: number
          level?: number
          max_stage?: number
          prestige_level?: number
          save_data?: Json
          save_version?: number
          stage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_sessions: {
        Row: {
          created_at: string
          session_id: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          session_id: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          session_id?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      player_titles: {
        Row: {
          awarded_at: string
          id: string
          source_season_key: string | null
          title: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          id?: string
          source_season_key?: string | null
          title: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          id?: string
          source_season_key?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      player_wallet: {
        Row: {
          created_at: string
          gems: number
          gold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gems?: number
          gold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gems?: number
          gold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      season_rewards: {
        Row: {
          category: string
          claimed_at: string | null
          created_at: string
          id: string
          rank: number
          reward: Json
          season_key: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          claimed_at?: string | null
          created_at?: string
          id?: string
          rank: number
          reward?: Json
          season_key: string
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          claimed_at?: string | null
          created_at?: string
          id?: string
          rank?: number
          reward?: Json
          season_key?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_referral: { Args: { _referrer: string }; Returns: Json }
      claim_season_reward: { Args: { _reward_id: string }; Returns: Json }
      claim_super_admin: { Args: { _display_name?: string }; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_admin_role: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      has_admin_permission: {
        Args: { _action: string; _module: string; _user_id?: string }
        Returns: boolean
      }
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id?: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      admin_role:
        | "super_admin"
        | "game_master"
        | "support"
        | "moderator"
        | "financial"
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
      admin_role: [
        "super_admin",
        "game_master",
        "support",
        "moderator",
        "financial",
      ],
    },
  },
} as const
