import { useParams, useNavigate } from 'react-router-dom'
import { DetallePrestamo } from '../components/prestamos/DetallePrestamo'

export default function DetallePrestamoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/prestamos')
  }

  if (!id) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">ID de préstamo no válido</p>
        <button 
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Volver a Préstamos
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <DetallePrestamo prestamoId={id} onBack={handleBack} />
    </div>
  )
}
