import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Power, PowerOff, Key, Edit, Search, Store, Users, TrendingUp, UserCog, BarChart, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import AdminFarmaciaModal from '@/components/AdminFarmaciaModal';
import AdminManagers from '@/components/AdminManagers';
import AdminStatistics from '@/components/AdminStatistics';
import PharmacyLoginHistory from '@/components/PharmacyLoginHistory';
import { DeletePharmacyDialog } from '@/components/DeletePharmacyDialog';

const Admin = () => {
  const navigate = useNavigate();
  const [farmacias, setFarmacias] = useState<any[]>([]);
  const [filteredFarmacias, setFilteredFarmacias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarmacia, setEditingFarmacia] = useState<any>(null);
  const [deletingPharmacy, setDeletingPharmacy] = useState<{ id: string; nome: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const filtered = farmacias.filter(farmacia =>
      farmacia.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmacia.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmacia.estado.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFarmacias(filtered);
  }, [searchTerm, farmacias]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/admin/login');
      return;
    }

    // Verificar se é admin usando a função security definer
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_user_role', { _user_id: user.id });

    if (roleError || !roleData || (roleData !== 'admin' && roleData !== 'super_admin')) {
      toast({
        title: "Acesso negado",
        description: "Você não possui privilégios de administrador.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      navigate('/admin/login');
      return;
    }

    setUser(user);
    fetchFarmacias();
  };

  const fetchFarmacias = async () => {
    setIsLoading(true);
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
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <Header 
          user={user ? { email: user.email, name: 'Administrador' } : null} 
          onLogout={handleLogout} 
        />
      </div>
      
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl flex-1 flex flex-col overflow-hidden">
          {/* Tabs para diferentes seções */}
          <Tabs defaultValue="estatisticas" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto flex-shrink-0 mb-6">
              <TabsTrigger value="estatisticas" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span className="hidden sm:inline">Estatísticas</span>
              </TabsTrigger>
              <TabsTrigger value="farmacias" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Farmácias</span>
              </TabsTrigger>
              <TabsTrigger value="administradores" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Administradores</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba de Farmácias */}
            <TabsContent value="farmacias" className="flex-1 overflow-y-auto m-0">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl">Farmácias Cadastradas</CardTitle>
                    <CardDescription className="mt-1">Gerencie todas as farmácias da plataforma</CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingFarmacia(null);
                      setIsModalOpen(true);
                    }}
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Farmácia
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      placeholder="Buscar por nome, cidade ou província..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
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
                      {filteredFarmacias.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhuma farmácia encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFarmacias.map((farmacia) => (
                          <TableRow key={farmacia.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{farmacia.nome}</TableCell>
                            <TableCell>{farmacia.cidade}</TableCell>
                            <TableCell>
                              <Badge variant={farmacia.plano === 'premium' ? 'default' : 'secondary'} className={farmacia.plano === 'premium' ? 'bg-secondary' : ''}>
                                {farmacia.plano || 'free'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={farmacia.ativa ? 'default' : 'destructive'} className={farmacia.ativa ? 'bg-secondary' : ''}>
                                {farmacia.ativa ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={farmacia.status_assinatura === 'ativa' ? 'default' : 'secondary'} className={farmacia.status_assinatura === 'ativa' ? 'bg-primary' : ''}>
                                {farmacia.status_assinatura || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingFarmacia(farmacia);
                                    setIsModalOpen(true);
                                  }}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => toggleFarmaciaStatus(farmacia.id, farmacia.ativa)}
                                  title={farmacia.ativa ? 'Desativar' : 'Ativar'}
                                >
                                  {farmacia.ativa ? (
                                    <PowerOff className="h-4 w-4" />
                                  ) : (
                                    <Power className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    toast({
                                      title: "Em breve",
                                      description: "Funcionalidade de recuperação de acesso em desenvolvimento.",
                                    });
                                  }}
                                  title="Recuperar Acesso"
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setDeletingPharmacy({ id: farmacia.id, nome: farmacia.nome })}
                                  title="Eliminar Farmácia"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            {/* Histórico de Logins das Farmácias */}
            <div className="mt-6">
              <PharmacyLoginHistory />
            </div>
          </TabsContent>

          {/* Aba de Estatísticas */}
          <TabsContent value="estatisticas" className="flex-1 overflow-y-auto m-0">
            <AdminStatistics 
              totalFarmacias={farmacias.length}
              farmaciasAtivas={farmacias.filter(f => f.ativa).length}
              farmaciasInativas={farmacias.filter(f => !f.ativa).length}
            />
          </TabsContent>

          {/* Aba de Administradores */}
          <TabsContent value="administradores" className="flex-1 overflow-y-auto m-0">
            <AdminManagers />
          </TabsContent>
          </Tabs>
        </div>
      </main>

      <AdminFarmaciaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFarmacia(null);
        }}
        onSuccess={fetchFarmacias}
        farmacia={editingFarmacia}
      />

      <DeletePharmacyDialog
        pharmacy={deletingPharmacy}
        adminEmail={user?.email || ''}
        onClose={() => setDeletingPharmacy(null)}
        onSuccess={fetchFarmacias}
      />
    </div>
  );
};

export default Admin;
