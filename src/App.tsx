import { useState, useCallback } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ImportProvider } from "@/contexts/ImportContext";
import { ThemeProvider } from "next-themes";
import FloatingImportProgress from "@/components/FloatingImportProgress";
import SplashScreen from "@/components/SplashScreen";
import InstallPWAModal from "@/components/InstallPWAModal";
import ScrollToTop from "@/components/ScrollToTop";
import Landing from "./pages/Landing";
import Instalar from "./pages/Instalar";
import Encontrar from "./pages/Encontrar";
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

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
      <QueryClientProvider client={queryClient}>
        <ImportProvider>
          <TooltipProvider>
            {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
            <Toaster />
            <Sonner position="top-center" duration={5000} />
            <FloatingImportProgress />
            <InstallPWAModal />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Encontrar />} />
                <Route path="/home" element={<Landing />} />
                <Route path="/instalar" element={<Instalar />} />
                <Route path="/encontrar" element={<Encontrar />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/entrar" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/redefinir-senha" element={<FarmaciaResetPassword />} />
                
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
                <Route path="/admin/prospeccao" element={<Admin />} />
                <Route path="/admin/administradores" element={<Admin />} />
                <Route path="/admin/feedbacks" element={<Admin />} />
                <Route path="/admin/configuracoes" element={<AdminSettings />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/recuperar-senha" element={<AdminResetPassword />} />
                <Route path="/admin/reset-password" element={<AdminResetPassword />} />
                <Route path="/admin/redefinir-senha" element={<AdminResetPassword />} />
                <Route path="/admin/definir-senha" element={<AdminSetPassword />} />
                <Route path="/admin/set-password" element={<AdminSetPassword />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ImportProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
