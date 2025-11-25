import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import AdminStatistics from '@/components/AdminStatistics';
import { Users, Building2, BarChart3 } from 'lucide-react';

const AdminEstatisticas = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [farmacias, setFarmacias] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate('/admin/login');
      return;
    }

    const { data: roleData } = await supabase
      .rpc('get_user_role', { _user_id: session.user.id });

    if (roleData !== 'admin' && roleData !== 'super_admin') {
      await supabase.auth.signOut();
      navigate('/admin/login');
      return;
    }

    setUser(session.user);
    await fetchFarmacias();
    setIsLoading(false);
  };

  const fetchFarmacias = async () => {
    const { data, error } = await supabase
      .from('farmacias')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFarmacias(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
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

  const totalFarmacias = farmacias.length;
  const farmaciasAtivas = farmacias.filter(f => f.account_status === 'active').length;
  const farmaciasInativas = farmacias.filter(f => f.account_status === 'blocked').length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={user ? { email: user.email, name: 'Administrador' } : null} onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6 flex gap-2 bg-muted/50 rounded-xl p-1.5">
          <button
            onClick={() => navigate('/admin/estatisticas')}
            className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg bg-card shadow-sm text-primary transition-all"
          >
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </button>
          <button
            onClick={() => navigate('/admin/farmacias')}
            className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <Building2 className="h-4 w-4" />
            Farmácias
          </button>
          <button
            onClick={() => navigate('/admin/administradores')}
            className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <Users className="h-4 w-4" />
            Administradores
          </button>
        </div>

        <AdminStatistics 
          totalFarmacias={totalFarmacias}
          farmaciasAtivas={farmaciasAtivas}
          farmaciasInativas={farmaciasInativas}
        />
      </main>
    </div>
  );
};

export default AdminEstatisticas;
