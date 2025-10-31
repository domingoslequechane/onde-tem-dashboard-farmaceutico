import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ondeTemLogo from '@/assets/onde-tem-logo.png';

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-2xl overflow-hidden backdrop-blur-sm bg-card/95">
          <div className="bg-gradient-to-br from-primary to-primary-light p-8 text-center">
            <img 
              src={ondeTemLogo} 
              alt="Onde Tem?" 
              className="h-24 sm:h-28 w-auto mx-auto mb-4 drop-shadow-lg" 
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {showForgotPassword ? 'Recuperar Senha' : 'Bem-vindo de volta!'}
            </h1>
            <p className="text-primary-foreground/90 text-sm">
              {showForgotPassword ? 'Digite seu email para recuperar o acesso' : 'Entre para gerenciar sua farmácia'}
            </p>
          </div>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
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
                className="w-full h-12 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white font-semibold text-base shadow-lg"
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
              
              <div className="text-center space-y-3 pt-2">
                {!showForgotPassword ? (
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
                      className="text-destructive hover:text-destructive/90 text-sm p-0 block w-full font-medium"
                      onClick={() => navigate('/admin/login')}
                    >
                      Acesso Administrativo
                    </Button>
                  </>
                ) : (
                  <Button 
                    type="button"
                    variant="link" 
                    className="text-muted-foreground hover:text-foreground text-sm p-0"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Voltar para login
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 Onde Tem? - Saúde que se encontra
        </p>
      </div>
    </div>
  );
};

export default Auth;
