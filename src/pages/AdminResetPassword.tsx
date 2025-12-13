import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Eye, EyeOff, KeyRound, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ondeTemLogo from '@/assets/ondtem-logo.svg';

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      // Handle the hash fragment from the recovery link
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'recovery') {
        // Set the session with the tokens from the URL
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (!error) {
          setValidSession(true);
          // Clean the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          toast({
            title: "Sessão inválida",
            description: "Link de recuperação inválido ou expirado.",
            variant: "destructive",
          });
          navigate('/admin/entrar');
        }
      } else {
        // Check existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setValidSession(true);
        } else {
          toast({
            title: "Sessão inválida",
            description: "Link de recuperação inválido ou expirado.",
            variant: "destructive",
          });
          navigate('/admin/entrar');
        }
      }
      setIsChecking(false);
    };

    checkSession();
  }, [navigate]);

  const isPasswordStrong = (pwd: string): boolean => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordStrong(password)) {
      toast({
        title: "Senha fraca",
        description: "A senha deve conter letras maiúsculas, minúsculas e números.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setShowSuccessModal(true);
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

  const handleSuccessClose = async () => {
    await supabase.auth.signOut();
    navigate('/admin/entrar');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-secondary/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-destructive"></div>
      </div>
    );
  }

  if (!validSession) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-destructive/10 via-background to-secondary/10">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-2xl overflow-hidden backdrop-blur-sm bg-card/95">
          <div className="bg-gradient-to-br from-destructive to-destructive/80 p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Redefinir Senha - Admin
            </h1>
            <p className="text-white/90 text-sm">
              Digite sua nova senha de administrador
            </p>
          </div>

          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex justify-center">
              <img 
                src={ondeTemLogo} 
                alt="ONDTem" 
                className="h-16 w-auto object-contain" 
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-foreground">
                  Nova Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-12"
                    required
                    minLength={8}
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
                <p className="text-xs text-muted-foreground">
                  Use letras maiúsculas, minúsculas e números
                </p>
              </div>

              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-foreground">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pr-12"
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-muted"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-white font-semibold text-base shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Redefinindo...
                  </div>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-5 w-5" />
                    Redefinir Senha
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 ONDTem - Painel Administrativo
        </p>
      </div>

      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <CheckCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Senha Redefinida!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Sua senha foi atualizada com sucesso. Você será redirecionado para a página de login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <Button onClick={handleSuccessClose} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90">
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminResetPassword;
