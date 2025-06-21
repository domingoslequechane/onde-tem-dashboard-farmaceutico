
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Search } from 'lucide-react';

const ServiceImpact = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const todaysSearches = 289;
  const myPharmacyImpressions = 74;
  const impressionRate = Math.round((myPharmacyImpressions / todaysSearches) * 100);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center text-base md:text-lg">
          <TrendingUp className="mr-2 flex-shrink-0" size={18} />
          <span className="truncate">Resultados Onde Tem</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        {/* Today's Date */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-xs md:text-sm text-blue-600 font-medium">
            {currentTime.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Daily Impressions */}
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center p-4 md:p-6 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Eye className="text-green-600 mr-2" size={20} />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-green-700 mb-1">{myPharmacyImpressions}</div>
            <div className="text-xs md:text-sm text-green-600 mb-2">Impressões Hoje</div>
            <div className="text-xs text-gray-500">
              de {todaysSearches} buscas totais ({impressionRate}%)
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg md:text-xl font-bold text-blue-700 mb-1">94</div>
            <div className="text-xs text-blue-600">Indicações no Mês</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg md:text-xl font-bold text-purple-700 mb-1">2.4k</div>
            <div className="text-xs text-purple-600">Visualizações</div>
          </div>
        </div>

        {/* Performance Badge */}
        <div className="flex justify-center">
          <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1 text-xs">
            📈 Performance Crescente
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceImpact;
