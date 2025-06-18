
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  duration: string;
}

const VideoModal = ({ isOpen, onClose, title, description, duration }: VideoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Video Player Simulation */}
          <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center relative">
            <div className="text-center text-white">
              <Play size={48} className="mx-auto mb-2 opacity-80" />
              <p className="text-sm opacity-60">Simulação de reprodução de vídeo</p>
              <p className="text-xs opacity-40 mt-1">Duração: {duration}</p>
            </div>
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Play size={24} className="text-white ml-1" />
              </div>
            </div>
          </div>
          
          {/* Video Description */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Sobre este tutorial</h4>
            <p className="text-sm text-gray-600">{description}</p>
          </div>

          {/* Video Controls Simulation */}
          <div className="flex items-center justify-between p-3 bg-gray-100 rounded">
            <div className="flex items-center space-x-3">
              <Play size={16} className="text-gray-600" />
              <span className="text-sm text-gray-600">0:00 / {duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Velocidade: 1x</span>
              <span className="text-xs text-gray-500">Qualidade: HD</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;
