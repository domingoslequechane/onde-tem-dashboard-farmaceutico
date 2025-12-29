import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X, Smartphone, Share } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import appIcon from '@/assets/splash-icon.png';

const InstallPWAModal = () => {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [hasDeclined, setHasDeclined] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if user has previously declined
    const declined = localStorage.getItem('pwa-install-declined');
    if (declined) {
      const declinedDate = new Date(declined);
      const now = new Date();
      const daysDiff = (now.getTime() - declinedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysDiff < 7) {
        setHasDeclined(true);
      }
    }
  }, []);

  useEffect(() => {
    // Show modal if not installed, can install or is iOS, and hasn't declined
    if (!isInstalled && !hasDeclined) {
      const timer = setTimeout(() => {
        if (isInstallable || isIOS) {
          setIsOpen(true);
        }
      }, 3000); // Wait 3 seconds before showing

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, hasDeclined, isIOS]);

  const handleInstall = async () => {
    await installPWA();
    setIsOpen(false);
  };

  const handleDecline = () => {
    localStorage.setItem('pwa-install-declined', new Date().toISOString());
    setHasDeclined(true);
    setIsOpen(false);
  };

  // Don't show if already installed
  if (isInstalled) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4CAF50] to-[#26a74d] p-3 shadow-lg">
            <img 
              src={appIcon} 
              alt="ONDTem" 
              className="w-full h-full object-contain"
            />
          </div>
          <DialogTitle className="text-xl font-bold">
            Instalar ONDTem
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Instale a aplicação para uma experiência mais rápida e acesso offline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Smartphone className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Acesso Rápido</p>
              <p className="text-xs text-muted-foreground">
                Abra diretamente do seu ecrã inicial
              </p>
            </div>
          </div>

          {isIOS ? (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Para instalar no iOS:
              </p>
              <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Share className="w-5 h-5 text-primary" />
                <span className="text-sm">
                  Toque em <strong>Partilhar</strong> e depois <strong>"Adicionar ao Ecrã Inicial"</strong>
                </span>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Entendi
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleDecline}
              >
                <X className="w-4 h-4 mr-2" />
                Agora não
              </Button>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleInstall}
                disabled={!isInstallable}
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallPWAModal;
