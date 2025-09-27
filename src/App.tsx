import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Prestamos from "./pages/Prestamos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/prestamos" element={<Prestamos />} />
            <Route path="/rutas" element={<div className="p-6">Módulo de Rutas - En desarrollo</div>} />
            <Route path="/cobros" element={<div className="p-6">Módulo de Cobros - En desarrollo</div>} />
            <Route path="/base-diaria" element={<div className="p-6">Base Diaria - En desarrollo</div>} />
            <Route path="/reportes" element={<div className="p-6">Reportes - En desarrollo</div>} />
            <Route path="/metricas" element={<div className="p-6">Métricas - En desarrollo</div>} />
            <Route path="/configuracion" element={<div className="p-6">Configuración - En desarrollo</div>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
