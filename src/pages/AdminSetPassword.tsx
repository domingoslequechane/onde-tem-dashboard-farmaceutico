import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import ondeLogo from '@/assets/ondtem-logo.png';

const AdminSetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // O Supabase processa automaticamente os tokens de recovery da URL
      // Aguardar um pouco mais para garantir que o processamento foi concluído
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.error('Erro na sessão:', error);
        toast({
          title: "Link inválido ou expirado",
          description: "Este link de convite é inválido ou expirou. Solicite um novo convite ao administrador.",
          variant: "destructive",
        });
        navigate('/admin/login');
        return;
      }

      console.log('Sessão válida:', session.user.email);
      setIsValidating(false);
    } catch (error: any) {
      console.error('Erro ao validar sessão:', error);
      toast({
        title: "Erro ao validar convite",
        description: "Ocorreu um erro ao validar o convite. Tente novamente.",
        variant: "destructive",
      });
      navigate('/admin/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Registrar o login após definir a senha
      await supabase.rpc('log_user_login');

      toast({
        title: "Senha definida!",
        description: "Sua senha foi criada com sucesso. Você será redirecionado para o painel.",
      });

      // Aguardar um momento antes de redirecionar
      setTimeout(() => {
        navigate('/admin/estatisticas');
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Erro ao definir senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md mx-4 shadow-2xl border-none">
          <CardContent className="pt-12 pb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
              <p className="text-muted-foreground">Validando convite...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 pb-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex justify-center mb-2">
            <img 
              src={ondeLogo} 
              alt="ONDTem Logo" 
              className="h-12 w-auto"
            />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">Defina sua Senha</CardTitle>
            <CardDescription className="mt-2">
              Crie uma senha segura para acessar o painel administrativo
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Nova Senha *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Mínimo de 8 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Confirmar Senha *
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente sua senha"
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando senha...
                </>
              ) : (
                'Criar Senha e Acessar Painel'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetPassword;
