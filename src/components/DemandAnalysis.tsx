
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, MapPin, TrendingUp, Users } from 'lucide-react';
import RegionDetailModal from '@/components/RegionDetailModal';

interface DemandAnalysisProps {
  expanded?: boolean;
}

const DemandAnalysis = ({ expanded = false }: DemandAnalysisProps) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [demandData, setDemandData] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<any[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<any[]>([]);

  const handleRegionClick = (region: any) => {
    setSelectedRegion(region.name);
    setIsModalOpen(true);
  };

  const getSelectedRegionData = () => {
    return neighborhoods.find(n => n.name === selectedRegion)?.detailData || { found: [], notFound: [] };
  };

  return (
    <div className={`space-y-4 md:space-y-6 ${!expanded ? 'h-fit' : ''}`}>
      <Card>
        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <BarChart3 className="mr-2 flex-shrink-0 h-5 w-5" />
            <span className="truncate">Análise de Demanda</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {/* Demand Chart */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Top 5 Medicamentos Mais Procurados</h4>
            {demandData.slice(0, expanded ? 5 : 3).map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 truncate mr-2">{item.name}</span>
                  <div className="flex space-x-1.5 sm:space-x-3 flex-shrink-0">
                    <span className="font-medium text-green-600">✓ {item.found}</span>
                    <span className="font-medium text-red-600">✗ {item.notFound}</span>
                    <span className="font-medium hidden sm:inline">{item.searches}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(item.searches / 50) * 100}%` }}
                  />
                </div>
                {expanded && (
                  <div className="text-[10px] text-gray-500">
                    Taxa: {Math.round((item.found / item.searches) * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heat Map */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
          <CardTitle className="flex items-center text-sm sm:text-base">
            <MapPin className="mr-2 flex-shrink-0 h-4 w-4" />
            <span className="truncate">Mapa de Demanda por Região</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 mb-3">
            {neighborhoods.map((area) => (
              <div 
                key={area.name}
                className={`${area.color} text-white p-2 rounded cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => handleRegionClick(area)}
              >
                <div className="font-medium text-[10px] sm:text-xs truncate">{area.name}</div>
                <div className="text-[9px] sm:text-xs opacity-90 truncate">{area.level}</div>
                <div className="text-[9px] sm:text-xs mt-0.5">
                  {area.searches} buscas
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {expanded && (
        <>
          {/* Health Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base md:text-lg">
                <Badge className="mr-2 bg-orange-500 flex-shrink-0">⚠️</Badge>
                <span className="truncate">Alertas de Saúde Pública</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthAlerts.map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg ${alert.color}`}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm md:text-base">{alert.type} - {alert.region}</h5>
                      <p className="text-xs md:text-sm">{alert.recommendation}</p>
                    </div>
                    <Badge variant={alert.priority === 'high' ? 'destructive' : 'default'} className="self-start flex-shrink-0">
                      {alert.priority === 'high' ? 'Urgente' : 'Médio'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Monthly Comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base md:text-lg">
                <TrendingUp className="mr-2 flex-shrink-0" size={16} />
                <span className="truncate">Comparativo Mensal - Indicações</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
              {monthlyComparison.map((month) => (
                  <div key={month.month} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 sm:p-3 bg-gray-50 rounded">
                    <span className="font-medium text-xs sm:text-sm">{month.month}</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">{month.indications} indicações</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-green-700">↗ +28%</div>
                  <div className="text-xs md:text-sm text-green-600">Crescimento nos últimos 6 meses</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <RegionDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        regionName={selectedRegion || ''}
        regionData={getSelectedRegionData()}
      />
    </div>
  );
};

export default DemandAnalysis;
