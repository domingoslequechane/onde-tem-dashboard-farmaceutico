import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Instalar from "./pages/Instalar";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import AdminSettings from "./pages/AdminSettings";
import AdminResetPassword from "./pages/AdminResetPassword";
import AdminSetPassword from "./pages/AdminSetPassword";
import FarmaciaResetPassword from "./pages/FarmaciaResetPassword";
import FarmaciaSetPassword from "./pages/FarmaciaSetPassword";
import FarmaciaSettings from "./pages/FarmaciaSettings";
import FarmaciaDashboard from "./pages/farmacia/Dashboard";
import FarmaciaEstoque from "./pages/farmacia/Estoque";
import FarmaciaDemanda from "./pages/farmacia/Demanda";
import FarmaciaConfiguracoes from "./pages/farmacia/Configuracoes";
import FarmaciaSuporte from "./pages/farmacia/Suporte";
import AdminEstatisticas from "./pages/admin/Estatisticas";
import Contacto from "./pages/Contacto";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" duration={5000} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/instalar" element={<Instalar />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/entrar" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Rotas da Farmácia */}
          <Route path="/farmacia/dashboard" element={<FarmaciaDashboard />} />
          <Route path="/farmacia/estoque" element={<FarmaciaEstoque />} />
          <Route path="/farmacia/demanda" element={<FarmaciaDemanda />} />
          <Route path="/farmacia/configuracoes" element={<FarmaciaConfiguracoes />} />
          <Route path="/farmacia/suporte" element={<FarmaciaSuporte />} />
          <Route path="/farmacia/recuperar-senha" element={<FarmaciaResetPassword />} />
          <Route path="/farmacia/reset-password" element={<FarmaciaResetPassword />} />
          <Route path="/farmacia/definir-senha" element={<FarmaciaSetPassword />} />
          <Route path="/farmacia/set-password" element={<FarmaciaSetPassword />} />
          <Route path="/farmacia/configuracoes" element={<FarmaciaSettings />} />
          <Route path="/farmacia/settings" element={<FarmaciaSettings />} />
          
          {/* Rotas do Admin */}
          <Route path="/admin/entrar" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/estatisticas" element={<AdminEstatisticas />} />
          <Route path="/admin/farmacias" element={<Admin />} />
          <Route path="/admin/administradores" element={<Admin />} />
          <Route path="/admin/configuracoes" element={<AdminSettings />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/recuperar-senha" element={<AdminResetPassword />} />
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />
          <Route path="/admin/definir-senha" element={<AdminSetPassword />} />
          <Route path="/admin/set-password" element={<AdminSetPassword />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
