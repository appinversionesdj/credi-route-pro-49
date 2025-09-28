import { useState, useEffect } from "react"
import { supabase, testSupabaseConnection } from "@/integrations/supabase/client"
import { 
  Cliente, 
  ClienteExtendido, 
  ClienteInsert, 
  ClienteUpdate, 
  ClienteFiltros,
  ClienteEstadisticas 
} from "@/types/cliente"
import { useToast } from "@/hooks/use-toast"

export function useClientes(filtros?: ClienteFiltros) {
  const [clientes, setClientes] = useState<ClienteExtendido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Función para obtener clientes con información extendida
  const fetchClientes = async () => {
    try {
      setLoading(true)
      setError(null)

      // Primero, probar la conexión básica
      console.log("🔍 Probando conexión a Supabase...")
      const connectionTest = await testSupabaseConnection()
      if (!connectionTest) {
        throw new Error("No se pudo conectar a Supabase")
      }

      // Consulta simplificada para evitar problemas de RLS
      console.log("📊 Obteniendo clientes...")
      let query = supabase
        .from("deudores")
        .select("*")

      // Aplicar filtros
      if (filtros?.busqueda) {
        query = query.or(
          `nombre.ilike.%${filtros.busqueda}%,apellido.ilike.%${filtros.busqueda}%,cedula.eq.${filtros.busqueda}`
        )
      }

      if (filtros?.estado) {
        query = query.eq("estado", filtros.estado)
      }

      if (filtros?.empresa_id) {
        query = query.eq("empresa_id", filtros.empresa_id)
      }

      const { data, error: fetchError } = await query.order("fecha_creacion", { ascending: false })

      if (fetchError) {
        console.error("❌ Error de Supabase:", fetchError)
        
        // Manejar error específico de RLS
        if (fetchError.code === "42P17") {
          throw new Error("Error de configuración de seguridad en la base de datos. Contacta al administrador.")
        }
        
        throw fetchError
      }

      console.log("✅ Clientes obtenidos:", data?.length || 0)

      // Procesar datos básicos (sin relaciones complejas por ahora)
      const clientesExtendidos: ClienteExtendido[] = (data || []).map((cliente: any) => ({
        ...cliente,
        prestamosActivos: 0, // Temporalmente en 0 hasta resolver RLS
        totalDeuda: 0, // Temporalmente en 0 hasta resolver RLS
        ultimoPago: null,
        ruta: null
      }))

      setClientes(clientesExtendidos)
    } catch (err) {
      console.error("❌ Error completo:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al cargar clientes"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Crear nuevo cliente
  const crearCliente = async (clienteData: ClienteInsert): Promise<Cliente | null> => {
    try {
      setLoading(true)
      
      const { data, error: insertError } = await supabase
        .from("deudores")
        .insert([clienteData])
        .select()
        .single()

      if (insertError) throw insertError

      toast({
        title: "Cliente creado",
        description: "El cliente ha sido creado exitosamente"
      })

      // Recargar la lista
      await fetchClientes()
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear cliente"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  // Actualizar cliente
  const actualizarCliente = async (id: string, clienteData: ClienteUpdate): Promise<boolean> => {
    try {
      setLoading(true)
      
      const { error: updateError } = await supabase
        .from("deudores")
        .update({
          ...clienteData,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq("id", id)

      if (updateError) throw updateError

      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados"
      })

      // Recargar la lista
      await fetchClientes()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar cliente"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Eliminar cliente
  const eliminarCliente = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      
      // Verificar si tiene préstamos activos
      const { data: prestamos } = await supabase
        .from("prestamos")
        .select("id")
        .eq("deudor_id", id)
        .eq("estado", "activo")

      if (prestamos && prestamos.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: "El cliente tiene préstamos activos",
          variant: "destructive"
        })
        return false
      }

      const { error: deleteError } = await supabase
        .from("deudores")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente"
      })

      // Recargar la lista
      await fetchClientes()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar cliente"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Obtener estadísticas
  const obtenerEstadisticas = async (): Promise<ClienteEstadisticas | null> => {
    try {
      const { data: clientesData } = await supabase
        .from("deudores")
        .select(`
          estado,
          prestamos!prestamos_deudor_id_fkey (
            estado,
            monto_total
          )
        `)

      if (!clientesData) return null

      const totalClientes = clientesData.length
      const clientesActivos = clientesData.filter(c => c.estado === "activo").length
      const clientesMorosos = clientesData.filter(c => c.estado === "moroso").length
      
      let deudaTotal = 0
      let prestamosActivos = 0

      clientesData.forEach((cliente: any) => {
        const prestamosActivosCliente = cliente.prestamos?.filter((p: any) => p.estado === "activo") || []
        prestamosActivos += prestamosActivosCliente.length
        deudaTotal += prestamosActivosCliente.reduce((sum: number, p: any) => sum + (p.monto_total || 0), 0)
      })

      return {
        totalClientes,
        clientesActivos,
        clientesMorosos,
        deudaTotal,
        prestamosActivos
      }
    } catch (err) {
      console.error("Error al obtener estadísticas:", err)
      return null
    }
  }

  // Cargar datos al montar el componente o cambiar filtros
  useEffect(() => {
    fetchClientes()
  }, [filtros?.busqueda, filtros?.estado, filtros?.empresa_id])

  return {
    clientes,
    loading,
    error,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    obtenerEstadisticas,
    refetch: fetchClientes
  }
}

// Hook para obtener un cliente específico
export function useCliente(id: string) {
  const [cliente, setCliente] = useState<ClienteExtendido | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from("deudores")
          .select(`
            *,
            prestamos!prestamos_deudor_id_fkey (
              *,
              rutas!prestamos_ruta_id_fkey (
                nombre_ruta
              )
            )
          `)
          .eq("id", id)
          .single()

        if (fetchError) throw fetchError

        // Procesar datos
        const prestamosActivos = data.prestamos?.filter((p: any) => p.estado === "activo") || []
        const totalDeuda = prestamosActivos.reduce((sum: number, p: any) => sum + (p.monto_total || 0), 0)
        const ultimoPago = prestamosActivos.reduce((latest: string | null, p: any) => {
          if (!p.fecha_ultimo_pago) return latest
          if (!latest) return p.fecha_ultimo_pago
          return p.fecha_ultimo_pago > latest ? p.fecha_ultimo_pago : latest
        }, null)

        const clienteExtendido: ClienteExtendido = {
          ...data,
          prestamosActivos: prestamosActivos.length,
          totalDeuda,
          ultimoPago,
          ruta: prestamosActivos[0]?.rutas?.nombre_ruta || null
        }

        setCliente(clienteExtendido)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al cargar cliente"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCliente()
    }
  }, [id])

  return { cliente, loading, error }
}
