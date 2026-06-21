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
      clientes: {
        Row: {
          cliente_id: string
          created_at: string
          data: Json
          email: string | null
          nome: string
          observacoes: string | null
          telefone: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data?: Json
          email?: string | null
          nome: string
          observacoes?: string | null
          telefone?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data?: Json
          email?: string | null
          nome?: string
          observacoes?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      despesas: {
        Row: {
          ano: string | null
          banco: string | null
          cartao: string | null
          categoria: string | null
          cliente_id: string
          created_at: string
          data: string
          descricao: string
          forma_pagamento: string | null
          grupo: string | null
          id: string
          mes: string | null
          mes_pagamento: string | null
          origem: string
          pago: boolean
          parcela_grupo_id: string | null
          parcela_n: number | null
          parcela_total: number | null
          valor: number
        }
        Insert: {
          ano?: string | null
          banco?: string | null
          cartao?: string | null
          categoria?: string | null
          cliente_id: string
          created_at?: string
          data: string
          descricao: string
          forma_pagamento?: string | null
          grupo?: string | null
          id?: string
          mes?: string | null
          mes_pagamento?: string | null
          origem?: string
          pago?: boolean
          parcela_grupo_id?: string | null
          parcela_n?: number | null
          parcela_total?: number | null
          valor: number
        }
        Update: {
          ano?: string | null
          banco?: string | null
          cartao?: string | null
          categoria?: string | null
          cliente_id?: string
          created_at?: string
          data?: string
          descricao?: string
          forma_pagamento?: string | null
          grupo?: string | null
          id?: string
          mes?: string | null
          mes_pagamento?: string | null
          origem?: string
          pago?: boolean
          parcela_grupo_id?: string | null
          parcela_n?: number | null
          parcela_total?: number | null
          valor?: number
        }
        Relationships: []
      }
      dividas: {
        Row: {
          cliente_id: string
          created_at: string
          credor: string
          id: string
          parcelas_pagas: number
          parcelas_restantes: number | null
          parcelas_totais: number | null
          saldo_devedor: number
          status: string
          taxa_juros: number | null
          tipo: string | null
          total_pago: number
          ultima_parcela: number | null
          updated_at: string
          valor_original: number | null
          valor_parcela: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          credor: string
          id?: string
          parcelas_pagas?: number
          parcelas_restantes?: number | null
          parcelas_totais?: number | null
          saldo_devedor?: number
          status?: string
          taxa_juros?: number | null
          tipo?: string | null
          total_pago?: number
          ultima_parcela?: number | null
          updated_at?: string
          valor_original?: number | null
          valor_parcela?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          credor?: string
          id?: string
          parcelas_pagas?: number
          parcelas_restantes?: number | null
          parcelas_totais?: number | null
          saldo_devedor?: number
          status?: string
          taxa_juros?: number | null
          tipo?: string | null
          total_pago?: number
          ultima_parcela?: number | null
          updated_at?: string
          valor_original?: number | null
          valor_parcela?: number | null
        }
        Relationships: []
      }
      entries: {
        Row: {
          cliente_id: string
          created_at: string
          data: Json
          id: string
          sheet: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data?: Json
          id?: string
          sheet: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data?: Json
          id?: string
          sheet?: string
        }
        Relationships: []
      }
      extraordinario: {
        Row: {
          ano: string
          categoria: string | null
          cliente_id: string
          created_at: string
          descricao: string | null
          grupo: string | null
          id: string
          mes: string
          valor_planejado: number
        }
        Insert: {
          ano: string
          categoria?: string | null
          cliente_id: string
          created_at?: string
          descricao?: string | null
          grupo?: string | null
          id?: string
          mes: string
          valor_planejado?: number
        }
        Update: {
          ano?: string
          categoria?: string | null
          cliente_id?: string
          created_at?: string
          descricao?: string | null
          grupo?: string | null
          id?: string
          mes?: string
          valor_planejado?: number
        }
        Relationships: []
      }
      perfil_cliente: {
        Row: {
          ano: string | null
          cliente_id: string
          clt: boolean | null
          created_at: string
          data: Json
          email: string | null
          filhos: number | null
          gastos_mensais: number | null
          nome: string | null
          rede: string | null
          reserva_meses: number | null
          reserva_valor: number | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ano?: string | null
          cliente_id: string
          clt?: boolean | null
          created_at?: string
          data?: Json
          email?: string | null
          filhos?: number | null
          gastos_mensais?: number | null
          nome?: string | null
          rede?: string | null
          reserva_meses?: number | null
          reserva_valor?: number | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ano?: string | null
          cliente_id?: string
          clt?: boolean | null
          created_at?: string
          data?: Json
          email?: string | null
          filhos?: number | null
          gastos_mensais?: number | null
          nome?: string | null
          rede?: string | null
          reserva_meses?: number | null
          reserva_valor?: number | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plano_acao: {
        Row: {
          cliente_id: string
          created_at: string
          descricao: string | null
          id: string
          prazo: string | null
          prioridade: string
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      renda_planejamento: {
        Row: {
          ano: string
          cliente_id: string
          created_at: string
          data: Json
          outras: number
          salario: number
          updated_at: string
        }
        Insert: {
          ano: string
          cliente_id: string
          created_at?: string
          data?: Json
          outras?: number
          salario?: number
          updated_at?: string
        }
        Update: {
          ano?: string
          cliente_id?: string
          created_at?: string
          data?: Json
          outras?: number
          salario?: number
          updated_at?: string
        }
        Relationships: []
      }
      reserva_ideal: {
        Row: {
          cliente_id: string
          meses_cobertura: number
          observacoes: string | null
          updated_at: string
          valor_alvo: number
          valor_atual: number
        }
        Insert: {
          cliente_id: string
          meses_cobertura?: number
          observacoes?: string | null
          updated_at?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Update: {
          cliente_id?: string
          meses_cobertura?: number
          observacoes?: string | null
          updated_at?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Relationships: []
      }
      sonhos: {
        Row: {
          ano: string | null
          cliente_id: string
          created_at: string
          descricao: string
          id: string
          prazo: string | null
          prioridade: string | null
          valor: number | null
        }
        Insert: {
          ano?: string | null
          cliente_id: string
          created_at?: string
          descricao: string
          id?: string
          prazo?: string | null
          prioridade?: string | null
          valor?: number | null
        }
        Update: {
          ano?: string | null
          cliente_id?: string
          created_at?: string
          descricao?: string
          id?: string
          prazo?: string | null
          prioridade?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cliente_id: string | null
          created_at: string
          email: string
          id: string
          nome: string
          role: string
          senha: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          role?: string
          senha: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          role?: string
          senha?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      hash_password: { Args: { senha: string }; Returns: string }
      verify_user_password: {
        Args: { p_email: string; p_senha: string }
        Returns: {
          cliente_id: string
          email: string
          id: string
          nome: string
          role: string
        }[]
      }
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
