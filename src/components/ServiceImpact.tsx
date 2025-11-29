
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const ServiceImpact = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysSearches, setTodaysSearches] = useState(0);
  const [myPharmacyImpressions, setMyPharmacyImpressions] = useState(0);
  const [monthlyReferrals, setMonthlyReferrals] = useState(0);
  const [views, setViews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
      // Mock data for demonstration
      const mockTodaysSearches = 247;
      const mockMyPharmacyImpressions = 89;
      const mockMonthlyReferrals = 1840;
      const mockViews = 342;

      setTodaysSearches(mockTodaysSearches);
      setMyPharmacyImpressions(mockMyPharmacyImpressions);
      setMonthlyReferrals(mockMonthlyReferrals);
      setViews(mockViews);

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

        {/* Pie Chart */}
        <div className="bg-green-50 rounded-lg p-3">
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
            <div className="text-2xl sm:text-3xl font-bold text-green-700">{myPharmacyImpressions}</div>
            <div className="text-sm sm:text-base text-green-600">Impressões Hoje</div>
            <div className="text-xs sm:text-sm text-gray-500">
              {impressionRate}% de {todaysSearches} buscas totais
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg sm:text-xl font-bold text-blue-700 mb-0.5">
              {isLoading ? '...' : monthlyReferrals}
            </div>
            <div className="text-xs sm:text-sm text-blue-600">Indicações no Mês</div>
          </div>
          
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg sm:text-xl font-bold text-purple-700 mb-0.5">
              {isLoading ? '...' : views}
            </div>
            <div className="text-xs sm:text-sm text-purple-600">Visualizações</div>
          </div>
        </div>

        {/* Performance Badge */}
        <div className="flex justify-center">
          <Badge className="bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs sm:text-sm">
            📈 Performance Crescente
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceImpact;
