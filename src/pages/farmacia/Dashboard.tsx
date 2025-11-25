import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import StockControl from '@/components/StockControl';
import DemandAnalysis from '@/components/DemandAnalysis';
import ServiceImpact from '@/components/ServiceImpact';
import { Package, TrendingUp, Settings, MessageSquare, LayoutDashboard } from 'lucide-react';

const FarmaciaDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [farmacia, setFarmacia] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (roleData?.role !== 'farmacia') {
      await supabase.auth.signOut();
      navigate('/auth');
      return;
    }

    setUser(session.user);
    await loadFarmaciaData(session.user.id);
    setIsLoading(false);
  };

  const loadFarmaciaData = async (userId: string) => {
    const { data } = await supabase
      .from('farmacias')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setFarmacia(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header 
        user={user ? { 
          email: user.email, 
          name: farmacia?.nome || user.email?.split('@')[0] || 'Usuário' 
        } : null} 
        onLogout={handleLogout}
        isVerified={true}
      />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl pb-24 sm:pb-8 overflow-y-auto">
        <div className="space-y-4 sm:space-y-6">
          {/* Resultados Onde Tem - Full width on top */}
          <div className="animate-slide-up">
            <ServiceImpact />
          </div>
          
          {/* Grid with Stock Control and Demand Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <StockControl />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <DemandAnalysis />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg sm:hidden">
        <div className="grid grid-cols-5 h-auto p-1.5">
          <button
            onClick={() => navigate('/farmacia/dashboard')}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg bg-primary/10 text-primary transition-all"
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            <span className="truncate text-[9px] leading-tight">Início</span>
          </button>
          <button
            onClick={() => navigate('/farmacia/estoque')}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <Package className="h-5 w-5 flex-shrink-0" />
            <span className="truncate text-[9px] leading-tight">Estoque</span>
          </button>
          <button
            onClick={() => navigate('/farmacia/demanda')}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <TrendingUp className="h-5 w-5 flex-shrink-0" />
            <span className="truncate text-[9px] leading-tight">Demanda</span>
          </button>
          <button
            onClick={() => navigate('/farmacia/configuracoes')}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span className="truncate text-[9px] leading-tight">Config.</span>
          </button>
          <button
            onClick={() => navigate('/farmacia/suporte')}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <MessageSquare className="h-5 w-5 flex-shrink-0" />
            <span className="truncate text-[9px] leading-tight">Suporte</span>
          </button>
        </div>
      </nav>

      {/* Desktop Navigation */}
      <div className="hidden sm:block container mx-auto px-6 pb-8 max-w-7xl">
        <div className="flex gap-2 justify-center bg-muted/50 rounded-xl p-1.5">
          <button
            onClick={() => navigate('/farmacia/dashboard')}
            className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg bg-card shadow-sm text-primary transition-all"
          >
            <LayoutDashboard className="h-4 w-4" />
            Início
          </button>
          <button
            onClick={() => navigate('/farmacia/estoque')}
            className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <Package className="h-4 w-4" />
            Estoque
          </button>
          <button
            onClick={() => navigate('/farmacia/demanda')}
            className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <TrendingUp className="h-4 w-4" />
            Demanda
          </button>
          <button
            onClick={() => navigate('/farmacia/configuracoes')}
            className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </button>
          <button
            onClick={() => navigate('/farmacia/suporte')}
            className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            Suporte
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmaciaDashboard;
