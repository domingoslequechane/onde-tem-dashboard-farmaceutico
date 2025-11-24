
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

  const [todaysSearches, setTodaysSearches] = useState(0);
  const [myPharmacyImpressions, setMyPharmacyImpressions] = useState(0);
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
            <div className="text-lg sm:text-xl font-bold text-blue-700 mb-0.5">0</div>
            <div className="text-xs sm:text-sm text-blue-600">Indicações no Mês</div>
          </div>
          
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg sm:text-xl font-bold text-purple-700 mb-0.5">0</div>
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
