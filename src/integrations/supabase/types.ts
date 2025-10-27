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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      base_diaria_cobradores: {
        Row: {
          cobrador_id: string
          estado: string | null
          fecha: string
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          monto_base_entregado: number
          monto_devuelto: number | null
          observaciones: string | null
          ruta_id: string
          supervisor_entrega: string | null
          supervisor_recibe: string | null
        }
        Insert: {
          cobrador_id: string
          estado?: string | null
          fecha?: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          monto_base_entregado: number
          monto_devuelto?: number | null
          observaciones?: string | null
          ruta_id: string
          supervisor_entrega?: string | null
          supervisor_recibe?: string | null
        }
        Update: {
          cobrador_id?: string
          estado?: string | null
          fecha?: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          monto_base_entregado?: number
          monto_devuelto?: number | null
          observaciones?: string | null
          ruta_id?: string
          supervisor_entrega?: string | null
          supervisor_recibe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_diaria_cobradores_cobrador_id_fkey"
            columns: ["cobrador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "base_diaria_cobradores_ruta_id_fkey"
            columns: ["ruta_id"]
            isOneToOne: false
            referencedRelation: "rutas"
            referencedColumns: ["id"]
          },
        ]
      }
      cobrador_ruta: {
        Row: {
          cobrador_id: string
          estado: string | null
          fecha_asignacion: string
          fecha_fin: string | null
          id: string
          ruta_id: string
        }
        Insert: {
          cobrador_id: string
          estado?: string | null
          fecha_asignacion?: string
          fecha_fin?: string | null
          id?: string
          ruta_id: string
        }
        Update: {
          cobrador_id?: string
          estado?: string | null
          fecha_asignacion?: string
          fecha_fin?: string | null
          id?: string
          ruta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobrador_ruta_cobrador_id_fkey"
            columns: ["cobrador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cobrador_ruta_ruta_id_fkey"
            columns: ["ruta_id"]
            isOneToOne: false
            referencedRelation: "rutas"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacion_diaria: {
        Row: {
          base_diaria_id: string
          cantidad_cobros_realizados: number | null
          cantidad_gastos: number | null
          cantidad_prestamos_nuevos: number | null
          conciliado_por: string | null
          diferencia: number | null
          dinero_efectivamente_devuelto: number | null
          dinero_teorico_devolver: number | null
          estado_conciliacion: string | null
          fecha_conciliacion: string | null
          id: string
          justificacion_diferencia: string | null
          monto_base_entregado: number
          nombre_persona_entrega: string | null
          observaciones_cierre: string | null
          persona_entrega_base: string | null
          total_cobros_programados: number
          total_cobros_realizados: number
          total_gastos: number | null
          total_gastos_aprobados: number | null
          total_gastos_pendientes: number | null
          total_prestamos_nuevos: number | null
          total_seguros: number | null
        }
        Insert: {
          base_diaria_id: string
          cantidad_cobros_realizados?: number | null
          cantidad_gastos?: number | null
          cantidad_prestamos_nuevos?: number | null
          conciliado_por?: string | null
          diferencia?: number | null
          dinero_efectivamente_devuelto?: number | null
          dinero_teorico_devolver?: number | null
          estado_conciliacion?: string | null
          fecha_conciliacion?: string | null
          id?: string
          justificacion_diferencia?: string | null
          monto_base_entregado: number
          nombre_persona_entrega?: string | null
          observaciones_cierre?: string | null
          persona_entrega_base?: string | null
          total_cobros_programados?: number
          total_cobros_realizados?: number
          total_gastos?: number | null
          total_gastos_aprobados?: number | null
          total_gastos_pendientes?: number | null
          total_prestamos_nuevos?: number | null
          total_seguros?: number | null
        }
        Update: {
          base_diaria_id?: string
          cantidad_cobros_realizados?: number | null
          cantidad_gastos?: number | null
          cantidad_prestamos_nuevos?: number | null
          conciliado_por?: string | null
          diferencia?: number | null
          dinero_efectivamente_devuelto?: number | null
          dinero_teorico_devolver?: number | null
          estado_conciliacion?: string | null
          fecha_conciliacion?: string | null
          id?: string
          justificacion_diferencia?: string | null
          monto_base_entregado?: number
          nombre_persona_entrega?: string | null
          observaciones_cierre?: string | null
          persona_entrega_base?: string | null
          total_cobros_programados?: number
          total_cobros_realizados?: number
          total_gastos?: number | null
          total_gastos_aprobados?: number | null
          total_gastos_pendientes?: number | null
          total_prestamos_nuevos?: number | null
          total_seguros?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conciliacion_diaria_base_diaria_id_fkey"
            columns: ["base_diaria_id"]
            isOneToOne: true
            referencedRelation: "base_diaria_cobradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacion_diaria_persona_entrega_base_fkey"
            columns: ["persona_entrega_base"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cronograma_pagos: {
        Row: {
          estado: string | null
          fecha_actualizacion: string | null
          fecha_creacion: string
          fecha_pago: string | null
          fecha_vencimiento: string
          id: string
          numero_cuota: number
          observaciones_pago: string | null
          prestamo_id: string
          saldo_pendiente: number
          valor_capital: number
          valor_cuota: number
          valor_interes: number
          valor_pagado: number | null
        }
        Insert: {
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string
          fecha_pago?: string | null
          fecha_vencimiento: string
          id?: string
          numero_cuota: number
          observaciones_pago?: string | null
          prestamo_id: string
          saldo_pendiente: number
          valor_capital: number
          valor_cuota: number
          valor_interes: number
          valor_pagado?: number | null
        }
        Update: {
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string
          fecha_pago?: string | null
          fecha_vencimiento?: string
          id?: string
          numero_cuota?: number
          observaciones_pago?: string | null
          prestamo_id?: string
          saldo_pendiente?: number
          valor_capital?: number
          valor_cuota?: number
          valor_interes?: number
          valor_pagado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_pagos_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      deudores: {
        Row: {
          apellido: string
          cedula: number
          creado_por: string | null
          direccion: string | null
          empresa_id: string | null
          estado: string | null
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          nombre: string
          ocupacion: string | null
          referencias: Json | null
          telefono: string | null
        }
        Insert: {
          apellido: string
          cedula: number
          creado_por?: string | null
          direccion?: string | null
          empresa_id?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          ocupacion?: string | null
          referencias?: Json | null
          telefono?: string | null
        }
        Update: {
          apellido?: string
          cedula?: number
          creado_por?: string | null
          direccion?: string | null
          empresa_id?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          ocupacion?: string | null
          referencias?: Json | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deudores_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deudores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          configuracion: Json | null
          direccion: string | null
          email: string | null
          estado: string | null
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          id: string
          logo_url: string | null
          nit: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          configuracion?: Json | null
          direccion?: string | null
          email?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string
          logo_url?: string | null
          nit: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          configuracion?: Json | null
          direccion?: string | null
          email?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string
          logo_url?: string | null
          nit?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      gastos_diarios: {
        Row: {
          aprobado_por: string | null
          comprobante_url: string | null
          descripcion: string
          estado_aprobacion: string | null
          fecha_creacion: string | null
          fecha_gasto: string | null
          hora_gasto: string | null
          id: string
          monto: number
          observaciones: string | null
          ruta_id: string | null
          tipo_gasto_id: string
          ubicacion: string | null
          user_id: string | null
        }
        Insert: {
          aprobado_por?: string | null
          comprobante_url?: string | null
          descripcion: string
          estado_aprobacion?: string | null
          fecha_creacion?: string | null
          fecha_gasto?: string | null
          hora_gasto?: string | null
          id?: string
          monto: number
          observaciones?: string | null
          ruta_id?: string | null
          tipo_gasto_id: string
          ubicacion?: string | null
          user_id?: string | null
        }
        Update: {
          aprobado_por?: string | null
          comprobante_url?: string | null
          descripcion?: string
          estado_aprobacion?: string | null
          fecha_creacion?: string | null
          fecha_gasto?: string | null
          hora_gasto?: string | null
          id?: string
          monto?: number
          observaciones?: string | null
          ruta_id?: string | null
          tipo_gasto_id?: string
          ubicacion?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_diarios_ruta_id_fkey"
            columns: ["ruta_id"]
            isOneToOne: false
            referencedRelation: "rutas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_diarios_tipo_gasto_id_fkey"
            columns: ["tipo_gasto_id"]
            isOneToOne: false
            referencedRelation: "tipos_gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_diarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pagos: {
        Row: {
          creado_por: string | null
          created_at: string | null
          empresa_id: string | null
          fecha_creacion: string | null
          fecha_pago: string
          id: string
          metodo_pago: string
          monto: number
          observaciones: string | null
          prestamo_id: string
          recibo_numero: string | null
          updated_at: string | null
        }
        Insert: {
          creado_por?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fecha_creacion?: string | null
          fecha_pago: string
          id?: string
          metodo_pago: string
          monto: number
          observaciones?: string | null
          prestamo_id: string
          recibo_numero?: string | null
          updated_at?: string | null
        }
        Update: {
          creado_por?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fecha_creacion?: string | null
          fecha_pago?: string
          id?: string
          metodo_pago?: string
          monto?: number
          observaciones?: string | null
          prestamo_id?: string
          recibo_numero?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_recibidos: {
        Row: {
          eliminado_por: string | null
          estado: string | null
          fecha_eliminacion: string | null
          fecha_pago: string | null
          foto_comprobante_url: string | null
          hora_pago: string | null
          id: string
          monto_pagado: number
          observaciones: string | null
          prestamo_id: string | null
          registrado_por: string | null
          tipo_pago: string | null
        }
        Insert: {
          eliminado_por?: string | null
          estado?: string | null
          fecha_eliminacion?: string | null
          fecha_pago?: string | null
          foto_comprobante_url?: string | null
          hora_pago?: string | null
          id?: string
          monto_pagado: number
          observaciones?: string | null
          prestamo_id?: string | null
          registrado_por?: string | null
          tipo_pago?: string | null
        }
        Update: {
          eliminado_por?: string | null
          estado?: string | null
          fecha_eliminacion?: string | null
          fecha_pago?: string | null
          foto_comprobante_url?: string | null
          hora_pago?: string | null
          id?: string
          monto_pagado?: number
          observaciones?: string | null
          prestamo_id?: string | null
          registrado_por?: string | null
          tipo_pago?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_recibidos_eliminado_por_fkey"
            columns: ["eliminado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pagos_recibidos_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_recibidos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["user_id"]
          },
        ]
      }
      prestamos: {
        Row: {
          creado_por: string | null
          cuotas_pagadas: number | null
          deudor_id: string
          dia_pago_semanal: string | null
          estado: string | null
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          fecha_desembolso: string
          fecha_primer_pago: string
          fecha_ultimo_pago: string | null
          foto_evidencia_url: string | null
          id: string
          monto_principal: number
          monto_total: number
          numero_cuotas: number
          numero_prestamo: string
          observaciones: string | null
          orden_ruta: number | null
          periodicidad: string
          ruta_id: string
          saldo_pendiente: number
          tasa_interes: number
          valor_cuota: number
          valor_seguro: number | null
        }
        Insert: {
          creado_por?: string | null
          cuotas_pagadas?: number | null
          deudor_id: string
          dia_pago_semanal?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_desembolso?: string
          fecha_primer_pago: string
          fecha_ultimo_pago?: string | null
          foto_evidencia_url?: string | null
          id?: string
          monto_principal: number
          monto_total: number
          numero_cuotas: number
          numero_prestamo: string
          observaciones?: string | null
          orden_ruta?: number | null
          periodicidad: string
          ruta_id: string
          saldo_pendiente?: number
          tasa_interes: number
          valor_cuota: number
          valor_seguro?: number | null
        }
        Update: {
          creado_por?: string | null
          cuotas_pagadas?: number | null
          deudor_id?: string
          dia_pago_semanal?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_desembolso?: string
          fecha_primer_pago?: string
          fecha_ultimo_pago?: string | null
          foto_evidencia_url?: string | null
          id?: string
          monto_principal?: number
          monto_total?: number
          numero_cuotas?: number
          numero_prestamo?: string
          observaciones?: string | null
          orden_ruta?: number | null
          periodicidad?: string
          ruta_id?: string
          saldo_pendiente?: number
          tasa_interes?: number
          valor_cuota?: number
          valor_seguro?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prestamos_creado_por_fkey1"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "prestamos_deudor_id_fkey"
            columns: ["deudor_id"]
            isOneToOne: false
            referencedRelation: "deudores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_ruta_id_fkey"
            columns: ["ruta_id"]
            isOneToOne: false
            referencedRelation: "rutas"
            referencedColumns: ["id"]
          },
        ]
      }
      prestamos_rutas_diarias: {
        Row: {
          base_diaria_id: string
          created_at: string | null
          id: string
          monto_entregado: number
          prestamo_id: string
          updated_at: string | null
        }
        Insert: {
          base_diaria_id: string
          created_at?: string | null
          id?: string
          monto_entregado?: number
          prestamo_id: string
          updated_at?: string | null
        }
        Update: {
          base_diaria_id?: string
          created_at?: string | null
          id?: string
          monto_entregado?: number
          prestamo_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestamos_rutas_diarias_base_diaria_id_fkey"
            columns: ["base_diaria_id"]
            isOneToOne: false
            referencedRelation: "base_diaria_cobradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_rutas_diarias_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      rutas: {
        Row: {
          descripcion: string | null
          empresa_id: string | null
          estado: string | null
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          id: string
          inversion_ruta: number | null
          nombre_ruta: string
          usuario_id: string | null
          zona_geografica: string | null
        }
        Insert: {
          descripcion?: string | null
          empresa_id?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string
          inversion_ruta?: number | null
          nombre_ruta: string
          usuario_id?: string | null
          zona_geografica?: string | null
        }
        Update: {
          descripcion?: string | null
          empresa_id?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string
          inversion_ruta?: number | null
          nombre_ruta?: string
          usuario_id?: string | null
          zona_geografica?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rutas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rutas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_gastos: {
        Row: {
          descripcion: string | null
          empresa_id: string | null
          estado: string | null
          fecha_creacion: string | null
          id: string
          nombre: string
          requiere_comprobante: boolean | null
        }
        Insert: {
          descripcion?: string | null
          empresa_id?: string | null
          estado?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre: string
          requiere_comprobante?: boolean | null
        }
        Update: {
          descripcion?: string | null
          empresa_id?: string | null
          estado?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre?: string
          requiere_comprobante?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tipos_gastos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          apellido: string
          cedula: string
          configuracion: Json | null
          email: string | null
          empresa_id: string | null
          estado: string | null
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          foto_url: string | null
          id: string
          nombre: string
          password_hash: string | null
          rol: string
          telefono: string | null
          ultimo_acceso: string | null
          user_id: string | null
        }
        Insert: {
          apellido: string
          cedula: string
          configuracion?: Json | null
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          password_hash?: string | null
          rol: string
          telefono?: string | null
          ultimo_acceso?: string | null
          user_id?: string | null
        }
        Update: {
          apellido?: string
          cedula?: string
          configuracion?: Json | null
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          password_hash?: string | null
          rol?: string
          telefono?: string | null
          ultimo_acceso?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_cuotas_esperadas: {
        Args: {
          p_fecha_primer_pago: string
          p_numero_cuotas: number
          p_periodicidad: string
        }
        Returns: number
      }
      calcular_cuotas_vencidas: {
        Args: {
          p_cuotas_pagadas: number
          p_fecha_primer_pago: string
          p_numero_cuotas: number
          p_periodicidad: string
        }
        Returns: number
      }
      esta_moroso: {
        Args: {
          p_cuotas_pagadas: number
          p_fecha_primer_pago: string
          p_numero_cuotas: number
          p_periodicidad: string
        }
        Returns: boolean
      }
      generar_cronograma_pagos: {
        Args: {
          fecha_primer_pago_param: string
          monto_principal_param: number
          numero_cuotas_param: number
          periodicidad_param: string
          prestamo_id_param: string
          tasa_interes_param: number
          valor_seguro_param: number
        }
        Returns: undefined
      }
      generate_loan_number_by_route: {
        Args: { ruta_id_param: string }
        Returns: string
      }
      get_cobrador_rutas: {
        Args: never
        Returns: {
          ruta_id: string
        }[]
      }
      get_user_empresa_id: { Args: never; Returns: string }
      get_user_profile: {
        Args: never
        Returns: {
          empresa_id: string
          estado: string
          rol: string
          user_id: string
        }[]
      }
      get_user_routes: {
        Args: never
        Returns: {
          descripcion: string
          empresa_id: string
          id: string
          nombre_ruta: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      test_rls_as_user: {
        Args: { test_user_id: string }
        Returns: {
          cronograma_visible: number
          prestamos_visible: number
          rutas_visible: number
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
