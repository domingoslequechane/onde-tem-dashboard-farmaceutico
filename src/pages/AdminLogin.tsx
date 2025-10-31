import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ondeTemLogo from '@/assets/onde-tem-logo.png';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se o usuário é admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roleData || roleData.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Você não possui privilégios de administrador.');
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao painel administrativo.",
      });
      
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas ou sem permissão de admin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Falha ao criar usuário');

      // Usar upsert para evitar erro de duplicação
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: data.user.id,
          role: 'admin'
        }, {
          onConflict: 'user_id,role'
        });

      if (roleError) throw roleError;

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      });
      
      setShowSignup(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-destructive/10">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-2xl overflow-hidden backdrop-blur-sm bg-card/95">
          <div className="bg-gradient-to-br from-destructive to-destructive/80 p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {showForgotPassword ? 'Recuperar Senha Admin' : showSignup ? 'Criar Conta Admin' : 'Painel Administrativo'}
            </h1>
            <p className="text-destructive-foreground/90 text-sm">
              {showForgotPassword ? 'Digite seu email para recuperar o acesso' : showSignup ? 'Crie uma nova conta de administrador' : 'Acesso restrito aos administradores do sistema'}
            </p>
          </div>

          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex justify-center">
              <img 
                src={ondeTemLogo} 
                alt="Onde Tem?" 
                className="h-16 w-auto object-contain" 
              />
            </div>

            <form onSubmit={showForgotPassword ? handleForgotPassword : showSignup ? handleSignup : handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email do Administrador
                </label>
                <Input
                  type="email"
                  placeholder="admin@ondetem.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              
              {!showForgotPassword && (
                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-foreground">
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-12"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-muted"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-base shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {showForgotPassword ? 'Enviando...' : showSignup ? 'Criando...' : 'Verificando...'}
                  </div>
                ) : showForgotPassword ? (
                  'Enviar Email'
                ) : showSignup ? (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Criar Conta Admin
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Acessar Painel Admin
                  </>
                )}
              </Button>
              
              <div className="text-center space-y-3">
                {!showForgotPassword && !showSignup ? (
                  <>
                    <Button 
                      type="button"
                      variant="link" 
                      className="text-primary hover:text-primary-dark text-sm p-0 block w-full"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Esqueceu sua senha?
                    </Button>
                    <Button 
                      type="button"
                      variant="link" 
                      className="text-primary hover:text-primary-dark text-sm p-0 block w-full"
                      onClick={() => setShowSignup(true)}
                    >
                      Criar conta de administrador
                    </Button>
                    <Button 
                      type="button"
                      variant="link" 
                      className="text-muted-foreground hover:text-foreground text-sm p-0"
                      onClick={() => navigate('/auth')}
                    >
                      Voltar para login de farmácia
                    </Button>
                  </>
                ) : (
                  <Button 
                    type="button"
                    variant="link" 
                    className="text-muted-foreground hover:text-foreground text-sm p-0"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setShowSignup(false);
                    }}
                  >
                    Voltar para login
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 Onde Tem? - Painel Administrativo
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
