import { useState, useCallback, useRef } from "react"
import { supabase } from "@/integrations/supabase/client"
import { PresupuestoDia } from "@/types/presupuesto"
import { format } from "date-fns"

export function usePresupuesto() {
  const [data, setData] = useState<PresupuestoDia | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cache = useRef<Record<string, PresupuestoDia>>({})

  const fetchDia = useCallback(async (fecha: Date) => {
    const key = format(fecha, "yyyy-MM-dd")

    if (cache.current[key]) {
      setData(cache.current[key])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: result, error: rpcError } = await supabase
        .rpc("get_presupuesto_diario", { p_fecha: key })

      if (rpcError) throw rpcError

      const parsed = result as PresupuestoDia
      cache.current[key] = parsed
      setData(parsed)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar presupuesto"
      setError(msg)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const invalidate = useCallback((fecha: Date) => {
    const key = format(fecha, "yyyy-MM-dd")
    delete cache.current[key]
  }, [])

  return { data, loading, error, fetchDia, invalidate }
}
