import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LoginHistory {
  id: string;
  user_id: string;
  email: string;
  role: string;
  login_at: string;
  display_name?: string;
  user_agent?: string;
  ip_address?: string;
}

const PharmacyLoginHistory = () => {
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_login_history', { limit_count: 50 });
      if (error) throw error;
      
      // Filtrar apenas logins de farmácias
      const pharmacyLogins = (data || []).filter((log: LoginHistory) => log.role === 'farmacia');
      setLoginHistory(pharmacyLogins);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return 'Não disponível';
    
    // Extrair informações do dispositivo
    let deviceInfo = '';
    
    // Detectar modelo de celular Android
    const androidModel = userAgent.match(/\(([^)]*Android[^)]*)\)/i);
    if (androidModel) {
      const modelMatch = userAgent.match(/;\s*([^;]*?)\s*Build/i);
      if (modelMatch) {
        deviceInfo = modelMatch[1].trim();
      }
    }
    
    // Detectar iPhone/iPad
    if (userAgent.includes('iPhone')) {
      deviceInfo = 'iPhone';
    } else if (userAgent.includes('iPad')) {
      deviceInfo = 'iPad';
    }
    
    // Detectar navegador e SO para desktop
    if (!deviceInfo) {
      const osMatch = userAgent.match(/\(([^)]+)\)/);
      if (osMatch) {
        const os = osMatch[1];
        if (os.includes('Windows')) deviceInfo = 'Windows PC';
        else if (os.includes('Mac')) deviceInfo = 'Mac';
        else if (os.includes('Linux')) deviceInfo = 'Linux PC';
        else deviceInfo = os.split(';')[0].trim();
      }
    }
    
    // Detectar navegador
    let browser = '';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    
    return deviceInfo ? `${deviceInfo}${browser ? ' - ' + browser : ''}` : userAgent.substring(0, 50) + '...';
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6 text-center text-muted-foreground">
          Carregando histórico...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="bg-gradient-to-br from-muted/30 to-muted/10 border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Logins das Farmácias
        </CardTitle>
        <CardDescription className="mt-1">Últimos 50 acessos ao sistema pelas farmácias</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmácia</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Data e Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loginHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum login registrado
                  </TableCell>
                </TableRow>
              ) : (
                loginHistory.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{log.display_name || '-'}</TableCell>
                    <TableCell>{log.email}</TableCell>
                    <TableCell>
                      <span className="text-sm" title={log.user_agent || 'Não disponível'}>
                        {getDeviceInfo(log.user_agent)}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(log.login_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PharmacyLoginHistory;
