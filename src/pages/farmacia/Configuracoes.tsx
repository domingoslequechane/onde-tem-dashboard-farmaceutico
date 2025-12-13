import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import FarmaciaNavigation from '@/components/FarmaciaNavigation';
import Settings from '@/components/Settings';
import FloatingSupportButton from '@/components/FloatingSupportButton';

const FarmaciaConfiguracoes = () => {
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
      .rpc('get_user_role', { _user_id: session.user.id });

    if (roleData !== 'farmacia') {
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

      <FarmaciaNavigation />

      <main className="flex-1 container mx-auto px-4 sm:px-6 pt-3 sm:pt-2 max-w-7xl pb-24 sm:pb-8 overflow-y-auto">
        <Settings farmacia={farmacia} />
      </main>
      <FloatingSupportButton farmaciaId={farmacia?.id} />
    </div>
  );
};

export default FarmaciaConfiguracoes;
