import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Prestamos from "./pages/Prestamos";
import DetallePrestamo from "./pages/DetallePrestamo";
import Rutas from "./pages/Rutas";
import DetalleRuta from "./pages/DetalleRuta";
import BaseDiaria from "./pages/BaseDiaria";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/prestamos" element={<Prestamos />} />
                    <Route path="/prestamos/:id" element={<DetallePrestamo />} />
                    <Route path="/rutas" element={<Rutas />} />
                    <Route path="/rutas/:id" element={<DetalleRuta />} />
                    <Route path="/cobros" element={<div className="p-6">Módulo de Cobros - En desarrollo</div>} />
                    <Route path="/base-diaria" element={<BaseDiaria />} />
                    <Route path="/reportes" element={<div className="p-6">Reportes - En desarrollo</div>} />
                    <Route path="/metricas" element={<div className="p-6">Métricas - En desarrollo</div>} />
                    <Route path="/configuracion" element={<div className="p-6">Configuración - En desarrollo</div>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
