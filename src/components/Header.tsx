
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface HeaderProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
}

const Header = ({ user, onLogout }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm sm:text-lg">?</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 truncate">Onde Tem?</h1>
            <p className="text-xs text-gray-500 hidden sm:block truncate">Dashboard Farmacêutico</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
          <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
            <User size={16} />
            <span className="max-w-24 xl:max-w-32 truncate">{user?.email}</span>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3"
              >
                <LogOut size={12} className="sm:size-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="mx-2 sm:mx-4 max-w-lg w-full">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base sm:text-lg">Confirmar Saída</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Tem certeza que deseja sair do sistema? Você precisará fazer login novamente para acessar o dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <AlertDialogCancel className="w-full sm:w-auto text-sm">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onLogout} className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-sm">
                  Sim, Sair
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
};

export default Header;
