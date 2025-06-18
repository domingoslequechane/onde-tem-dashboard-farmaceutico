
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, TrendingUp } from 'lucide-react';

const ServiceImpact = () => {
  const [indicationsCount, setIndicationsCount] = useState(0);
  
  // Animated counter
  useEffect(() => {
    const target = 423;
    const increment = target / 100;
    const timer = setInterval(() => {
      setIndicationsCount(prev => {
        if (prev >= target) {
          clearInterval(timer);
          return target;
        }
        return Math.min(prev + increment, target);
      });
    }, 20);

    return () => clearInterval(timer);
  }, []);

  const generateReport = () => {
    // Simulate PDF generation
    const reportContent = `
      RELATÓRIO ONDE TEM - FARMÁCIA CENTRAL
      =====================================
      
      Período: ${new Date().toLocaleDateString('pt-BR')}
      
      RESUMO EXECUTIVO:
      • Indicações realizadas: 423
      • Medicamentos monitorados: 15
      • Impressões de hoje: 74
      • Buscas totais hoje: 289
      
      MEDICAMENTOS MAIS PROCURADOS:
      1. Paracetamol - 47 buscas
      2. Insulina - 37 buscas  
      3. Amoxicilina - 32 buscas
      4. Omeprazol - 28 buscas
      
      IMPACTO DO SERVIÇO:
      • +28% crescimento mensal
      • 98% satisfação dos usuários
      • 6 regiões atendidas
      
      ---
      Parceiro Onde Tem - Tecnologia Farmacêutica
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'relatorio_onde_tem_completo.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2" size={20} />
          Resultados Onde Tem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Animated Indications Counter */}
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <Users className="mx-auto mb-3 text-blue-600" size={32} />
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {Math.floor(indicationsCount)}
          </div>
          <p className="text-gray-600 font-medium">Indicações no Mês</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-900">74</div>
            <div className="text-xs text-gray-600">Impressões Hoje</div>
            <div className="text-xs text-gray-500 mt-1">de 289 buscas</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-900">98%</div>
            <div className="text-xs text-gray-600">Satisfação</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-900">1,847</div>
            <div className="text-xs text-gray-600">Impressões Mensais</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-900">6</div>
            <div className="text-xs text-gray-600">Regiões</div>
          </div>
        </div>

        {/* Generate Report Button */}
        <Button 
          onClick={generateReport}
          className="w-full bg-green-500 hover:bg-green-600 text-white"
        >
          <FileText className="mr-2" size={16} />
          Download do Relatório Completo
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServiceImpact;
