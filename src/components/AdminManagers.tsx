import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, UserCog, Edit, Ban, Clock, Mail, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Admin {
  id: string;
  user_id: string;
  role: string;
  email?: string;
  display_name?: string;
  created_at?: string;
  account_status?: 'invited' | 'active' | 'blocked';
}

interface LoginHistory {
  id: string;
  user_id: string;
  email: string;
  role: string;
  login_at: string;
  display_name?: string;
}

const AdminManagers = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'super_admin'>('admin');

  useEffect(() => {
    getCurrentUser();
    fetchAdmins();
    fetchLoginHistory();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data } = await supabase.rpc('get_user_role', { _user_id: user.id });
      if (data) setCurrentUserRole(data);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const { data, error } = await supabase.rpc('get_login_history', { limit_count: 50 });
      if (error) throw error;
      setLoginHistory(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      // Usar função RPC security definer para evitar recursão RLS
      const { data: adminsData, error: adminsError } = await supabase
        .rpc('list_admins');

      if (adminsError) throw adminsError;

      setAdmins(adminsData || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar administradores",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !displayName) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-admin-invite', {
        body: {
          email: email.trim(),
          displayName: displayName.trim(),
          role: selectedRole
        }
      });

      if (error) throw error;

      toast({
        title: "Convite enviado!",
        description: `Um email de convite foi enviado para ${email}`,
        duration: 5000,
      });

      setEmail('');
      setDisplayName('');
      setSelectedRole('admin');
      setIsModalOpen(false);
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Erro ao criar administrador",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendInvite = async (admin: Admin) => {
    if (currentUserRole !== 'super_admin') {
      toast({
        title: "Sem permissão",
        description: "Apenas Super-Admins podem reenviar convites.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-admin-invite', {
        body: {
          email: admin.email,
          displayName: admin.display_name,
          role: admin.role
        }
      });

      if (error) throw error;

      toast({
        title: "Convite reenviado!",
        description: `Um novo email de convite foi enviado para ${admin.email}`,
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao reenviar convite",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setIsLoading(true);
    try {
      // Usar função security definer para atualizar
      const { error } = await supabase.rpc('update_admin_info', {
        target_user_id: selectedAdmin.user_id,
        new_display_name: displayName.trim(),
        new_role: selectedRole
      });

      if (error) throw error;

      toast({
        title: "Administrador atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      setIsEditModalOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (admin: Admin) => {
    if (currentUserRole !== 'super_admin') {
      toast({
        title: "Sem permissão",
        description: "Apenas Super-Admins podem editar administradores.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAdmin(admin);
    setDisplayName(admin.display_name || '');
    setSelectedRole(admin.role as 'admin' | 'super_admin');
    setIsEditModalOpen(true);
  };

  const openBlockDialog = (admin: Admin) => {
    if (currentUserRole !== 'super_admin') {
      toast({
        title: "Sem permissão",
        description: "Apenas Super-Admins podem bloquear administradores.",
        variant: "destructive",
      });
      return;
    }
    if (admin.user_id === currentUserId) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode bloquear a si mesmo.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAdmin(admin);
    setIsBlockDialogOpen(true);
  };

  const handleBlockUser = async () => {
    if (!selectedAdmin) return;

    setIsLoading(true);
    try {
      // Usar função security definer para bloquear
      const { error } = await supabase.rpc('block_admin', {
        target_user_id: selectedAdmin.user_id,
        block_reason: 'Bloqueado pelo administrador'
      });

      if (error) throw error;

      toast({
        title: "Usuário bloqueado",
        description: `${selectedAdmin.display_name || selectedAdmin.email} foi bloqueado.`,
      });

      setIsBlockDialogOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Erro ao bloquear",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (admin: Admin) => {
    if (currentUserRole !== 'super_admin') {
      toast({
        title: "Sem permissão",
        description: "Apenas Super-Admins podem remover administradores.",
        variant: "destructive",
      });
      return;
    }

    if (admin.user_id === currentUserId) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode remover a si mesmo.",
        variant: "destructive",
      });
      return;
    }

    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    setIsLoading(true);
    try {
      // Usar função security definer para remover
      const { error } = await supabase.rpc('delete_admin', {
        target_user_id: selectedAdmin.user_id
      });

      if (error) throw error;

      toast({
        title: "Administrador removido",
        description: "O administrador foi removido com sucesso.",
      });

      setIsDeleteDialogOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Erro ao remover administrador",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && admins.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando administradores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Administradores
              </CardTitle>
              <CardDescription className="mt-1">Gerencie outros administradores do sistema</CardDescription>
            </div>
            {currentUserRole === 'super_admin' && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 flex-1 sm:flex-initial"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Administrador
                </Button>
                <Button
                  onClick={fetchAdmins}
                  variant="outline"
                  size="icon"
                  title="Recarregar lista"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Estado da Conta</TableHead>
                  <TableHead>Adicionado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum administrador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => {
                    const getStatusBadge = (status?: string) => {
                      switch (status) {
                        case 'invited':
                          return <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">Convite</Badge>;
                        case 'active':
                          return <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">Activo</Badge>;
                        case 'blocked':
                          return <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">Bloqueado</Badge>;
                        default:
                          return <Badge variant="outline">-</Badge>;
                      }
                    };

                    return (
                      <TableRow key={admin.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{admin.display_name || '-'}</TableCell>
                        <TableCell>{admin.email || admin.user_id}</TableCell>
                        <TableCell>
                          <Badge className={admin.role === 'super_admin' ? 'bg-destructive' : 'bg-primary'}>
                            {admin.role === 'super_admin' ? 'Super-Admin' : 'Admin'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(admin.account_status)}
                        </TableCell>
                        <TableCell>
                          {admin.created_at ? format(new Date(admin.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {currentUserRole === 'super_admin' && (
                            <>
                              {admin.account_status === 'invited' && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleResendInvite(admin)}
                                  title="Reenviar Convite"
                                  disabled={isLoading}
                                >
                                  <Mail className="h-4 w-4 text-primary" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditModal(admin)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {admin.account_status !== 'blocked' ? (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openBlockDialog(admin)}
                                  title="Bloquear"
                                  disabled={admin.user_id === currentUserId}
                                >
                                  <Ban className="h-4 w-4 text-orange-500" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedAdmin(admin);
                                    setIsUnblockDialogOpen(true);
                                  }}
                                  title="Desbloquear"
                                >
                                  <Ban className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openDeleteDialog(admin)}
                                title="Remover"
                                disabled={admin.user_id === currentUserId}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {currentUserRole === 'super_admin' && (
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-br from-muted/30 to-muted/10 border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Logins
            </CardTitle>
            <CardDescription className="mt-1">Últimos 50 acessos ao sistema</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Data e Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum login registrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    loginHistory.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{log.display_name || '-'}</TableCell>
                        <TableCell>{log.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={log.role === 'super_admin' ? 'border-destructive text-destructive' : ''}>
                            {log.role === 'super_admin' ? 'Super-Admin' : log.role === 'admin' ? 'Admin' : 'Farmácia'}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(log.login_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Administrador</DialogTitle>
            <DialogDescription>
              Crie uma conta de administrador para outro usuário
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Nome do Administrador *</Label>
              <Input
                id="admin-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email">Email *</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-role">Tipo de Usuário *</Label>
              <Select value={selectedRole} onValueChange={(value: 'admin' | 'super_admin') => setSelectedRole(value)}>
                <SelectTrigger id="admin-role" className="bg-background">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super-Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              Um email de convite será enviado para o endereço informado
            </p>

            <div className="flex gap-3 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando convite...' : 'Enviar Convite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Administrador</DialogTitle>
            <DialogDescription>
              Atualize as informações do administrador
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Administrador *</Label>
              <Input
                id="edit-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Tipo de Usuário *</Label>
              <Select value={selectedRole} onValueChange={(value: 'admin' | 'super_admin') => setSelectedRole(value)}>
                <SelectTrigger id="edit-role" className="bg-background">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super-Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear Administrador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja bloquear {selectedAdmin?.display_name || selectedAdmin?.email}? 
              Este usuário não poderá mais acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isUnblockDialogOpen} onOpenChange={setIsUnblockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear Administrador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desbloquear {selectedAdmin?.display_name || selectedAdmin?.email}? 
              Este usuário poderá acessar o sistema novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selectedAdmin) return;
                setIsLoading(true);
                try {
                  const { error } = await supabase.rpc('unblock_admin', {
                    target_user_id: selectedAdmin.user_id
                  });
                  if (error) throw error;
                  toast({
                    title: "Usuário desbloqueado",
                    description: `${selectedAdmin.display_name || selectedAdmin.email} foi desbloqueado.`,
                  });
                  setIsUnblockDialogOpen(false);
                  setSelectedAdmin(null);
                  fetchAdmins();
                } catch (error: any) {
                  toast({
                    title: "Erro ao desbloquear",
                    description: error.message,
                    variant: "destructive",
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Desbloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Administrador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {selectedAdmin?.display_name || selectedAdmin?.email}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminManagers;
