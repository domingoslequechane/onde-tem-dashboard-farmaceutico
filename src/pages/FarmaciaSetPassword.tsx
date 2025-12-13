import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.string().min(8, 'A senha deve ter no mínimo 8 caracteres');

const FarmaciaSetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Link inválido ou expirado",
          description: "Por favor, solicite um novo convite ao administrador.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      setIsValidating(false);
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível validar o link. Tente novamente.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar senha
    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Senha inválida",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "Por favor, certifique-se de que as senhas são idênticas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user }, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Atualizar o status da conta para 'active' após definir senha
      if (user) {
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ account_status: 'active' })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Erro ao atualizar status:', updateError);
        }
      }

      toast({
        title: "Senha definida com sucesso!",
        description: "Você será redirecionado para completar as informações da farmácia.",
      });

      // Redirecionar para o dashboard de configurações
      setTimeout(() => {
        navigate('/farmacia/configuracoes');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao definir senha:', error);
      toast({
        title: "Erro ao definir senha",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Validando convite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Definir Senha</CardTitle>
          <CardDescription>
            Crie uma senha segura para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Definindo senha...' : 'Definir Senha e Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmaciaSetPassword;
