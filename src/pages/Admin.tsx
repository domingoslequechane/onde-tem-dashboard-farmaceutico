import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LogOut, Plus, Power, PowerOff, Key } from 'lucide-react';
import Header from '@/components/Header';

const Admin = () => {
  const navigate = useNavigate();
  const [farmacias, setFarmacias] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchFarmacias();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roles || roles.role !== 'admin') {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setUser(user);
  };

  const fetchFarmacias = async () => {
    try {
      const { data, error } = await supabase
        .from('farmacias')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setFarmacias(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar farmácias",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFarmaciaStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('farmacias')
        .update({ ativa: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Farmácia ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
      });

      fetchFarmacias();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user ? { email: user.email, name: 'Admin' } : null} 
        onLogout={handleLogout} 
      />
      
      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Painel Administrativo
          </h1>
          <p className="text-gray-600">Gerencie farmácias e acompanhe o desempenho da plataforma</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Farmácias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{farmacias.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Farmácias Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {farmacias.filter(f => f.ativa).length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Farmácias Inativas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {farmacias.filter(f => !f.ativa).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Farmácias Cadastradas</CardTitle>
              <Button onClick={() => navigate('/admin/add-farmacia')}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Farmácia
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmacias.map((farmacia) => (
                  <TableRow key={farmacia.id}>
                    <TableCell className="font-medium">{farmacia.nome}</TableCell>
                    <TableCell>{farmacia.cidade}</TableCell>
                    <TableCell>
                      <Badge variant={farmacia.plano === 'premium' ? 'default' : 'secondary'}>
                        {farmacia.plano || 'free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={farmacia.ativa ? 'default' : 'destructive'}>
                        {farmacia.ativa ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={farmacia.status_assinatura === 'ativa' ? 'default' : 'secondary'}>
                        {farmacia.status_assinatura || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleFarmaciaStatus(farmacia.id, farmacia.ativa)}
                        >
                          {farmacia.ativa ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Em breve",
                              description: "Funcionalidade de recuperação de acesso em desenvolvimento.",
                            });
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
