import { useState, useEffect } from 'react';
import splashIcon from '@/assets/splash-icon.png';

interface SplashScreenProps {
  onFinish: () => void;
  minDuration?: number;
}

const SplashScreen = ({ onFinish, minDuration = 2000 }: SplashScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      onFinish();
    }, minDuration);

    return () => clearTimeout(timer);
  }, [onFinish, minDuration]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-[#4CAF50] to-[#26a74d]">
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <div className="relative">
          <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-sm p-4 shadow-2xl">
            <img 
              src={splashIcon} 
              alt="ONDTem" 
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
          </div>
          <span className="text-white text-lg font-semibold tracking-wide">
            ONDTem
          </span>
        </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
