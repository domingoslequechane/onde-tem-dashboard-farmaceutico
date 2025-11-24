import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, TrendingUp, Search, MapPin, AlertCircle, CheckCircle, Store, Users } from 'lucide-react';

interface AdminStatisticsProps {
  totalFarmacias: number;
  farmaciasAtivas: number;
  farmaciasInativas: number;
}

const AdminStatistics = ({ totalFarmacias, farmaciasAtivas, farmaciasInativas }: AdminStatisticsProps) => {
  // Dados mockados - posteriormente integrar com banco de dados real
  const stats = {
    totalSearches: 12543,
    successRate: 78.5,
    errorRate: 21.5,
    topZones: [
      { name: 'Maputo', searches: 4523 },
      { name: 'Matola', searches: 3210 },
      { name: 'Beira', searches: 2456 },
      { name: 'Nampula', searches: 1354 },
      { name: 'Tete', searches: 1000 },
    ],
    recentActivity: [
      { type: 'success', query: 'Paracetamol', zone: 'Maputo', time: '2 min atrás' },
      { type: 'error', query: 'Antibiótico XYZ', zone: 'Matola', time: '5 min atrás' },
      { type: 'success', query: 'Ibuprofeno', zone: 'Beira', time: '8 min atrás' },
    ]
  };

  return (
    <div className="space-y-6">
      {/* Cards de Totais de Farmácias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Total de Farmácias</CardDescription>
              <Store className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl sm:text-4xl font-bold text-primary">{totalFarmacias}</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-br from-secondary/5 to-primary/5">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Farmácias Ativas</CardDescription>
              <Users className="h-5 w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl sm:text-4xl font-bold text-secondary">
              {farmaciasAtivas}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-br from-destructive/5 to-destructive/10">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Farmácias Inativas</CardDescription>
              <TrendingUp className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl sm:text-4xl font-bold text-destructive">
              {farmaciasInativas}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Métricas de Pesquisas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Total de Pesquisas</CardDescription>
              <Search className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-primary">{stats.totalSearches.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-br from-secondary/5 to-primary/5">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Taxa de Sucesso</CardDescription>
              <CheckCircle className="h-5 w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-secondary">{stats.successRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Buscas com resultados</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-br from-destructive/5 to-destructive/10">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Taxa de Erro</CardDescription>
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-destructive">{stats.errorRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Buscas sem resultados</p>
          </CardContent>
        </Card>
      </div>

      {/* Zonas com Mais Buscas */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Zonas com Mais Buscas</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Regiões onde os usuários mais procuram medicamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {stats.topZones.map((zone, index) => {
              const percentage = (zone.searches / stats.totalSearches) * 100;
              return (
                <div key={zone.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium text-foreground">{zone.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{zone.searches.toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Atividade Recente */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-br from-secondary/5 to-primary/5 border-b">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-secondary" />
            <CardTitle className="text-xl">Atividade Recente</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Últimas pesquisas realizadas na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  {activity.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-secondary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">"{activity.query}"</p>
                    <p className="text-sm text-muted-foreground">{activity.zone}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nota sobre integração futura */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>
              <strong>Nota:</strong> Estes dados são exemplos. Posteriormente serão integrados com dados reais do sistema.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatistics;
