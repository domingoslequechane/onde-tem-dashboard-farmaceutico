import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    // Verificar o role do usuário
    const { data: roleData } = await supabase
      .rpc('get_user_role', { _user_id: session.user.id });

    if (roleData === 'farmacia') {
      navigate('/farmacia/dashboard');
    } else if (roleData === 'admin' || roleData === 'super_admin') {
      navigate('/admin/estatisticas');
    } else {
      // Se não tiver role definido, logout e redirecionar para auth
      await supabase.auth.signOut();
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground text-lg">Redirecionando...</p>
      </div>
    </div>
  );
};

export default Index;
