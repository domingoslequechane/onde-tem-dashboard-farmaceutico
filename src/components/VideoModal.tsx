
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Play } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoId: string;
}

const VideoModal = ({ isOpen, onClose, videoTitle, videoId }: VideoModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg font-semibold truncate pr-2">
            {videoTitle}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 p-0"
          >
            <X size={16} />
          </Button>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Simulated Video Player */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900" />
            <div className="relative z-10 text-center text-white p-3 sm:p-4">
              <Play size={32} className="mx-auto mb-2 sm:mb-4" />
              <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{videoTitle}</h3>
              <p className="text-xs sm:text-sm opacity-90 px-2">
                {videoId === 'stock-management' && 'Aprenda a gerenciar seu estoque de forma eficiente e otimizada.'}
                {videoId === 'demand-analysis' && 'Entenda como analisar a demanda e tomar decisões estratégicas.'}
                {videoId === 'emergency-system' && 'Descubra como funciona o sistema de emergência do Onde Tem.'}
                {videoId === 'platform-integration' && 'Veja como integrar sua farmácia com nossa plataforma.'}
              </p>
              <div className="mt-3 sm:mt-4 text-xs opacity-75">
                ▶ Clique para reproduzir • Duração: 5:30
              </div>
            </div>
            
            {/* Play Button Overlay */}
            <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                <Play size={20} className="text-gray-800 ml-1" />
              </div>
            </button>
          </div>
          
          {/* Video Controls Simulation */}
          <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs sm:text-sm text-gray-600">
            <span>00:00 / 05:30</span>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="hover:text-gray-800 transition-colors">🔊</button>
              <button className="hover:text-gray-800 transition-colors">⚙️</button>
              <button className="hover:text-gray-800 transition-colors">⛶</button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoModal;
