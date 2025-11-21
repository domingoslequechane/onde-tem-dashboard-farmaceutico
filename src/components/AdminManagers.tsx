import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Copy, RefreshCw, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Admin {
  id: string;
  user_id: string;
  role: string;
  email?: string;
}

const AdminManagers = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .eq('role', 'admin')
        .order('user_id', { ascending: false });

      if (rolesError) throw rolesError;

      // Get emails from auth.users
      const { data, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      // Map user_id to email
      const adminsWithEmails: Admin[] = (rolesData || []).map((admin: any) => {
        const user = data.users?.find((u: any) => u.id === admin.user_id);
        return {
          id: admin.id,
          user_id: admin.user_id,
          role: admin.role,
          email: user?.email || admin.user_id
        };
      });

      setAdmins(adminsWithEmails);
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: "Senha copiada!",
      description: "A senha foi copiada para a área de transferência.",
    });
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !generatedPassword) {
      toast({
        title: "Dados incompletos",
        description: "Preencha o email e gere uma senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Criar conta de usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: generatedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/reset-password`,
          data: {
            email: email.trim()
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // Adicionar role de admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: authData.user.id, role: 'admin' }]);

      if (roleError) throw roleError;

      toast({
        title: "Administrador criado!",
        description: `Email: ${email}. Senha: ${generatedPassword}`,
        duration: 10000,
      });

      setEmail('');
      setGeneratedPassword('');
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

  const handleDeleteAdmin = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover este administrador?')) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Administrador removido",
        description: "O administrador foi removido com sucesso.",
      });

      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Erro ao remover administrador",
        description: error.message,
        variant: "destructive",
      });
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
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Administrador
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Nenhum administrador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{admin.email || admin.user_id}</TableCell>
                      <TableCell>
                        <Badge className="bg-primary">Administrador</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteAdmin(admin.user_id)}
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
              <Label htmlFor="admin-senha">Senha Automática *</Label>
              <div className="flex gap-2">
                <Input
                  id="admin-senha"
                  type="text"
                  value={generatedPassword}
                  readOnly
                  placeholder="Clique para gerar"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generatePassword}
                  title="Gerar nova senha"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {generatedPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyPassword}
                    title="Copiar senha"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

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
                {isLoading ? 'Criando...' : 'Criar Administrador'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagers;
