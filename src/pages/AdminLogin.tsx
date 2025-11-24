import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ondeTemLogo from '@/assets/onde-tem-logo.png';
import networkIllustration from '@/assets/pharmacy-network-illustration.png';
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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  

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

      // Verificar se o usuário é admin usando a função security definer
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: data.user.id });

      if (roleError) throw roleError;

      if (!roleData || (roleData !== 'admin' && roleData !== 'super_admin')) {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Você não possui privilégios de administrador.');
      }

      // Registrar login no histórico
      await supabase.rpc('log_user_login');

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

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });

      setIsRecoveryMode(false);
      setRecoveryEmail('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o email de recuperação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="mb-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <img 
                src={ondeTemLogo} 
                alt="Onde Tem?" 
                className="h-12" 
              />
            </div>
            <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
              <Shield className="h-6 w-6 text-destructive" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {isRecoveryMode ? 'Recuperar Senha' : 'Painel Administrativo'}
              </h1>
            </div>
            <p className="text-base md:text-sm text-muted-foreground">
              {isRecoveryMode ? 'Digite seu email para recuperar o acesso' : 'Acesso restrito aos administradores'}
            </p>
          </div>

          {/* Form */}
          {isRecoveryMode ? (
            <form onSubmit={handlePasswordRecovery} className="space-y-4">
              <div className="space-y-2">
                <label className="text-base font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@ondetem.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </div>
                ) : (
                  "Enviar Email"
                )}
              </Button>

              <div className="space-y-2 pt-1 text-center md:text-left">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-base md:text-sm underline-offset-4 hover:underline transition-colors"
                  onClick={() => setIsRecoveryMode(false)}
                >
                  Voltar ao Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-base font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@ondetem.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-base font-medium text-foreground">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-12"
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

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verificando...
                  </div>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Acessar Painel
                  </>
                )}
              </Button>
              
              <div className="space-y-2 pt-1 text-center md:text-left">
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 text-base md:text-sm underline-offset-4 hover:underline transition-colors block w-full md:w-auto"
                  onClick={() => setIsRecoveryMode(true)}
                >
                  Esqueceu sua senha?
                </button>
                <button 
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-base md:text-sm underline-offset-4 hover:underline transition-colors block w-full md:w-auto"
                  onClick={() => navigate('/auth')}
                >
                  Voltar para login de farmácia
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <p className="text-center md:text-left text-xs text-muted-foreground mt-6">
            © 2025 Onde Tem? - Painel Administrativo
          </p>
        </div>
      </div>

      {/* Right Side - Illustration with destructive theme */}
      <div 
        className="hidden md:flex md:w-1/2 items-center justify-center p-12 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${networkIllustration})` }}
      >
        {/* Dark overlay with destructive color */}
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/90 via-destructive/85 to-destructive-dark/90"></div>
        
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
              <Shield className="h-16 w-16 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Painel Administrativo
          </h2>
          <p className="text-white/90 text-lg max-w-md mx-auto">
            Gerencie toda a rede de farmácias, monitore estatísticas e configure o sistema com segurança.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
