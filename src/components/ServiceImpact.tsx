
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, FileText, TrendingUp } from 'lucide-react';

const ServiceImpact = () => {
  const [clientCount, setClientCount] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  const testimonials = [
    "+15 novos clientes em 1 semana!",
    "Redução de 40% em consultas telefônicas",
    "Aumento de 25% nas vendas online",
    "Satisfação do cliente: 98%"
  ];

  // Animated counter
  useEffect(() => {
    const target = 127;
    const increment = target / 100;
    const timer = setInterval(() => {
      setClientCount(prev => {
        if (prev >= target) {
          clearInterval(timer);
          return target;
        }
        return Math.min(prev + increment, target);
      });
    }, 20);

    return () => clearInterval(timer);
  }, []);

  // Rotating testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const generateReport = () => {
    // Simulate PDF generation
    const reportContent = `
      RELATÓRIO ONDE TEM - FARMÁCIA CENTRAL
      =====================================
      
      Período: ${new Date().toLocaleDateString('pt-BR')}
      
      RESUMO EXECUTIVO:
      • Clientes atendidos: 127
      • Medicamentos monitorados: 15
      • Buscas realizadas: 144
      • Taxa de conversão: 85%
      
      MEDICAMENTOS MAIS PROCURADOS:
      1. Paracetamol - 47 buscas
      2. Insulina - 37 buscas  
      3. Amoxicilina - 32 buscas
      4. Omeprazol - 28 buscas
      
      IMPACTO DO SERVIÇO:
      • +15 novos clientes em 1 semana
      • Redução de 40% em consultas telefônicas
      • Aumento de 25% nas vendas online
      
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
        {/* Animated Client Counter */}
        <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
          <Users className="mx-auto mb-3 text-green-600" size={32} />
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {Math.floor(clientCount)}
          </div>
          <p className="text-gray-600 font-medium">Clientes Atendidos</p>
        </div>

        {/* Rotating Testimonials */}
        <div className="text-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <MessageCircle className="mx-auto mb-2 text-blue-600" size={24} />
          <p className="text-blue-800 font-medium transition-all duration-500">
            {testimonials[currentTestimonial]}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-900">144</div>
            <div className="text-xs text-gray-600">Buscas Hoje</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-900">85%</div>
            <div className="text-xs text-gray-600">Taxa Conversão</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-900">98%</div>
            <div className="text-xs text-gray-600">Satisfação</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-900">24h</div>
            <div className="text-xs text-gray-600">Tempo Médio</div>
          </div>
        </div>

        {/* Generate Report Button */}
        <Button 
          onClick={generateReport}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
        >
          <FileText className="mr-2" size={16} />
          Download do Relatório Completo
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServiceImpact;
