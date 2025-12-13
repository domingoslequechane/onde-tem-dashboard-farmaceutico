import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Eye, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';

interface MonthlyStats {
  month: string;
  indicacoes: number;
}

const ServiceImpact = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysSearches, setTodaysSearches] = useState(0);
  const [myPharmacyImpressions, setMyPharmacyImpressions] = useState(0);
  const [monthlyReferrals, setMonthlyReferrals] = useState(0);
  const [views, setViews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [growthRate, setGrowthRate] = useState(0);
  const [farmaciaId, setFarmaciaId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      // Buscar farmácia do usuário
      const { data: farmacia } = await supabase
        .from('farmacias')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!farmacia) {
        setIsLoading(false);
        return;
      }

      setFarmaciaId(farmacia.id);

      // Data de hoje
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      // Buscas de hoje (todas as consultas)
      const { data: todaysConsultas, error: todaysError } = await supabase
        .from('consultas')
        .select('id')
        .gte('criado_em', todayStart.toISOString())
        .lte('criado_em', todayEnd.toISOString());

      if (todaysError) throw todaysError;
      setTodaysSearches(todaysConsultas?.length || 0);

      // Impressões de hoje (vezes que a farmácia apareceu)
      const { data: todaysImpressions, error: impressionsError } = await supabase
        .from('impressoes_farmacia')
        .select('id')
        .eq('farmacia_id', farmacia.id)
        .gte('criado_em', todayStart.toISOString())
        .lte('criado_em', todayEnd.toISOString());

      if (impressionsError) throw impressionsError;
      setMyPharmacyImpressions(todaysImpressions?.length || 0);

      // Indicações do mês (impressões do mês atual)
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      const { data: monthImpressions, error: monthError } = await supabase
        .from('impressoes_farmacia')
        .select('id')
        .eq('farmacia_id', farmacia.id)
        .gte('criado_em', monthStart.toISOString())
        .lte('criado_em', monthEnd.toISOString());

      if (monthError) throw monthError;
      setMonthlyReferrals(monthImpressions?.length || 0);

      // Visualizações (usar impressões como proxy por enquanto)
      setViews(monthImpressions?.length || 0);

      // Buscar dados mensais para o gráfico (últimos 6 meses)
      const monthlyStats: MonthlyStats[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);

        const { data: mImpressions } = await supabase
          .from('impressoes_farmacia')
          .select('id')
          .eq('farmacia_id', farmacia.id)
          .gte('criado_em', mStart.toISOString())
          .lte('criado_em', mEnd.toISOString());

        monthlyStats.push({
          month: format(monthDate, 'MMM', { locale: pt }),
          indicacoes: mImpressions?.length || 0
        });
      }

      setMonthlyData(monthlyStats);

      // Calcular taxa de crescimento
      if (monthlyStats.length >= 2) {
        const currentMonth = monthlyStats[monthlyStats.length - 1].indicacoes;
        const previousMonth = monthlyStats[monthlyStats.length - 2].indicacoes;
        if (previousMonth > 0) {
          setGrowthRate(Math.round(((currentMonth - previousMonth) / previousMonth) * 100));
        } else if (currentMonth > 0) {
          setGrowthRate(100);
        }
      }

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const impressionRate = todaysSearches > 0 ? Math.round((myPharmacyImpressions / todaysSearches) * 100) : 0;

  const pieData = [
    { name: 'Minhas Impressões', value: myPharmacyImpressions, color: '#10b981' },
    { name: 'Outras Farmácias', value: Math.max(0, todaysSearches - myPharmacyImpressions), color: '#e5e7eb' },
  ];

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="flex items-center text-base sm:text-lg">
          <TrendingUp className="mr-2 flex-shrink-0 h-5 w-5" />
          <span className="truncate">Resultados Onde Tem</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        {/* Today's Date */}
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xs sm:text-sm text-blue-600 font-medium">
            {currentTime.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left Column - Impressões Hoje */}
          <div className="bg-green-50 rounded-lg p-3 flex flex-col">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-green-700">
                {isLoading ? '...' : myPharmacyImpressions}
              </div>
              <div className="text-sm sm:text-base text-green-600">Impressões Hoje</div>
              <div className="text-xs sm:text-sm text-gray-500">
                {impressionRate}% de {todaysSearches} buscas totais
              </div>
            </div>
          </div>

          {/* Right Column - Visualizações + Indicações no Mês */}
          <div className="flex flex-col gap-3">
            <div className="text-center p-4 bg-purple-50 rounded-lg flex-1 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">
                {isLoading ? '...' : views}
              </div>
              <div className="text-sm sm:text-base text-purple-600">Visualizações</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg flex-1 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-700 mb-1">
                {isLoading ? '...' : monthlyReferrals}
              </div>
              <div className="text-sm sm:text-base text-blue-600">Indicações no Mês</div>
            </div>
          </div>
        </div>

        {/* Monthly Comparison Chart */}
        {monthlyData.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Indicações - Últimos 6 Meses</h4>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  width={30}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="indicacoes" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Performance Badge */}
        <div className="flex justify-center">
          <Badge className={`${growthRate >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'} px-2 py-0.5 text-xs sm:text-sm`}>
            {growthRate >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 mr-1 inline" />
                Performance Crescente (+{growthRate}%)
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 mr-1 inline" />
                Performance em Queda ({growthRate}%)
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceImpact;