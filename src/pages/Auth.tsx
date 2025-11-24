import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ondeTemLogo from '@/assets/onde-tem-logo.png';
import networkIllustration from '@/assets/pharmacy-network-illustration.png';

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });
      navigate('/');
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/farmacia/reset-password`,
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

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo and Brand */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={ondeTemLogo} 
                alt="Onde Tem?" 
                className="h-8" 
              />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              {showForgotPassword ? 'Recuperar Senha' : 'Bem-vindo de volta!'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {showForgotPassword ? 'Digite seu email para recuperar o acesso' : 'Entre para gerenciar sua farmácia'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>
            
            {!showForgotPassword && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
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
            )}

            <Button 
              type="submit" 
              className="w-full h-11 text-sm font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Aguarde...
                </div>
              ) : (
                showForgotPassword ? 'Enviar Email' : 'Entrar'
              )}
            </Button>
            
            <div className="space-y-2 pt-1">
              {!showForgotPassword ? (
                <>
                  <button 
                    type="button"
                    className="text-primary hover:text-primary/80 text-sm underline-offset-4 hover:underline transition-colors block"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Esqueceu sua senha?
                  </button>
                  <button 
                    type="button"
                    className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline transition-colors block"
                    onClick={() => navigate('/admin/login')}
                  >
                    Acesso Administrativo
                  </button>
                </>
              ) : (
                <button 
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline transition-colors"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Voltar para login
                </button>
              )}
            </div>
          </form>

          {/* Footer */}
          <p className="text-xs text-muted-foreground mt-6">
            © 2025 Onde Tem? - Saúde que se encontra
          </p>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div 
        className="hidden md:flex md:w-1/2 items-center justify-center p-12 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${networkIllustration})` }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/85 to-primary-dark/90"></div>
        
        <div className="relative z-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Conectando Farmácias e Clientes
          </h2>
          <p className="text-white/90 text-lg max-w-md mx-auto">
            Uma rede inteligente que aproxima farmácias dos seus clientes, garantindo saúde e bem-estar para todos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
