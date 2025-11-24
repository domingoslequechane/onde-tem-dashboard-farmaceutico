import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [farmacia, setFarmacia] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        loadFarmaciaData(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setFarmacia(null);
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Verificar se o usuário é farmácia
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: session.user.id });

      if (roleError || !roleData || roleData !== 'farmacia') {
        // Se for admin ou não tiver role, fazer logout
        await supabase.auth.signOut();
        navigate('/auth');
        setIsLoading(false);
        return;
      }

      setUser(session.user);
      setIsAuthenticated(true);
      await loadFarmaciaData(session.user.id);
    } else {
      navigate('/auth');
    }
    
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dashboard 
      user={user ? { 
        email: user.email, 
        name: farmacia?.nome || user.email?.split('@')[0] || 'Usuário' 
      } : null} 
      onLogout={handleLogout}
      farmacia={farmacia}
    />
  );
};

export default Index;
