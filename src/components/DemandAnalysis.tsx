
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
  
  const demandData = [
    { name: 'Paracetamol', searches: 47, found: 42, notFound: 5 },
    { name: 'Amoxicilina', searches: 32, found: 28, notFound: 4 },
    { name: 'Omeprazol', searches: 28, found: 15, notFound: 13 },
    { name: 'Insulina', searches: 37, found: 32, notFound: 5 },
    { name: 'Dipirona', searches: 23, found: 23, notFound: 0 },
  ];

  const neighborhoods = [
    { 
      name: 'Ponta-Gêa', 
      level: 'Alta', 
      color: 'bg-red-500',
      searches: 89,
      topMedicine: 'Insulina',
      patients: 23,
      description: 'Alta procura por medicamentos para diabetes',
      detailData: {
        found: [
          { name: 'Insulina', count: 15 },
          { name: 'Metformina', count: 12 },
          { name: 'Paracetamol', count: 8 }
        ],
        notFound: [
          { name: 'Glibenclamida', count: 7 },
          { name: 'Losartana', count: 5 }
        ]
      }
    },
    { 
      name: 'Macuti', 
      level: 'Média', 
      color: 'bg-yellow-500',
      searches: 54,
      topMedicine: 'Paracetamol',
      patients: 15,
      description: 'Demanda equilibrada de analgésicos',
      detailData: {
        found: [
          { name: 'Paracetamol', count: 18 },
          { name: 'Ibuprofeno', count: 10 },
          { name: 'Dipirona', count: 8 }
        ],
        notFound: [
          { name: 'Aspirina', count: 4 },
          { name: 'Diclofenaco', count: 3 }
        ]
      }
    },
    { 
      name: 'Centro', 
      level: 'Baixa', 
      color: 'bg-green-500',
      searches: 32,
      topMedicine: 'Omeprazol',
      patients: 8,
      description: 'Baixa demanda, população adulta',
      detailData: {
        found: [
          { name: 'Omeprazol', count: 12 },
          { name: 'Pantoprazol', count: 6 },
          { name: 'Ranitidina', count: 4 }
        ],
        notFound: [
          { name: 'Esomeprazol',  count: 3 }
        ]
      }
    },
    { 
      name: 'Matola', 
      level: 'Alta', 
      color: 'bg-red-500',
      searches: 76,
      topMedicine: 'Amoxicilina',
      patients: 19,
      description: 'Surto de infecções respiratórias',
      detailData: {
        found: [
          { name: 'Amoxicilina', count: 20 },
          { name: 'Azitromicina', count: 15 },
          { name: 'Xarope', count: 10 }
        ],
        notFound: [
          { name: 'Claritromicina', count: 8 },
          { name: 'Ceftriaxona', count: 6 }
        ]
      }
    },
    { 
      name: 'Sommerschield', 
      level: 'Média', 
      color: 'bg-yellow-500',
      searches: 43,
      topMedicine: 'Anti-hipertensivos',
      patients: 12,
      description: 'População idosa, medicamentos crônicos',
      detailData: {
        found: [
          { name: 'Captopril', count: 14 },
          { name: 'Atenolol', count: 10 },
          { name: 'Hidroclorotiazida', count: 8 }
        ],
        notFound: [
          { name: 'Losartana', count: 5 },
          { name: 'Enalapril', count: 4 }
        ]
      }
    },
    { 
      name: 'Polana', 
      level: 'Baixa', 
      color: 'bg-green-500',
      searches: 28,
      topMedicine: 'Vitaminas',
      patients: 7,
      description: 'Foco em suplementos e prevenção',
      detailData: {
        found: [
          { name: 'Vitamina C', count: 10 },
          { name: 'Complexo B', count: 8 },
          { name: 'Ferro', count: 5 }
        ],
        notFound: [
          { name: 'Vitamina D', count: 3 }
        ]
      }
    }
  ];

  const healthAlerts = [
    {
      type: 'Dengue',
      region: 'Matola',
      recommendation: 'Aumentar estoque de repelentes e antitérmicos',
      priority: 'high',
      color: 'bg-red-100 text-red-800'
    },
    {
      type: 'Gripe Sazonal',
      region: 'Centro',
      recommendation: 'Estoque extra de expectorantes',
      priority: 'medium',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      type: 'Hipertensão',
      region: 'Sommerschield',
      recommendation: 'Medicamentos anti-hipertensivos em alta',
      priority: 'medium',
      color: 'bg-blue-100 text-blue-800'
    }
  ];

  const monthlyComparison = [
    { month: 'Jun', indications: 234, conversion: 78 },
    { month: 'Jul', indications: 289, conversion: 85 },
    { month: 'Ago', indications: 312, conversion: 92 },
    { month: 'Set', indications: 287, conversion: 89 },
    { month: 'Out', indications: 356, conversion: 94 },
    { month: 'Nov', indications: 423, conversion: 97 }
  ];

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
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center text-base md:text-lg">
            <BarChart3 className="mr-2 flex-shrink-0" size={18} />
            <span className="truncate">Análise de Demanda</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {/* Demand Chart */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm md:text-base">Top 5 Medicamentos Mais Procurados</h4>
            {demandData.slice(0, expanded ? 5 : 3).map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-700 truncate mr-2">{item.name}</span>
                  <div className="flex space-x-2 md:space-x-4 flex-shrink-0">
                    <span className="font-medium text-green-600">✓ {item.found}</span>
                    <span className="font-medium text-red-600">✗ {item.notFound}</span>
                    <span className="font-medium hidden sm:inline">{item.searches} buscas</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(item.searches / 50) * 100}%` }}
                  />
                </div>
                {expanded && (
                  <div className="text-xs text-gray-500">
                    Taxa de sucesso: {Math.round((item.found / item.searches) * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heat Map */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center text-base md:text-lg">
            <MapPin className="mr-2 flex-shrink-0" size={16} />
            <span className="truncate">Mapa de Demanda por Região</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 mb-4">
            {neighborhoods.map((area) => (
              <div 
                key={area.name}
                className={`${area.color} text-white p-2 md:p-3 rounded cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => handleRegionClick(area)}
              >
                <div className="font-medium text-xs md:text-sm truncate">{area.name}</div>
                <div className="text-xs opacity-90">{area.level}</div>
                <div className="text-xs mt-1">
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
                  <div key={month.month} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium text-sm">{month.month}</span>
                    <div className="flex items-center space-x-2 md:space-x-4">
                      <div className="text-xs md:text-sm">
                        <Users className="inline w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span className="hidden sm:inline">{month.indications} indicações</span>
                        <span className="sm:hidden">{month.indications}</span>
                      </div>
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
