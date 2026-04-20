import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import {
  Cliente,
  ClienteTablaRow,
  ClienteEstadisticasSP,
  ClienteInsert,
  ClienteUpdate,
  ClienteFiltros,
} from "@/types/cliente"
import { useToast } from "@/hooks/use-toast"

const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL || "https://lvwsrwaepgievgqflziq.supabase.co"}/storage/v1/object/public/creditos`

export function buildFotoUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith("http")) return path
  return `${STORAGE_BASE}/${path}`
}

export function useClientes(filtros?: ClienteFiltros) {
  const [clientes, setClientes] = useState<ClienteTablaRow[]>([])
  const [estadisticas, setEstadisticas] = useState<ClienteEstadisticasSP | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc("get_clientes_tabla", {
        p_busqueda: filtros?.busqueda || null,
        p_estado: filtros?.estado || null,
      })

      if (rpcError) throw rpcError
      setClientes(data || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar clientes"
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [filtros?.busqueda, filtros?.estado])

  const fetchEstadisticas = useCallback(async () => {
    try {
      setLoadingStats(true)
      const { data, error: rpcError } = await supabase.rpc("get_clientes_estadisticas")
      if (rpcError) throw rpcError
      setEstadisticas((data as ClienteEstadisticasSP[])?.[0] ?? null)
    } catch {
      // stats son opcionales, no bloquean la UI
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const crearCliente = async (clienteData: ClienteInsert): Promise<Cliente | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from("deudores")
        .insert([clienteData])
        .select()
        .single()

      if (insertError) throw insertError

      toast({ title: "Cliente creado", description: "El cliente ha sido creado exitosamente" })
      await Promise.all([fetchClientes(), fetchEstadisticas()])
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear cliente"
      toast({ title: "Error", description: msg, variant: "destructive" })
      return null
    }
  }

  const actualizarCliente = async (id: string, clienteData: ClienteUpdate): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("deudores")
        .update({ ...clienteData, fecha_actualizacion: new Date().toISOString() })
        .eq("id", id)

      if (updateError) throw updateError

      toast({ title: "Cliente actualizado", description: "Los datos han sido actualizados" })
      await Promise.all([fetchClientes(), fetchEstadisticas()])
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar cliente"
      toast({ title: "Error", description: msg, variant: "destructive" })
      return false
    }
  }

  const eliminarCliente = async (id: string): Promise<boolean> => {
    try {
      const { data: prestamos } = await supabase
        .from("prestamos")
        .select("id")
        .eq("deudor_id", id)
        .eq("estado", "activo")

      if (prestamos && prestamos.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: "El cliente tiene préstamos activos",
          variant: "destructive",
        })
        return false
      }

      const { error: deleteError } = await supabase.from("deudores").delete().eq("id", id)
      if (deleteError) throw deleteError

      toast({ title: "Cliente eliminado", description: "El cliente ha sido eliminado" })
      await Promise.all([fetchClientes(), fetchEstadisticas()])
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar cliente"
      toast({ title: "Error", description: msg, variant: "destructive" })
      return false
    }
  }

  useEffect(() => { fetchClientes() }, [fetchClientes])
  useEffect(() => { fetchEstadisticas() }, [fetchEstadisticas])

  return {
    clientes,
    estadisticas,
    loading,
    loadingStats,
    error,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    refetch: fetchClientes,
  }
}

// Hook para un cliente individual (sin cambios)
export function useCliente(id: string) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from("deudores")
          .select("*")
          .eq("id", id)
          .single()
        if (fetchError) throw fetchError
        setCliente(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar cliente")
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  return { cliente, loading, error }
}
