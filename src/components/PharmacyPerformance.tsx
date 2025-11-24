import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PharmacyPerformance = () => {
  const performanceScore = 91.2;
  const planningScore = 86;

  return (
    <Card className="bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 border-none shadow-xl text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-900/30 rounded-full -ml-24 -mb-24"></div>
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Performance da Farmácia</h3>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 text-sm">
            Ver mais <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30">
            <TrendingUp className="h-10 w-10" />
          </div>
          <div>
            <div className="text-5xl font-bold mb-1">{performanceScore}%</div>
            <div className="text-sm text-white/80">Pontuação Geral de Performance</div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold">{planningScore}%</span>
            <Badge variant="secondary" className="bg-white/20 text-white border-none">
              +25%
            </Badge>
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            Sua pontuação de planejamento de estoque aumentou 25% desde o último mês. Ótimo desempenho!
          </p>
        </div>

        <div className="flex gap-1 mt-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i === 0 ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default PharmacyPerformance;
