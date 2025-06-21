
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, TestTube } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => boolean;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = onLogin(email, password);
    if (!success) {
      setError('Credenciais inválidas. Tente: farmacia@exemplo.com / senha123');
    }
    setIsLoading(false);
  };

  const handleTestLogin = () => {
    setEmail('farmacia@exemplo.com');
    setPassword('senha123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-xl md:text-2xl font-bold">?</span>
          </div>
          <CardTitle className="text-xl md:text-2xl font-bold text-gray-800">Onde Tem?</CardTitle>
          <p className="text-gray-600 text-xs md:text-sm">Saúde que se encontra</p>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="farmacia@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 md:h-12 text-sm md:text-base"
                required
              />
            </div>
            <div className="space-y-2 relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 md:h-12 pr-12 text-sm md:text-base"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            {error && (
              <p className="text-red-500 text-xs md:text-sm text-center">{error}</p>
            )}
            <Button 
              type="submit" 
              className="w-full h-11 md:h-12 bg-green-500 hover:bg-green-600 text-white font-medium text-sm md:text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="w-full h-11 md:h-12 border-blue-300 text-blue-600 hover:bg-blue-50 font-medium text-sm md:text-base"
              onClick={handleTestLogin}
            >
              <TestTube size={16} className="mr-2" />
              Usar Credenciais de Teste
            </Button>
            <div className="text-center">
              <Button variant="link" className="text-blue-500 text-xs md:text-sm p-0">
                Recuperar senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
