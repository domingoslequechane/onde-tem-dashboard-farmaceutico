
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, X, MessageCircle, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EmergencyAlertProps {
  onClose: () => void;
}

const EmergencyAlert = ({ onClose }: EmergencyAlertProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVisible(false);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const handleHaveStock = () => {
    toast({
      title: "Cliente contactado!",
      description: "Chat iniciado com Maria Silva. Ela estará à caminho em 10 minutos.",
    });
    setIsVisible(false);
    onClose();
  };

  const handleNoStock = () => {
    toast({
      title: "Obrigado!",
      description: "Alerta encaminhado para outras farmácias próximas.",
    });
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center px-6 py-4 animate-fade-in">
      {/* Emergency Sound Effect Simulation */}
      <div className="absolute top-4 right-4 text-red-500 animate-pulse text-xs">
        🔊 ALERTA SONORO ATIVO
      </div>
      
      <Card className="w-full max-w-sm bg-red-50 border-red-200 shadow-2xl animate-scale-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-red-600 min-w-0 flex-1">
              <AlertTriangle className="animate-pulse mr-2 flex-shrink-0" size={18} />
              <span className="font-bold text-sm truncate">⚠️ SOS EMERGENCIAL</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setIsVisible(false); onClose(); }}
              className="text-gray-500 hover:text-gray-700 p-1 h-auto flex-shrink-0"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="text-center mb-6">
            <div className="text-lg font-bold text-red-700 mb-2">
              URGENTE: Cliente busca INSULINA
            </div>
            
            <div className="flex items-center justify-center text-gray-700 mb-2 text-sm">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">Maria Silva - 300m de distância</span>
            </div>
            
            <div className="text-xs text-gray-600 mb-4 px-2">
              "Preciso urgente, meu pai é diabético"
            </div>
            
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-500 mb-1">Tempo restante para responder:</div>
              <div className="text-lg font-bold text-red-600">{timeLeft}s</div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleHaveStock}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 text-sm"
            >
              <MessageCircle size={14} className="mr-2 flex-shrink-0" />
              <span className="truncate">TENHO ESTOQUE - Contactar Cliente</span>
            </Button>
            
            <Button 
              onClick={handleNoStock}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 font-medium py-3 text-sm"
            >
              NÃO TENHO - Encaminhar Alerta
            </Button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            Alerta será encaminhado automaticamente em {timeLeft}s
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyAlert;
