
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BarChart3, AlertTriangle, MapPin, TrendingUp, Users, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DemandAnalysisProps {
  expanded?: boolean;
}

const DemandAnalysis = ({ expanded = false }: DemandAnalysisProps) => {
  const [showAlert, setShowAlert] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
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
      description: 'Alta procura por medicamentos para diabetes'
    },
    { 
      name: 'Macuti', 
      level: 'Média', 
      color: 'bg-yellow-500',
      searches: 54,
      topMedicine: 'Paracetamol',
      patients: 15,
      description: 'Demanda equilibrada de analgésicos'
    },
    { 
      name: 'Centro', 
      level: 'Baixa', 
      color: 'bg-green-500',
      searches: 32,
      topMedicine: 'Omeprazol',
      patients: 8,
      description: 'Baixa demanda, população adulta'
    },
    { 
      name: 'Matola', 
      level: 'Alta', 
      color: 'bg-red-500',
      searches: 76,
      topMedicine: 'Amoxicilina',
      patients: 19,
      description: 'Surto de infecções respiratórias'
    },
    { 
      name: 'Sommerschield', 
      level: 'Média', 
      color: 'bg-yellow-500',
      searches: 43,
      topMedicine: 'Anti-hipertensivos',
      patients: 12,
      description: 'População idosa, medicamentos crônicos'
    },
    { 
      name: 'Polana', 
      level: 'Baixa', 
      color: 'bg-green-500',
      searches: 28,
      topMedicine: 'Vitaminas',
      patients: 7,
      description: 'Foco em suplementos e prevenção'
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

  const handleReorder = () => {
    toast({
      title: "Pedido enviado!",
      description: "Pedido #2091 enviado ao fornecedor! Tempo médio: 24h",
    });
    setShowAlert(false);
  };

  const handleRegionClick = (region: any) => {
    setSelectedRegion(region.name);
    toast({
      title: `Região: ${region.name}`,
      description: `${region.searches} buscas | Top: ${region.topMedicine} | ${region.patients} pacientes`,
    });
  };

  return (
    <div className={`space-y-6 ${!expanded ? 'h-fit' : ''}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Análise de Demanda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Demand Chart */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Top 5 Medicamentos Mais Procurados</h4>
            {demandData.slice(0, expanded ? 5 : 3).map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <div className="flex space-x-4">
                    <span className="font-medium text-green-600">✓ {item.found}</span>
                    <span className="font-medium text-red-600">✗ {item.notFound}</span>
                    <span className="font-medium">{item.searches} buscas</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000"
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

          {/* Alert Card */}
          {showAlert && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-2">
                  <p><strong>Insulina:</strong> 5 buscas não atendidas hoje! 37 buscas na última semana</p>
                  <Button 
                    size="sm" 
                    onClick={handleReorder}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Solicitar Reposição
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Heat Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2" size={16} />
            Mapa de Demanda por Região
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
            {neighborhoods.map((area) => (
              <div 
                key={area.name}
                className={`${area.color} text-white p-3 rounded cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => handleRegionClick(area)}
              >
                <div className="font-medium">{area.name}</div>
                <div className="text-xs opacity-90">{area.level}</div>
                {expanded && (
                  <div className="text-xs mt-1">
                    {area.searches} buscas
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {expanded && selectedRegion && (
            <div className="bg-blue-50 p-3 rounded-lg">
              {neighborhoods.find(n => n.name === selectedRegion) && (
                <div>
                  <h5 className="font-medium">{selectedRegion}</h5>
                  <p className="text-sm text-gray-600">
                    {neighborhoods.find(n => n.name === selectedRegion)?.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {expanded && (
        <>
          {/* Health Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2" size={16} />
                Alertas de Saúde Pública
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthAlerts.map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg ${alert.color}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{alert.type} - {alert.region}</h5>
                      <p className="text-sm">{alert.recommendation}</p>
                    </div>
                    <Badge variant={alert.priority === 'high' ? 'destructive' : 'default'}>
                      {alert.priority === 'high' ? 'Urgente' : 'Médio'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Monthly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2" size={16} />
                Comparativo Mensal - Indicações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyComparison.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{month.month}</span>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        <Users className="inline w-4 h-4 mr-1" />
                        {month.indications} indicações
                      </div>
                      <div className="text-sm text-green-600">
                        {month.conversion}% conversão
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">↗ +28%</div>
                  <div className="text-sm text-green-600">Crescimento nos últimos 6 meses</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DemandAnalysis;
