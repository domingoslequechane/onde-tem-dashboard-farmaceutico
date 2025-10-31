import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, TestTube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import pharmacyBg from '@/assets/pharmacy-login-bg.jpg';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmaciaName, setFarmaciaName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
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
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              farmacia_name: farmaciaName,
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar sua conta.",
        });
      }
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

  const handleTestLogin = (role: 'farmacia' | 'admin') => {
    if (role === 'farmacia') {
      setEmail('farmacia@exemplo.com');
      setPassword('senha123');
    } else {
      setEmail('admin@ondetem.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
      <Card className="w-full max-w-sm sm:max-w-md shadow-2xl border-0 mx-4 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2 px-4 sm:px-6">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <span className="text-white text-xl sm:text-2xl font-bold">?</span>
          </div>
          <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
            {isLogin ? 'Login - Onde Tem?' : 'Cadastro - Onde Tem?'}
          </CardTitle>
          <p className="text-gray-600 text-xs sm:text-sm">Saúde que se encontra</p>
        </CardHeader>
        <CardContent className="px-4 sm:px-4 md:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Nome da Farmácia"
                  value={farmaciaName}
                  onChange={(e) => setFarmaciaName(e.target.value)}
                  className="h-10 sm:h-11 md:h-12 text-sm sm:text-base"
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="farmacia@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 sm:h-11 md:h-12 text-sm sm:text-base"
                required
              />
            </div>
            <div className="space-y-2 relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 sm:h-11 md:h-12 pr-10 sm:pr-12 text-sm sm:text-base"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </div>
            <Button 
              type="submit" 
              className="w-full h-10 sm:h-11 md:h-12 bg-green-500 hover:bg-green-600 text-white font-medium text-sm sm:text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </Button>
            
            {isLogin && (
              <>
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full h-10 sm:h-11 md:h-12 border-blue-300 text-blue-600 hover:bg-blue-50 font-medium text-sm sm:text-base"
                  onClick={() => handleTestLogin('farmacia')}
                >
                  <TestTube size={14} className="mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate whitespace-nowrap">Teste - Farmácia</span>
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full h-10 sm:h-11 md:h-12 border-purple-300 text-purple-600 hover:bg-purple-50 font-medium text-sm sm:text-base"
                  onClick={() => handleTestLogin('admin')}
                >
                  <TestTube size={14} className="mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate whitespace-nowrap">Teste - Admin</span>
                </Button>
              </>
            )}
            
            <div className="text-center space-y-2">
              <Button 
                type="button"
                variant="link" 
                className="text-gray-600 text-xs sm:text-sm p-0"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
              </Button>
              {isLogin && (
                <Button variant="link" className="text-blue-500 text-xs sm:text-sm p-0 block w-full">
                  Recuperar senha
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
