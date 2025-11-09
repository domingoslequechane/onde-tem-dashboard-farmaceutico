import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Shield, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ondeTemLogo from '@/assets/onde-tem-logo.png';
import { z } from 'zod';

const adminAuthSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  password: z.string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .max(72, 'A senha deve ter no máximo 72 caracteres')
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar inputs
      const validatedData = adminAuthSchema.parse({ email: email.trim(), password });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
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
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro no login",
          description: error.message || "Credenciais inválidas ou sem permissão de admin.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar email
      const emailSchema = z.string().trim().email('Email inválido');
      const validatedEmail = emailSchema.parse(email.trim());

      const { error } = await supabase.auth.resetPasswordForEmail(validatedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    setIsCheckingHealth(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('health-check');
      
      if (error) throw error;
      
      const healthData = data as {
        status: string;
        checks: {
          env_vars: boolean;
          database: boolean;
          auth: boolean;
        };
        message: string;
      };
      
      if (healthData.status === 'healthy') {
        toast({
          title: "✅ Conexão OK",
          description: "Todos os serviços estão operacionais. Você pode criar sua conta.",
        });
      } else {
        const issues = [];
        if (!healthData.checks.env_vars) issues.push('Variáveis de ambiente');
        if (!healthData.checks.database) issues.push('Banco de dados');
        if (!healthData.checks.auth) issues.push('Autenticação');
        
        toast({
          title: "⚠️ Problemas detectados",
          description: `Sistemas com problemas: ${issues.join(', ')}. Configure as URLs no Supabase.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Erro de Conectividade",
        description: "Não foi possível conectar ao Supabase. Verifique se as URLs de redirecionamento estão configuradas no dashboard do Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar inputs
      const validatedData = adminAuthSchema.parse({ email: email.trim(), password });

      console.log('Tentando criar conta admin...', { email: validatedData.email });

      // Primeiro verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', (await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: 'invalid-check-only'
        })).data?.user?.id || 'none')
        .maybeSingle();

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            is_admin: 'true'
          }
        }
      });

      console.log('Resposta do signup:', { data, error });

      if (error) {
        console.error('Erro no signup:', error);
        throw error;
      }
      
      if (!data.user) {
        console.error('Usuário não foi criado');
        throw new Error('Falha ao criar usuário');
      }

      console.log('Conta criada com sucesso:', data.user.id);

      toast({
        title: "Conta admin criada!",
        description: data.user.identities?.length === 0 
          ? "Verifique seu email para confirmar a conta antes de fazer login." 
          : "Login realizado com sucesso!",
      });
      
      // Se o usuário já foi confirmado automaticamente, redirecionar
      if (data.session) {
        navigate('/admin');
      } else {
        toast({
          title: "Confirme seu email",
          description: "Enviamos um email de confirmação. Verifique sua caixa de entrada.",
        });
      }
    } catch (error: any) {
      console.error('Erro completo no signup:', error);
      
      let errorMessage = "Ocorreu um erro. Tente novamente.";
      let errorTitle = "Erro ao criar conta";
      
      if (error instanceof z.ZodError) {
        errorMessage = error.errors[0].message;
      } else if (error.name === 'AuthApiError' && error.status === 422) {
        errorTitle = "Email já cadastrado";
        errorMessage = "Este email já possui uma conta. Use outro email ou faça login.";
      } else if (error.message?.includes('User already registered')) {
        errorTitle = "Email já cadastrado";
        errorMessage = "Este email já está registrado. Use outro email para criar conta admin.";
      } else if (error.message?.includes('Unable to validate email')) {
        errorMessage = "Email inválido. Verifique o formato do email.";
      } else if (error.message?.includes('Password should be')) {
        errorMessage = "A senha deve ter no mínimo 8 caracteres.";
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || !error.message) {
        errorTitle = "Email já cadastrado";
        errorMessage = "Este email já possui uma conta. Use um email diferente para criar uma nova conta admin.";
      } else if (error.status === 429) {
        errorTitle = "Muitas tentativas";
        errorMessage = "Aguarde alguns minutos antes de tentar novamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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

              {showSignup && (
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-12 border-2 border-primary/20 hover:border-primary/40"
                  onClick={handleHealthCheck}
                  disabled={isCheckingHealth}
                >
                  {isCheckingHealth ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Verificando...
                    </div>
                  ) : (
                    <>
                      <Activity className="mr-2 h-5 w-5" />
                      Testar Conectividade
                    </>
                  )}
                </Button>
              )}
              
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
