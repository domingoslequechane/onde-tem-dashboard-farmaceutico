
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Search } from 'lucide-react';
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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: farmaciaData } = await supabase
        .from('farmacias')
        .select('id')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (!farmaciaData) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Total searches today
      const { count: totalSearches } = await supabase
        .from('consultas')
        .select('*', { count: 'exact', head: true })
        .gte('criado_em', todayISO);

      setTodaysSearches(totalSearches || 0);

      // Impressions for this pharmacy today (via estoque matches)
      const { data: estoqueData } = await supabase
        .from('estoque')
        .select('medicamento_id')
        .eq('farmacia_id', farmaciaData.id)
        .eq('disponivel', true);

      const medicamentoIds = estoqueData?.map(e => e.medicamento_id) || [];

      if (medicamentoIds.length > 0) {
        const { data: medicamentos } = await supabase
          .from('medicamentos')
          .select('nome')
          .in('id', medicamentoIds);

        const medicamentoNames = medicamentos?.map(m => m.nome.toLowerCase()) || [];

        const { count: impressions } = await supabase
          .from('consultas')
          .select('*', { count: 'exact', head: true })
          .gte('criado_em', todayISO)
          .ilike('medicamento_buscado', `%${medicamentoNames.join('%')}%`);

        setMyPharmacyImpressions(impressions || 0);
      }

      // Monthly referrals
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const { count: monthlyCount } = await supabase
        .from('consultas')
        .select('*', { count: 'exact', head: true })
        .gte('criado_em', firstDayOfMonth.toISOString());

      setMonthlyReferrals(monthlyCount || 0);

      // Views (reviews count as proxy)
      const { count: reviewsCount } = await supabase
        .from('avaliacoes')
        .select('*', { count: 'exact', head: true })
        .eq('farmacia_id', farmaciaData.id);

      setViews(reviewsCount || 0);

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const impressionRate = todaysSearches > 0 ? Math.round((myPharmacyImpressions / todaysSearches) * 100) : 0;

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

        {/* Daily Impressions */}
        <div className="grid grid-cols-1 gap-3">
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Eye className="text-green-600 mr-1 h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-green-700 mb-1">{myPharmacyImpressions}</div>
            <div className="text-sm sm:text-base text-green-600 mb-1">Impressões Hoje</div>
            <div className="text-xs sm:text-sm text-gray-500 px-1">
              de {todaysSearches} buscas totais ({impressionRate}%)
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
