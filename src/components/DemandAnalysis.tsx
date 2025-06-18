
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, AlertTriangle, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DemandAnalysis = () => {
  const [showAlert, setShowAlert] = useState(true);
  
  const demandData = [
    { name: 'Paracetamol', searches: 47 },
    { name: 'Amoxicilina', searches: 32 },
    { name: 'Omeprazol', searches: 28 },
    { name: 'Insulina', searches: 37 },
  ];

  const neighborhoods = [
    { name: 'Ponta-Gêa', level: 'Alta', color: 'bg-red-500' },
    { name: 'Macuti', level: 'Média', color: 'bg-yellow-500' },
    { name: 'Centro', level: 'Baixa', color: 'bg-green-500' },
    { name: 'Matola', level: 'Alta', color: 'bg-red-500' },
  ];

  const handleReorder = () => {
    toast({
      title: "Pedido enviado!",
      description: "Pedido #2091 enviado ao fornecedor! Tempo médio: 24h",
    });
    setShowAlert(false);
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2" size={20} />
          Oportunidades Comerciais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demand Chart */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Medicamentos Mais Buscados</h4>
          {demandData.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-medium">{item.searches} buscas</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(item.searches / 50) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Alert Card */}
        {showAlert && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p><strong>Insulina:</strong> apenas 5 unidades! 37 buscas na última semana</p>
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

        {/* Heat Map */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center">
            <MapPin className="mr-2" size={16} />
            Mapa de Demanda por Bairro
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {neighborhoods.map((area) => (
              <div 
                key={area.name}
                className={`${area.color} text-white p-2 rounded text-center text-sm font-medium`}
              >
                <div>{area.name}</div>
                <div className="text-xs opacity-90">{area.level}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemandAnalysis;
