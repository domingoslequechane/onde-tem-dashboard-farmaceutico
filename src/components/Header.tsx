import { useNavigate, useLocation } from 'react-router-dom';
import ondeTemLogo from '@/assets/ondtem-logo.png';
import { Button } from '@/components/ui/button';
import { LogOut, User, Menu, Settings } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface HeaderProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
  isVerified?: boolean;
}

const Header = ({ user, onLogout, isVerified = false }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between relative">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={ondeTemLogo} 
              alt="ONDTem" 
              className="h-8 sm:h-10 md:h-12 w-auto object-contain" 
            />
          </div>

          {/* Mobile Badge - Centered */}
          {isVerified && !isAdminPage && (
            <div className="md:hidden absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-medium shadow-md whitespace-nowrap">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verificada</span>
            </div>
          )}
          
          {/* Desktop User Info & Actions */}
          <div className="hidden md:flex items-center gap-3">
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => isAdminPage ? navigate('/admin/settings') : navigate('/farmacia/settings')}
              title="Configurações"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User size={16} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium truncate max-w-[180px]">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user?.email}
                </p>
              </div>
              <Settings size={14} className="text-muted-foreground" />
            </div>

            {isVerified && !isAdminPage && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-medium shadow-md">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Verificada</span>
              </div>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9">
                  <LogOut size={14} />
                  Sair
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja sair do sistema? Você precisará fazer login novamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sim, Sair
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col gap-6 py-6">
                  <div 
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => isAdminPage ? navigate('/admin/settings') : navigate('/farmacia/settings')}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                      <User size={20} />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Settings size={16} className="text-muted-foreground flex-shrink-0" />
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2 justify-center">
                        <LogOut size={18} />
                        Sair do Sistema
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja sair? Você precisará fazer login novamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={onLogout}
                          className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sair
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
